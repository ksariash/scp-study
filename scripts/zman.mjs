import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';
import { compileZmanim, loadZmanAuthoring, REPO_ROOT, ZMAN_SOURCE_ROOT } from './zman-authoring.mjs';

const command = process.argv[2] || 'validate';

async function validate() {
  const { packages } = await loadZmanAuthoring();
  console.log(`Validated ${packages.length} Zman package(s): ${packages.map((pkg) => pkg.id).join(', ')}`);
}

async function compile(outputRoot = path.join(REPO_ROOT, 'public', 'cohorts')) {
  const { packages } = await compileZmanim({ outputRoot });
  console.log(`Compiled ${packages.length} Zman package(s) to ${path.relative(REPO_ROOT, outputRoot)}`);
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
else if (command === 'new') await newZman();
else throw new Error(`Unknown zman command: ${command}`);
