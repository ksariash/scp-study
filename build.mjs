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

async function validateCohortPackages() {
  const registrySource = await readFile(new URL('./public-src/cohorts/index.js', ROOT), 'utf8');
  const sandbox = { window: {} };
  runInNewContext(registrySource, sandbox);
  const registry = sandbox.window.SCP_COHORT_REGISTRY;
  if (!registry || !Array.isArray(registry.cohorts) || !registry.cohorts.length) {
    throw new Error('Cohort registry must contain at least one cohort.');
  }
  const ids = new Set();
  for (const cohort of registry.cohorts) {
    const id = String(cohort?.id || '').trim();
    if (!id || ids.has(id)) throw new Error(`Invalid or duplicate cohort ID: ${id || '(blank)'}`);
    ids.add(id);
    for (const file of COHORT_REQUIRED_FILES) {
      await readFile(new URL(`./public-src/cohorts/${id}/${file}`, ROOT));
    }
  }
  if (!ids.has(String(registry.defaultCohortId || ''))) {
    throw new Error('Cohort registry defaultCohortId must identify a configured cohort.');
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
