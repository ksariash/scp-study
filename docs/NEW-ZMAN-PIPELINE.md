# New Zman creation pipeline for an LLM

Use this order when the inputs are full class notes, audio recordings, and example quizzes/tests. Example assessments guide scope; the supplied class notes remain authoritative unless the course owner explicitly requests outside verification.

## 1. Inventory source material

Record all full notes, audio, transcripts, and example assessments. Preserve course terminology, spellings, names, distinctions, and practical framing. Flag contradictions or missing source support instead of silently repairing them from general knowledge.

## 2. Produce and audit the concise review

Create the concise review from the full notes. Use example assessments only to identify emphasis and testing granularity.

Mark MC-level facts, authority/name associations, essay reasoning, qualifications, practical exceptions, and test-relevant minority/majority positions.

Build an audit matrix from each supplied example question to the exact highlighted source fact(s) needed to answer it. Revise until all examples are source-supported.

## 3. Generate original assessments from audited scope

Once scope is audited, stop using example-question wording as drafting material.

MC questions must test clear highlighted facts or deliberate combinations. Every correct answer must be supported; distractors must not teach false authority/position associations.

Essay practice must represent each graded relationship as an atomic authority/concept → complete position/qualification fact. Each fact must stand alone without dependent phrases such as “this case.”

## 4. Audit generated coverage

Build a second matrix from every highlighted fact to generated MC question(s), essay fact(s), or both. Check for gaps, over-repetition, missing authorities, lost qualifications, and material outside audited scope.

## 5. Process audio

Create stable audio review IDs and transcripts/timestamps where available. Map each question and essay fact to the best relevant review and actual start time. Record no mapping rather than inventing a weak one.

For R2, use:

`audio/<zman-id>/<filename>`

## 6. Mark note locations

For every MC question and essay, record concise-review and full-notes locations. Verify jumps land on the actual discussion, not merely the chapter.

## 7. Create the Zman package

Create the readable skeleton with:

`npm run zman:new -- <zman-id> <YYYY-MM-DD> "<display name>"`

Add the ID to `zmanim/registry.yaml`, then author the YAML and WebVTT files under `zmanim/<zman-id>/`. Follow `zmanim/README.md`; never create or hand-edit a `public/cohorts/` package.

Give the Zman a permanent ID. The build derives its analytics key from that ID so the two cannot drift. Do not recycle an earlier ID for revised material.

Set `contentVersion` deliberately. Increment it whenever a configured PDF is replaced at the same path so explicit offline document caches receive the new bytes. Legacy Zman IDs belong in `legacyIds` for migration; do not duplicate the canonical package under a legacy directory.

Run `npm run zman:validate` while authoring. Counts, runtime paths, audio maps, course-note maps, category maps, and compatibility JavaScript are derived; do not maintain them separately.

## 8. Analytics readiness gate

Before the Zman becomes selectable:
- add the stable Zman ID to Analytics;
- generate that Zman's question/essay/fact catalogs;
- ensure dashboard categories/options resolve inside that Zman;
- verify feedback identity is Zman-scoped;
- verify an ID valid only in another Zman is rejected;
- deploy and verify Analytics first.

## 9. Build and final QA

Run `npm run zman:validate` and `npm run build`, then smoke-test:
- Zman selection/switching;
- M/C, Essay, and Test;
- categories/glossary;
- documents and representative note jumps;
- audio and Range seeking;
- offline behavior/service-worker update;
- generated PDFs;
- analytics and feedback;
- notification inbox/push if enabled.

Keep the two coverage-audit artifacts so a future LLM can explain why each assessment item exists and which source material supports it.
