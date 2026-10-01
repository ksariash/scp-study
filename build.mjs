import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { runInNewContext } from 'node:vm';
import { generatePdfs } from './scripts/generate-pdfs.mjs';

const ROOT = new URL('./', import.meta.url);
const sourceDir = new URL('./public-src/', ROOT);
const outputDir = new URL('./public/', ROOT);
const assetsDir = new URL('./assets/', ROOT);
const GENERATED_PDFS = new Set([
  'documents/SCP-Study-Cumulative-Test.pdf',
  'documents/SCP-Study-Cumulative-Test-Answer-Key.pdf',
  'documents/SCP-Study-Essay-Questions-and-Sample-Answers.pdf',
]);

const COHORT_REQUIRED_FILES = [
  'cohort.js',
  'questions.js',
  'chaburos.js',
  'audio-reviews.js',
  'glossary.js',
  'essay-practice.js',
  'course-notes.js',
];

async function loadCohortScript(id, file, expose = '') {
  const source = await readFile(new URL(`./public-src/cohorts/${id}/${file}`, ROOT), 'utf8');
  const sandbox = { window: {} };
  runInNewContext(source + expose, sandbox, { filename: `cohorts/${id}/${file}` });
  return sandbox;
}

function assertUnique(values, label) {
  const seen = new Set();
  for (const value of values) {
    const key = String(value);
    if (!key || seen.has(key)) throw new Error(`Duplicate or blank ${label}: ${key || '(blank)'}`);
    seen.add(key);
  }
}

function positivePage(value) {
  const raw = value && typeof value === 'object' ? value.page : value;
  return Number.isInteger(Number(raw)) && Number(raw) > 0;
}

async function validateCohortPackages() {
  const registrySource = await readFile(new URL('./public-src/cohorts/index.js', ROOT), 'utf8');
  const registrySandbox = { window: {} };
  runInNewContext(registrySource, registrySandbox, { filename: 'cohorts/index.js' });
  const registry = registrySandbox.window.SCP_COHORT_REGISTRY;
  if (!registry || !Array.isArray(registry.cohorts) || !registry.cohorts.length) {
    throw new Error('Cohort registry must contain at least one cohort.');
  }

  assertUnique(registry.cohorts.map(cohort => cohort?.id), 'cohort ID');
  assertUnique(registry.cohorts.map(cohort => cohort?.analyticsKey), 'cohort analyticsKey');

  const ids = new Set(registry.cohorts.map(cohort => String(cohort.id)));
  if (!ids.has(String(registry.defaultCohortId || ''))) {
    throw new Error('Cohort registry defaultCohortId must identify a configured cohort.');
  }

  for (const entry of registry.cohorts) {
    const id = String(entry.id);
    for (const file of COHORT_REQUIRED_FILES) {
      await readFile(new URL(`./public-src/cohorts/${id}/${file}`, ROOT));
    }

    const config = (await loadCohortScript(id, 'cohort.js')).window.SCP_COHORT_CONFIG;
    if (!config || config.id !== id || config.analyticsKey !== entry.analyticsKey || config.name !== entry.name) {
      throw new Error(`Cohort ${id}: cohort.js identity must match cohorts/index.js.`);
    }

    const qSandbox = await loadCohortScript(id, 'questions.js', '\nwindow.__QUESTIONS = QUESTIONS;');
    const questions = qSandbox.window.__QUESTIONS;
    if (!Array.isArray(questions) || questions.length !== Number(entry.questionCount)) {
      throw new Error(`Cohort ${id}: expected ${entry.questionCount} questions, found ${questions?.length ?? 'invalid'}.`);
    }
    assertUnique(questions.map(question => question.id), `${id} question ID`);
    for (const question of questions) {
      if (!question.category || !question.prompt || !Array.isArray(question.choices) || question.choices.length < 2 || !Array.isArray(question.answer) || !question.answer.length) {
        throw new Error(`Cohort ${id}: malformed question ${question.id}.`);
      }
      const valid = new Set(question.choices.map((_, index) => String.fromCharCode(65 + index)));
      if (question.answer.some(letter => !valid.has(String(letter)))) throw new Error(`Cohort ${id}: question ${question.id} has an invalid answer letter.`);
    }

    const eSandbox = await loadCohortScript(id, 'essay-practice.js');
    const essays = eSandbox.window.ESSAY_PRACTICE_DATA;
    if (!Array.isArray(essays) || essays.length !== Number(entry.essayCount)) {
      throw new Error(`Cohort ${id}: expected ${entry.essayCount} essays, found ${essays?.length ?? 'invalid'}.`);
    }
    assertUnique(essays.map(essay => essay.id), `${id} essay ID`);
    const facts = essays.flatMap(essay => essay.facts || []);
    assertUnique(facts.map(fact => fact.id), `${id} essay fact ID`);

    const audioSandbox = await loadCohortScript(id, 'audio-reviews.js',
      '\nwindow.__AUDIO = AUDIO_REVIEW_DATA; window.__QUESTION_AUDIO_MAP = QUESTION_AUDIO_MAP; window.__ESSAY_AUDIO_MAP = ESSAY_AUDIO_MAP;');
    const reviews = audioSandbox.window.__AUDIO;
    if (!Array.isArray(reviews) || !reviews.length) throw new Error(`Cohort ${id}: audio review catalog is empty.`);
    assertUnique(reviews.map(review => review.id), `${id} audio review ID`);
    const reviewIds = new Set(reviews.map(review => Number(review.id)));
    const expectedPrefix = String(config.audio?.publicUrlPrefix || '');
    for (const review of reviews) {
      if (!review.src || (expectedPrefix && !String(review.src).startsWith(expectedPrefix))) {
        throw new Error(`Cohort ${id}: audio review ${review.id} must use publicUrlPrefix ${expectedPrefix || '(configured prefix missing)'}.`);
      }
    }
    const validateAudioMap = (map, label) => {
      for (const [contentId, refs] of Object.entries(map || {})) {
        if (!Array.isArray(refs) || !refs.length) throw new Error(`Cohort ${id}: ${label} ${contentId} has no audio references.`);
        for (const ref of refs) {
          if (!reviewIds.has(Number(ref.review)) || !Number.isFinite(Number(ref.start)) || Number(ref.start) < 0) {
            throw new Error(`Cohort ${id}: ${label} ${contentId} has an invalid audio reference.`);
          }
        }
      }
    };
    validateAudioMap(audioSandbox.window.__QUESTION_AUDIO_MAP, 'question');
    validateAudioMap(audioSandbox.window.__ESSAY_AUDIO_MAP, 'essay fact');

    const notes = (await loadCohortScript(id, 'course-notes.js')).window.COURSE_NOTE_REFS;
    for (const docKey of ['compact', 'full']) {
      if (!notes?.docs?.[docKey]?.url) throw new Error(`Cohort ${id}: missing ${docKey} notes document.`);
    }
    for (const question of questions) {
      const ref = notes?.questions?.[String(question.id)];
      if (!ref || !positivePage(ref.compact) || !positivePage(ref.full)) throw new Error(`Cohort ${id}: question ${question.id} needs compact and full note locations.`);
    }
    for (const essay of essays) {
      const ref = notes?.essays?.[String(essay.id)];
      if (!ref || !positivePage(ref.compact) || !positivePage(ref.full)) throw new Error(`Cohort ${id}: essay ${essay.id} needs compact and full note locations.`);
    }

    const glossarySandbox = await loadCohortScript(id, 'glossary.js', '\nwindow.__GLOSSARY = GLOSSARY_TERMS;');
    const glossary = glossarySandbox.window.__GLOSSARY;
    if (!Array.isArray(glossary)) throw new Error(`Cohort ${id}: glossary must be an array.`);
    assertUnique(glossary.map(term => term.id), `${id} glossary ID`);
  }
  return registry;
}

const cohortRegistry = await validateCohortPackages();

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });
await cp(sourceDir, outputDir, { recursive: true });

const pdfJsOutput = new URL('./pdfjs/', outputDir);
await mkdir(pdfJsOutput, { recursive: true });
await cp(new URL('./node_modules/pdfjs-dist/legacy/build/pdf.mjs', ROOT), new URL('./pdf.mjs', pdfJsOutput));
await cp(new URL('./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs', ROOT), new URL('./pdf.worker.mjs', pdfJsOutput));

let encoded = '';
for (let i = 1; ; i++) {
  const part = new URL(`./static-binaries.tar.gz.b64.${String(i).padStart(2, '0')}.part`, assetsDir);
  try { encoded += await readFile(part, 'utf8'); }
  catch (error) { if (error?.code === 'ENOENT') break; throw error; }
}
if (!encoded) throw new Error('No static binary asset bundle parts found.');

const tar = gunzipSync(Buffer.from(encoded, 'base64'));
let offset = 0;
while (offset + 512 <= tar.length) {
  const header = tar.subarray(offset, offset + 512);
  if (header.every(byte => byte === 0)) break;

  const readString = (start, length) => header.subarray(start, start + length).toString('utf8').replace(/\0.*$/, '');
  const name = readString(0, 100);
  const prefix = readString(345, 155);
  const fullName = prefix ? `${prefix}/${name}` : name;
  const sizeText = readString(124, 12).trim();
  const size = sizeText ? Number.parseInt(sizeText, 8) : 0;
  const type = String.fromCharCode(header[156] || 48);
  const safeName = fullName.replace(/^\.\//, '');

  if (!safeName || safeName.startsWith('/') || safeName.split('/').includes('..')) {
    throw new Error(`Unsafe tar path: ${fullName}`);
  }

  const destination = new URL(`./${safeName}`, outputDir);
  if (type === '5') {
    await mkdir(destination, { recursive: true });
  } else if (type === '0' || type === '\0') {
    // Only the question/test/essay PDFs are regenerated. The compact course
    // review is a versioned static binary in the repository and is copied
    // unchanged from the asset bundle.
    if (!GENERATED_PDFS.has(safeName)) {
      await mkdir(dirname(destination.pathname), { recursive: true });
      await writeFile(destination, tar.subarray(offset + 512, offset + 512 + size));
    }
  }

  offset += 512 + Math.ceil(size / 512) * 512;
}

let fullNotesEncoded = '';
for (let i = 1; ; i++) {
  const part = new URL(`./full-course-notes.pdf.b64.${String(i).padStart(2, '0')}.part`, assetsDir);
  try { fullNotesEncoded += await readFile(part, 'utf8'); }
  catch (error) { if (error?.code === 'ENOENT') break; throw error; }
}
if (!fullNotesEncoded) throw new Error('No full course notes PDF asset parts found.');
const fullNotesDestination = new URL('./documents/SCP-Study-Full-Course-Notes.pdf', outputDir);
await mkdir(dirname(fullNotesDestination.pathname), { recursive: true });
await writeFile(fullNotesDestination, Buffer.from(fullNotesEncoded, 'base64'));

await generatePdfs(outputDir.pathname);

console.log(`Built SCP Study static assets for ${cohortRegistry.cohorts.length} cohort package(s); preserved the compact/full course notes and generated question/test/essay PDFs. Short & Sweet review audio remains in R2.`);
