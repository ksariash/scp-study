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
  await mkdir(dir, { recursive: false });
  await mkdir(path.join(dir, 'transcripts'));
  await mkdir(path.join(dir, 'documents'));
  const manifest = {
    schemaVersion: 1,
    id,
    name,
    assessmentTitle: name,
    startsOn,
    status: 'draft',
    legacyIds: [],
    contentVersion: 1,
    documentSource: 'package',
    audio: { migrationMode: 'canonical-only' },
    documents: {
      compactReview: 'SCP-Study-Compact-Course-Review.pdf', fullNotes: 'SCP-Study-Full-Course-Notes.pdf',
      cumulativeTest: 'SCP-Study-Cumulative-Test.pdf', cumulativeAnswerKey: 'SCP-Study-Cumulative-Test-Answer-Key.pdf',
      essayQuestionsAndAnswers: 'SCP-Study-Essay-Questions-and-Sample-Answers.pdf', glossary: 'SCP-Study-Course-Glossary.pdf',
    },
  };
  await writeFile(path.join(dir, 'zman.yaml'), YAML.stringify(manifest, { lineWidth: 100 }));
  for (const file of ['questions.yaml', 'essays.yaml', 'glossary.yaml']) await writeFile(path.join(dir, file), '[]\n');
  await writeFile(path.join(dir, 'audio-reviews.yaml'), 'reviews: []\n');
  await writeFile(path.join(dir, 'chaburos.yaml'), 'locationLabel: Location\nchaburaLabel: Chabura\nregions: []\n');
  await writeFile(path.join(dir, 'coverage-audit.yaml'), 'scopeCheck: TODO\ntopics: []\n');
  console.log(`Created draft ${path.relative(REPO_ROOT, dir)}. Fill in content and audit data, then run npm run zman:validate. Draft Zmanim are never emitted into the browser runtime.`);
}

if (command === 'validate') await validate();
else if (command === 'compile') await compile();
else if (command === 'new') await newZman();
else throw new Error(`Unknown zman command: ${command}`);
