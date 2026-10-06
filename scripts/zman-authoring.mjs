import { access, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ZMAN_SOURCE_ROOT = path.join(REPO_ROOT, 'zmanim');
function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function unique(values, label) {
  const seen = new Set();
  for (const value of values) {
    invariant(!seen.has(value), `${label} must be unique; duplicate: ${value}`);
    seen.add(value);
  }
}

async function readYaml(file) {
  return YAML.parse(await readFile(file, 'utf8'));
}

export function formatVttTimestamp(totalSeconds) {
  const millis = Math.round(Number(totalSeconds) * 1000);
  const hours = Math.floor(millis / 3_600_000);
  const minutes = Math.floor((millis % 3_600_000) / 60_000);
  const seconds = Math.floor((millis % 60_000) / 1000);
  const ms = millis % 1000;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

function parseVttTimestamp(value, file) {
  const match = /^(\d{2,}):(\d{2}):(\d{2})\.(\d{3})$/.exec(value.trim());
  invariant(match, `${file}: invalid WebVTT timestamp: ${value}`);
  const millis = Number(match[1]) * 3_600_000 + Number(match[2]) * 60_000 + Number(match[3]) * 1000 + Number(match[4]);
  return millis / 1000;
}

export function parseVtt(source, file = 'transcript.vtt') {
  const normalized = source.replace(/\r\n?/g, '\n').trim();
  invariant(normalized.startsWith('WEBVTT'), `${file}: transcript must start with WEBVTT`);
  const blocks = normalized.slice(6).trim().split(/\n{2,}/).filter(Boolean);
  return blocks.map((block, index) => {
    const lines = block.split('\n');
    const timingIndex = lines.findIndex((line) => line.includes('-->'));
    invariant(timingIndex >= 0, `${file}: cue ${index + 1} has no timing line`);
    const [start, endWithSettings] = lines[timingIndex].split(/\s+-->\s+/);
    const end = endWithSettings.split(/\s+/)[0];
    const text = lines.slice(timingIndex + 1).join('\n').trim();
    invariant(text, `${file}: cue ${index + 1} has no text`);
    return { start: parseVttTimestamp(start, file), end: parseVttTimestamp(end, file), text };
  });
}

async function loadPackage(dir, id) {
  const base = path.join(dir, id);
  const [manifest, questions, essays, glossary, audioReviews, chaburos, coverageAudit] = await Promise.all([
    readYaml(path.join(base, 'zman.yaml')),
    readYaml(path.join(base, 'questions.yaml')),
    readYaml(path.join(base, 'essays.yaml')),
    readYaml(path.join(base, 'glossary.yaml')),
    readYaml(path.join(base, 'audio-reviews.yaml')),
    readYaml(path.join(base, 'chaburos.yaml')),
    readYaml(path.join(base, 'coverage-audit.yaml')),
  ]);
  const reviews = audioReviews.reviews || [];
  if (manifest.documentSource === 'package') {
    for (const key of ['compactReview', 'fullNotes']) {
      const file = manifest.documents?.[key];
      if (typeof file !== 'string' || file !== path.basename(file)) throw new Error(`${id}: invalid packaged document filename for ${key}`);
      try {
        await access(path.join(base, 'documents', file));
      } catch {
        throw new Error(`${id}: missing packaged document ${file}`);
      }
    }
  }
  for (const review of reviews) {
    const transcriptFile = path.join(base, review.transcript);
    review._transcript = parseVtt(await readFile(transcriptFile, 'utf8'), transcriptFile);
  }
  return { id, base, manifest, questions, essays, glossary, audioReviews, chaburos, coverageAudit };
}

export async function loadZmanAuthoring(sourceRoot = ZMAN_SOURCE_ROOT) {
  const registry = await readYaml(path.join(sourceRoot, 'registry.yaml'));
  const entries = await readdir(sourceRoot, { withFileTypes: true });
  const ids = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  const packages = await Promise.all(ids.map((id) => loadPackage(sourceRoot, id)));
  validateAuthoring(registry, packages);
  return { registry, packages };
}


function normalizedTextKey(value) {
  return String(value || '').normalize('NFKC').toLocaleLowerCase('en-US').replace(/\s+/g, ' ').trim();
}

function normalizedEssayPairings(essay) {
  if (essay?.pairings && typeof essay.pairings === 'object') {
    return {
      roots: Array.isArray(essay.pairings.roots) ? essay.pairings.roots : [],
      responses: Array.isArray(essay.pairings.responses) ? essay.pairings.responses : [],
      legacy: false,
    };
  }
  const facts = Array.isArray(essay?.facts) ? essay.facts : [];
  return {
    roots: facts.map((fact) => ({
      id: fact.id,
      label: fact.authority,
      context: fact.label,
      accepts: [fact.id],
      reviewClips: fact.reviewClips || [],
    })),
    responses: facts.map((fact) => ({
      id: fact.id,
      text: fact.position,
      maxUses: 1,
    })),
    legacy: true,
  };
}

function responseMaxUses(response) {
  if (response?.maxUses === 'unlimited') return Number.POSITIVE_INFINITY;
  if (response?.maxUses == null) return 1;
  return Number(response.maxUses);
}

function essayPairingGraphIsSolvable(pairings) {
  const roots = [...pairings.roots].sort((a, b) => a.accepts.length - b.accepts.length);
  const limits = new Map(pairings.responses.map((response) => [response.id, responseMaxUses(response)]));
  const uses = new Map();
  const visit = (index) => {
    if (index >= roots.length) return true;
    for (const responseId of roots[index].accepts) {
      const used = uses.get(responseId) || 0;
      const limit = limits.get(responseId) || 0;
      if (used >= limit) continue;
      uses.set(responseId, used + 1);
      if (visit(index + 1)) return true;
      if (used) uses.set(responseId, used);
      else uses.delete(responseId);
    }
    return false;
  };
  return visit(0);
}

export function validateAuthoring(registry, packages) {
  invariant(registry?.schemaVersion === 1, 'zmanim/registry.yaml: schemaVersion must be 1');
  const ids = packages.map((pkg) => pkg.id);
  unique(ids, 'Zman IDs');
  invariant(ids.includes(registry.defaultZmanId), 'registry defaultZmanId must name an existing Zman');
  invariant(ids.includes(registry.latestZmanId), 'registry latestZmanId must name an existing Zman');
  const packagesById = new Map(packages.map((pkg) => [pkg.id, pkg]));
  invariant(packagesById.get(registry.defaultZmanId)?.manifest.status !== 'draft', 'registry defaultZmanId cannot point to a draft Zman');
  invariant(packagesById.get(registry.latestZmanId)?.manifest.status !== 'draft', 'registry latestZmanId cannot point to a draft Zman');

  const legacyIds = [];
  for (const pkg of packages) {
    const { id, manifest, questions, essays, glossary, audioReviews, chaburos, coverageAudit } = pkg;
    invariant(manifest?.schemaVersion === 1, `${id}/zman.yaml: schemaVersion must be 1`);
    invariant(manifest.id === id, `${id}/zman.yaml: id must match its directory name`);
    invariant(typeof manifest.name === 'string' && manifest.name.trim(), `${id}: name is required`);
    invariant(typeof manifest.assessmentTitle === 'string' && manifest.assessmentTitle.trim(), `${id}: assessmentTitle is required`);
    invariant(/^\d{4}-\d{2}-\d{2}$/.test(manifest.startsOn), `${id}: startsOn must be YYYY-MM-DD`);
    invariant(['draft', 'upcoming', 'current', 'archived'].includes(manifest.status), `${id}: invalid status`);
    invariant(Number.isInteger(manifest.contentVersion) && manifest.contentVersion > 0, `${id}: contentVersion must be a positive integer`);
    invariant(['package', 'legacy-root'].includes(manifest.documentSource), `${id}: documentSource must be package or legacy-root`);
    invariant(Array.isArray(manifest.legacyIds), `${id}: legacyIds must be an array`);
    legacyIds.push(...manifest.legacyIds);
    const requiredDocumentKeys = ['compactReview', 'fullNotes', 'cumulativeTest', 'cumulativeAnswerKey', 'essayQuestionsAndAnswers', 'glossary'];
    invariant(manifest.documents && requiredDocumentKeys.every((key) => typeof manifest.documents[key] === 'string') && Object.keys(manifest.documents).length === requiredDocumentKeys.length, `${id}: all six document filenames are required`);
    for (const [key, file] of Object.entries(manifest.documents)) {
      invariant(typeof file === 'string' && file === path.basename(file), `${id}: document ${key} must be a filename, not a path`);
    }

    invariant(Array.isArray(questions) && questions.length, `${id}/questions.yaml must contain questions`);
    unique(questions.map((q) => q.id), `${id} question IDs`);
    for (const q of questions) {
      invariant(q.category && q.prompt && q.type, `${id}: question ${q.id} needs category, prompt, and type`);
      invariant(typeof q.testedConcept === 'string' && q.testedConcept.trim(), `${id}: question ${q.id} needs testedConcept for the answer-key audit`);
      invariant(['single', 'multi', 'truefalse'].includes(q.type), `${id}: question ${q.id} has unsupported type ${q.type}`);
      invariant(Array.isArray(q.choices) && q.choices.length >= 2, `${id}: question ${q.id} needs choices`);
      invariant(Array.isArray(q.answer) && q.answer.length > 0, `${id}: question ${q.id} has invalid answer`);
      const validAnswers = q.choices.map((_, index) => String.fromCharCode(65 + index));
      invariant(q.answer.every((answer) => validAnswers.includes(answer)), `${id}: question ${q.id} answer must use its choice letters`);
      invariant(q.type === 'multi' || q.answer.length === 1, `${id}: question ${q.id} must have exactly one answer`);
      invariant(q.notes?.compact && q.notes?.full, `${id}: question ${q.id} needs compact/full note pages`);
    }

    invariant(Array.isArray(essays) && essays.length, `${id}/essays.yaml must contain essays`);
    unique(essays.map((essay) => essay.id), `${id} essay IDs`);
    const pairingRootIds = [];
    for (const essay of essays) {
      invariant(essay.title && essay.prompt && essay.modelAnswer, `${id}: essay ${essay.id} needs title, prompt, and modelAnswer`);
      invariant(essay.notes?.compact && essay.notes?.full, `${id}: essay ${essay.id} needs compact/full note pages`);
      invariant(Array.isArray(essay.tags), `${id}: essay ${essay.id} needs tags (use [] for none)`);
      const pairings = normalizedEssayPairings(essay);
      invariant(pairings.roots.length, `${id}: essay ${essay.id} needs pairing roots`);
      invariant(pairings.responses.length, `${id}: essay ${essay.id} needs pairing responses`);
      unique(pairings.roots.map((root) => root.id), `${id} essay ${essay.id} pairing root IDs`);
      unique(pairings.responses.map((response) => response.id), `${id} essay ${essay.id} response IDs`);
      pairingRootIds.push(...pairings.roots.map((root) => root.id));
      const responseIds = new Set(pairings.responses.map((response) => response.id));
      const acceptedBy = new Map(pairings.responses.map((response) => [response.id, 0]));
      const textKeys = pairings.responses.map((response) => normalizedTextKey(response.text));
      invariant(textKeys.every(Boolean), `${id}: essay ${essay.id} response text is required`);
      unique(textKeys, `${id} essay ${essay.id} normalized response text`);
      for (const response of pairings.responses) {
        invariant(response.id && typeof response.text === 'string' && response.text.trim(), `${id}: essay ${essay.id} has an incomplete response`);
        const maxUses = responseMaxUses(response);
        invariant(maxUses === Number.POSITIVE_INFINITY || (Number.isInteger(maxUses) && maxUses >= 1), `${id}: essay ${essay.id} response ${response.id} maxUses must be a positive integer or "unlimited"`);
      }
      for (const root of pairings.roots) {
        invariant(root.id && typeof root.label === 'string' && root.label.trim(), `${id}: essay ${essay.id} has an incomplete pairing root`);
        invariant(Array.isArray(root.accepts) && root.accepts.length, `${id}: essay ${essay.id} root ${root.id} needs at least one accepted response`);
        unique(root.accepts, `${id} essay ${essay.id} root ${root.id} accepts`);
        for (const responseId of root.accepts) {
          invariant(responseIds.has(responseId), `${id}: essay ${essay.id} root ${root.id} accepts missing response ${responseId}`);
          acceptedBy.set(responseId, (acceptedBy.get(responseId) || 0) + 1);
        }
      }
      for (const response of pairings.responses) {
        const count = acceptedBy.get(response.id) || 0;
        if (response.distractor === true) invariant(count === 0, `${id}: essay ${essay.id} distractor ${response.id} cannot be accepted by a root`);
        else invariant(count > 0, `${id}: essay ${essay.id} response ${response.id} is unused; mark it distractor: true or connect it to a root`);
      }
      invariant(essayPairingGraphIsSolvable(pairings), `${id}: essay ${essay.id} pairing graph has no complete assignment under response maxUses limits`);
    }
    unique(pairingRootIds, `${id} essay pairing root IDs`);

    invariant(Array.isArray(glossary) && glossary.length, `${id}/glossary.yaml must contain terms`);
    unique(glossary.map((term) => term.id), `${id} glossary IDs`);
    for (const term of glossary) {
      invariant(term.term && term.definition, `${id}: glossary ${term.id} needs term and definition`);
      invariant(Array.isArray(term.categories), `${id}: glossary ${term.id} needs categories (use [] for none)`);
    }

    const reviews = audioReviews?.reviews;
    invariant(Array.isArray(reviews) && reviews.length, `${id}/audio-reviews.yaml must have reviews`);
    unique(reviews.map((review) => review.id), `${id} audio review IDs`);
    const reviewIds = new Set(reviews.map((review) => review.id));
    for (const review of reviews) {
      invariant(review.id && Number.isInteger(review.number) && review.title && review.file && review.transcript, `${id}: incomplete audio review`);
      invariant(review.file === path.basename(review.file), `${id}: audio review ${review.id} file must be a filename`);
      invariant(/^transcripts\/[a-z0-9][a-z0-9._-]*\.vtt$/i.test(review.transcript), `${id}: audio review ${review.id} transcript must be a transcripts/*.vtt path`);
    }
    const reviewClips = [
      ...questions.flatMap((question) => question.reviewClips || []),
      ...essays.flatMap((essay) => normalizedEssayPairings(essay).roots.flatMap((root) => root.reviewClips || [])),
    ];
    for (const clip of reviewClips) {
      invariant(reviewIds.has(clip.review), `${id}: review clip references missing review ${clip.review}`);
      invariant(typeof clip.start === 'number' && clip.start >= 0 && typeof clip.label === 'string' && clip.label.trim(), `${id}: invalid review clip`);
    }
    invariant(chaburos?.locationLabel && chaburos?.chaburaLabel && Array.isArray(chaburos.regions) && chaburos.regions.length, `${id}: invalid chaburos.yaml`);
    unique(chaburos.regions.map((region) => region.name), `${id} chabura region names`);
    for (const region of chaburos.regions) invariant(Array.isArray(region.ravs), `${id}: ${region.name} ravs must be a list`);
    invariant(typeof coverageAudit?.scopeCheck === 'string' && coverageAudit.scopeCheck.trim() && coverageAudit.scopeCheck.trim() !== 'TODO', `${id}: coverage-audit.yaml needs a reviewed scopeCheck`);
    invariant(Array.isArray(coverageAudit?.topics) && coverageAudit.topics.length, `${id}: coverage-audit.yaml needs audited topics`);
    const questionIds = new Set(questions.map((question) => question.id));
    const coveredQuestionIds = new Set();
    for (const item of coverageAudit.topics) {
      invariant(typeof item.topic === 'string' && item.topic.trim() && Array.isArray(item.questions) && item.questions.length, `${id}: invalid coverage-audit topic`);
      for (const questionId of item.questions) {
        invariant(questionIds.has(questionId), `${id}: coverage audit references missing question ${questionId}`);
        coveredQuestionIds.add(questionId);
      }
    }
    invariant(questions.every((question) => coveredQuestionIds.has(question.id)), `${id}: coverage audit must account for every question`);
  }
  unique(legacyIds, 'legacy Zman IDs');
}

function documentUrl(id, file) {
  return `documents/${id}/${file}`;
}

function runtimePackage(pkg) {
  const { id, manifest, questions, essays, glossary, audioReviews, chaburos } = pkg;
  const audioPublicPrefix = `/audio/${id}/`;
  const audioR2ObjectPrefix = `audio/${id}/`;
  const config = {
    id,
    name: manifest.name,
    analyticsKey: id,
    status: manifest.status,
    legacyIds: manifest.legacyIds,
    contentVersion: manifest.contentVersion,
    questionCount: questions.length,
    essayCount: essays.length,
    audio: {
      publicUrlPrefix: audioPublicPrefix,
      r2ObjectPrefix: audioR2ObjectPrefix,
      migrationMode: manifest.audio?.migrationMode || 'canonical-only',
      ...(manifest.audio?.legacyR2ObjectPrefix ? { legacyR2ObjectPrefix: manifest.audio.legacyR2ObjectPrefix } : {}),
    },
    documents: Object.fromEntries(Object.entries(manifest.documents).map(([key, file]) => [key, documentUrl(id, file)])),
    essayCategoryTags: Object.fromEntries(essays.filter((essay) => essay.tags.length).map((essay) => [essay.id, essay.tags])),
    glossaryCategoryLinks: Object.fromEntries(glossary.filter((term) => term.categories.length).map((term) => [term.id, term.categories])),
  };

  const runtimeQuestions = questions.map(({ notes, reviewClips, testedConcept, provenance, ...question }) => question);
  const runtimeEssays = essays.map(({ notes, tags, facts, pairings, provenance, ...essay }) => {
    const normalized = normalizedEssayPairings({ facts, pairings });
    const runtimePairings = {
      roots: normalized.roots.map(({ reviewClips, provenance: rootProvenance, ...root }) => ({ ...root })),
      responses: normalized.responses.map(({ provenance: responseProvenance, ...response }) => ({ ...response })),
    };
    const legacyFacts = normalized.legacy ? facts.map(({ authority, position, reviewClips, ...fact }) => ({
      ...fact,
      tokens: [[`${fact.id}a`, authority], [`${fact.id}b`, position]],
    })) : [];
    return { ...essay, pairings: runtimePairings, facts: legacyFacts, distractors: [] };
  });
  const runtimeGlossary = glossary.map(({ categories, ...term }) => term);
  const reviews = audioReviews.reviews.map(({ file, transcript, _transcript, ...review }) => ({
    ...review,
    src: `${audioPublicPrefix}${file}`,
    transcript: _transcript,
  }));
  const questionAudioMap = Object.fromEntries(questions.filter((q) => q.reviewClips?.length).map((q) => [q.id, q.reviewClips]));
  const essayAudioMap = Object.fromEntries(essays.flatMap((essay) => normalizedEssayPairings(essay).roots.filter((root) => root.reviewClips?.length).map((root) => [root.id, root.reviewClips])));
  const documents = {
    compact: { key: 'compact', title: manifest.documentTitles?.compact || 'Compact Course Review', url: config.documents.compactReview },
    full: { key: 'full', title: manifest.documentTitles?.full || 'Full Course Notes', url: config.documents.fullNotes },
  };
  const questionNotePages = Object.fromEntries(questions.map((q) => [q.id, q.notes]));
  const essayNotePages = Object.fromEntries(essays.map((essay) => [essay.id, essay.notes]));
  const chaburaData = {
    questions: [
      { id: 'location', label: chaburos.locationLabel, type: 'select', options: chaburos.regions.map((region) => region.name) },
      { id: 'chabura', label: chaburos.chaburaLabel, type: 'select', dependsOn: 'location', optionsByLocation: Object.fromEntries(chaburos.regions.map((region) => [region.name, region.ravs])) },
    ],
  };
  return { config, runtimeQuestions, runtimeEssays, runtimeGlossary, reviews, questionAudioMap, essayAudioMap, documents, questionNotePages, essayNotePages, chaburaData };
}

function js(value) {
  return JSON.stringify(value, null, 2);
}

function renderPackageFiles(pkg) {
  const data = runtimePackage(pkg);
  return {
    'cohort.js': `window.SCP_ZMAN_CONFIG = ${js(data.config)};\nwindow.SCP_COHORT_CONFIG = window.SCP_ZMAN_CONFIG;\n`,
    'questions.js': `const QUESTIONS = ${js(data.runtimeQuestions)};\n`,
    'essay-practice.js': `(() => {\n  'use strict';\n  window.ESSAY_PRACTICE_DATA = ${js(data.runtimeEssays)};\n})();\n`,
    'audio-reviews.js': `const AUDIO_REVIEW_DATA = ${js(data.reviews)};\nconst QUESTION_AUDIO_MAP = ${js(data.questionAudioMap)};\nconst ESSAY_AUDIO_MAP = ${js(data.essayAudioMap)};\n`,
    'glossary.js': `const GLOSSARY_TERMS = ${js(data.runtimeGlossary)};\n`,
    'chaburos.js': `window.SCP_CHABURA_DATA = ${js(data.chaburaData)};\n`,
    'course-notes.js': `window.COURSE_NOTE_REFS = ${js({ docs: data.documents, questions: data.questionNotePages, essays: data.essayNotePages })};\n`,
  };
}

function renderRegistry(registry, packages) {
  const zmanim = packages.map((pkg) => ({
    id: pkg.id,
    name: pkg.manifest.name,
    analyticsKey: pkg.id,
    status: pkg.manifest.status,
    startsOn: pkg.manifest.startsOn,
    path: `cohorts/${pkg.id}`,
    legacyIds: pkg.manifest.legacyIds,
    questionCount: pkg.questions.length,
    essayCount: pkg.essays.length,
  }));
  const value = { version: 2, defaultZmanId: registry.defaultZmanId, latestZmanId: registry.latestZmanId, zmanim };
  return `window.SCP_ZMAN_REGISTRY = ${js(value)};\nwindow.SCP_COHORT_REGISTRY = {\n  version: window.SCP_ZMAN_REGISTRY.version,\n  defaultCohortId: window.SCP_ZMAN_REGISTRY.defaultZmanId,\n  latestZmanId: window.SCP_ZMAN_REGISTRY.latestZmanId,\n  cohorts: window.SCP_ZMAN_REGISTRY.zmanim\n};\n`;
}

export async function compileZmanim({ sourceRoot = ZMAN_SOURCE_ROOT, outputRoot } = {}) {
  invariant(outputRoot, 'compileZmanim requires outputRoot');
  const { registry, packages } = await loadZmanAuthoring(sourceRoot);
  const deployablePackages = packages.filter((pkg) => pkg.manifest.status !== 'draft');
  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(outputRoot, { recursive: true });
  await writeFile(path.join(outputRoot, 'index.js'), renderRegistry(registry, deployablePackages));
  for (const pkg of deployablePackages) {
    const dir = path.join(outputRoot, pkg.id);
    await mkdir(dir, { recursive: true });
    for (const [file, contents] of Object.entries(renderPackageFiles(pkg))) await writeFile(path.join(dir, file), contents);
  }
  return { registry, packages: deployablePackages, authoringPackages: packages };
}
