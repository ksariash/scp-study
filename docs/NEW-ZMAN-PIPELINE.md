# Zman assessment and content-generation pipeline for an LLM

Use this pipeline when the course owner supplies course notes and wants Study content generated from them. The supplied course materials are authoritative. Do not silently add, repair, reconcile, or replace course content from general knowledge.

## 1. Establish source roles

When the source package contains the three-document assessment workflow, the roles are strict:

1. **Highlighted concise notes** are the assessment-scope authority.
   - Yellow highlight means the highlighted knowledge must be tested by multiple choice.
   - Green highlight means the highlighted knowledge must be tested by essay practice.
   - A blue-highlighted name inside a yellow or green highlighted passage must be **explicitly tested** in the same assessment mode(s). It is not enough for the name merely to appear in a stem, explanation, model answer, or distractor; the learner must have to identify the name-to-rule/position relationship correctly.
   - If a blue name lies inside material carrying both yellow and green scope, explicitly test that association in both applicable modes.
2. **Non-highlighted concise notes** are the learner-facing compact-review document and the source for compact-note page links. They must have the same underlying course text as the highlighted copy. Differences other than highlight annotations are a stop condition that requires clarification.
3. **Full class notes** are the learner-facing full-notes document and the source for full-note page links. They may be used to clarify the meaning or wording of a highlighted concise point, but they do not expand assessment scope beyond the highlights.

If the highlighted concise notes, plain concise notes, and full notes cannot be reconciled without assuming a new rule, attribution, exception, or interpretation, stop and ask the course owner rather than inventing the answer.

## 2. Inventory highlighted scope

Extract every highlighted region and build a source audit before drafting questions.

A **distinct highlighted point** includes each separately testable rule, condition, exception, threshold, enumerated criterion, authority/name attribution, practical result, or materially different case stated inside the highlighted scope. Do not collapse two points merely because they occur in the same bullet or paragraph.

Coverage is semantic, not visual:
- a single well-designed question may test more than one tightly related yellow point only when each point is necessary to answer it correctly;
- merely mentioning a highlighted fact in the stem, explanation, or an incorrect option does not count as testing it;
- an enumerated list is covered only when the learner must know the required members or distinctions, not merely recognize the list's topic;
- blue-highlighted names require a direct name-to-position/rule association test.

Record page/region provenance for every extracted point so later coverage can be audited against the exact highlighted source.

If the course owner specifies a fixed assessment count, satisfy both the count and full highlighted coverage. If that cannot be done without ambiguous over-combination, duplicate questions, or inventing unsupported distinctions, stop and ask for clarification before drafting.

## 3. Generate original multiple-choice questions

Draft from the audited yellow scope, not from old Study questions or prior example-question wording.

Each multiple-choice item must:
- test one clear highlighted point or a deliberate, auditable combination of tightly related highlighted points;
- have every correct answer directly supported by the supplied notes;
- use distractors that are plausible in the local course context without teaching a false authority/position association;
- preserve qualifications such as lechatchilla/bedieved, ben-yomo/eino-ben-yomo, loss, timing, identity of the actor, and other conditions when those qualifications are part of the highlighted point;
- explicitly test every blue-highlighted name association within yellow scope.

Do not use the full notes to create an additional testable distinction that is absent from the highlighted concise scope.

## 4. Generate essay matching exercises

Essay practice is a generalized matching task, not an authority-specific schema.

Each essay contains one or more **pairing roots** and a response bank. Each root declares the response IDs that are correct for it. This relation graph must support one-to-one, one-to-many, many-to-one, and many-to-many relationships.

The learner selects one response for each pairing root. A response defaults to one use per essay; explicitly increase or make it reusable only when the source relationship requires many-to-one reuse.

For unordered-list prompts, use interchangeable roots such as `First`, `Second`, etc. If an essay asks for four criteria, all four roots may accept all four correct criteria while each correct response remains single-use. This grades the required set without inventing an order the notes do not teach.

Distractors must be credible but non-duplicative. They must be source-adjacent enough to challenge recall, must not duplicate or paraphrase a correct response into ambiguity, and must have no valid root edge.

Every green-highlighted distinct point must be represented in the essay set. Every blue-highlighted name inside green scope must be explicitly tested as a root/response relationship, not only stated in the model answer.

## 5. Audit generated coverage

Build a coverage matrix from every extracted highlighted point to the generated assessment item(s):
- yellow point -> one or more question IDs;
- green point -> one or more essay/root IDs;
- blue name -> the specific question or essay relationship that explicitly tests the name.

Check for gaps, accidental out-of-scope material, repeated questions that add no coverage, missing qualifications, missing names, and distractors that create false course associations.

Store the machine-reviewable audit with the Zman. Question `testedConcept` values and essay/root provenance should point back to this audit.

## 6. Process audio

Create stable audio review IDs and transcripts/timestamps where available. Map each question and essay pairing root to the best relevant review and actual start time. Record no mapping rather than inventing a weak one.

For R2, use `audio/<zman-id>/<filename>`.

## 7. Mark note locations

For every multiple-choice question and essay, record both compact-review and full-notes locations.

The compact page must resolve against the non-highlighted concise PDF. The full-notes page must resolve against the final converted/published full-notes PDF. Verify that jumps land on the actual discussion, not merely the correct chapter.

## 8. Create or replace the Zman package

For a normal new Zman, create the readable skeleton with:

`npm run zman:new -- <zman-id> <YYYY-MM-DD> "<display name>"`

Author under `zmanim/<zman-id>/`; never hand-author generated `public/cohorts/` runtime files.

A normal shipped Zman ID is permanent and must not be recycled for different material.

The **Summer 2026 development-to-production cutover is an explicit one-time exception**: the course owner has authorized replacing the pre-production `2026-summer` assessment package in place, followed by a full production database reset. For that cutover:
- retain the stable ID `2026-summer`;
- increment its `contentVersion`;
- deploy a server-side content-version fence before the reset so old/offline clients using the pre-cutover package cannot write stale records into the reset database;
- reset the database only after the new Study and Analytics content have passed final validation and the course owner has authorized the destructive cutover;
- after this cutover, return to the permanent-ID/no-reuse rule.

Run `npm run zman:validate` throughout authoring. Counts, runtime paths, audio maps, course-note maps, category maps, and compatibility JavaScript are derived and must not be maintained separately.

## 9. Analytics readiness gate

Before exposing new or replaced assessment content:
- update Analytics' accepted Zman/content-version pair;
- regenerate its question/essay/pairing-root catalogs from the canonical Study source;
- ensure dashboard categories/options resolve inside that content version;
- verify feedback identity is Zman-scoped and content-version-aware for the cutover;
- verify stale pre-cutover writes are rejected;
- deploy and verify Analytics first.

Only after this gate should Study expose the final production content.

## 10. Build and final QA

Run `npm run zman:validate` and `npm run build`, then smoke-test:
- exact configured multiple-choice and essay counts;
- highlighted-source coverage audit with no uncovered yellow/green/blue obligations;
- Questions, Essay Practice, and combined Test;
- one-to-one, one-to-many, many-to-one, and many-to-many essay matching;
- unordered-list matching without duplicate response use;
- categories/glossary;
- compact/full document downloads and representative page jumps;
- generated PDFs;
- audio and Range seeking;
- offline/service-worker update behavior;
- analytics, feedback, and stale-content-version rejection;
- notification/sync behavior where enabled.

For source-document changes, visually inspect the final published PDFs. Do not rely only on extracted text, particularly for mixed Hebrew/English content, tables, headers/footers, and Word-to-PDF conversion.

Keep the highlighted-scope audit with the Zman so a future human or LLM can explain exactly why every question and essay pairing exists.
