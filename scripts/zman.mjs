import assert from 'node:assert/strict';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import YAML from 'yaml';
import { compileZmanim, loadZmanAuthoring, REPO_ROOT, RUNTIME_FILES, ZMAN_SOURCE_ROOT } from './zman-authoring.mjs';

const command = process.argv[2] || 'validate';

async function validate() {
  const { packages } = await loadZmanAuthoring();
  console.log(`Validated ${packages.length} Zman package(s): ${packages.map((pkg) => pkg.id).join(', ')}`);
}

async function compile(outputRoot = path.join(REPO_ROOT, 'public', 'cohorts')) {
  const { packages } = await compileZmanim({ outputRoot });
  console.log(`Compiled ${packages.length} Zman package(s) to ${path.relative(REPO_ROOT, outputRoot)}`);
}

function evaluateRuntime(file, source) {
  const context = { window: {} };
  vm.createContext(context);
  const expose = {
    'questions.js': 'window.__value = QUESTIONS;',
    'essay-practice.js': 'window.__value = window.ESSAY_PRACTICE_DATA;',
    'audio-reviews.js': 'window.__value = { reviews: AUDIO_REVIEW_DATA, questions: QUESTION_AUDIO_MAP, essays: ESSAY_AUDIO_MAP };',
    'glossary.js': 'window.__value = GLOSSARY_TERMS;',
    'cohort.js': 'window.__value = window.SCP_ZMAN_CONFIG;',
    'chaburos.js': 'window.__value = window.SCP_CHABURA_DATA;',
    'course-notes.js': 'window.__value = window.COURSE_NOTE_REFS;',
  }[file];
  vm.runInContext(`${source}\n${expose}`, context, { filename: file });
  return JSON.parse(JSON.stringify(context.window.__value));
}

async function compareLegacy() {
  const generatedRoot = path.join(REPO_ROOT, '.zman-runtime-compare');
  await compileZmanim({ outputRoot: generatedRoot });
  try {
    const legacyRegistry = await readFile(path.join(REPO_ROOT, 'public-src', 'cohorts', 'index.js'), 'utf8');
    const generatedRegistry = await readFile(path.join(generatedRoot, 'index.js'), 'utf8');
    const registryContext = (source) => {
      const context = { window: {} };
      vm.createContext(context);
      vm.runInContext(source, context);
      return JSON.parse(JSON.stringify(context.window.SCP_ZMAN_REGISTRY));
    };
    assert.deepStrictEqual(registryContext(generatedRegistry), registryContext(legacyRegistry), 'registry differs');
    const { packages } = await loadZmanAuthoring();
    for (const pkg of packages) {
      for (const file of RUNTIME_FILES) {
        const legacy = await readFile(path.join(REPO_ROOT, 'public-src', 'cohorts', pkg.id, file), 'utf8');
        const generated = await readFile(path.join(generatedRoot, pkg.id, file), 'utf8');
        assert.deepStrictEqual(evaluateRuntime(file, generated), evaluateRuntime(file, legacy), `${pkg.id}/${file} differs`);
      }
    }
    console.log('Generated Zman runtime is semantically identical to the legacy runtime.');
  } finally {
    await rm(generatedRoot, { recursive: true, force: true });
  }
}

async function newZman() {
  const [id, startsOn, ...nameParts] = process.argv.slice(3);
  const name = nameParts.join(' ').trim();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id || '') || !/^\d{4}-\d{2}-\d{2}$/.test(startsOn || '') || !name) {
    throw new Error('Usage: npm run zman:new -- <id> <YYYY-MM-DD> <display name>');
  }
  const dir = path.join(ZMAN_SOURCE_ROOT, id);
  await mkdir(path.join(dir, 'transcripts'), { recursive: false });
  const manifest = {
    schemaVersion: 1,
    id,
    name,
    startsOn,
    status: 'upcoming',
    legacyIds: [],
    contentVersion: 1,
    audio: { migrationMode: 'canonical-only' },
    documents: {
      compactReview: 'compact-course-review.pdf', fullNotes: 'full-course-notes.pdf',
      cumulativeTest: 'cumulative-test.pdf', cumulativeAnswerKey: 'cumulative-test-answer-key.pdf',
      essayQuestionsAndAnswers: 'essay-questions-and-answers.pdf', glossary: 'glossary.pdf',
    },
  };
  await writeFile(path.join(dir, 'zman.yaml'), YAML.stringify(manifest, { lineWidth: 100 }));
  for (const file of ['questions.yaml', 'essays.yaml', 'glossary.yaml']) await writeFile(path.join(dir, file), '[]\n');
  await writeFile(path.join(dir, 'audio-reviews.yaml'), 'reviews: []\n');
  await writeFile(path.join(dir, 'chaburos.yaml'), 'locationLabel: Location\nchaburaLabel: Chabura\nregions: []\n');
  console.log(`Created ${path.relative(REPO_ROOT, dir)}. Add it to zmanim/registry.yaml, fill in content, then run npm run zman:validate.`);
}

if (command === 'validate') await validate();
else if (command === 'compile') await compile();
else if (command === 'compare-legacy') await compareLegacy();
else if (command === 'new') await newZman();
else throw new Error(`Unknown zman command: ${command}`);
