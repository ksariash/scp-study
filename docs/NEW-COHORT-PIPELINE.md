# New cohort creation pipeline for an LLM

This is the required content-production order when the inputs are full class notes, audio recordings, and example quizzes/tests. Example assessments guide scope; they are not the source of truth for halacha. The supplied class notes remain authoritative unless the course owner explicitly asks for outside verification.

## 1. Ingest and normalize source material

Inventory full notes, audio recordings, transcripts if available, and every example quiz/test. Record filenames, page counts, audio durations, and missing inputs. Preserve the course's terminology, spelling conventions, names, distinctions, and practical framing.

Do not silently repair apparent source errors from general knowledge. Flag contradictions or unsupported material.

## 2. Produce the concise review first

Create a concise review from the full notes. Use example questions only to identify what the instructor emphasizes and the granularity of testing.

Mark at least:
- MC-level facts and distinctions.
- Names/authority associations.
- Essay reasoning and qualifications.
- Practical exceptions and minority/majority positions indicated as test-relevant.

Use consistent highlights/markers so scope is auditable. Do not copy example question wording into the review.

## 3. Audit highlights against example assessments

Build a matrix: each example question → exact highlighted fact(s) needed to answer it.

Pass only when every example is answerable from highlighted material and no required authority, qualification, exception, or factual distinction is missing. If an example depends on something absent from the full notes, flag it rather than inventing support.

Revise the concise review until this audit passes. The audited highlights now define generation scope.

## 4. Generate original questions and essays from the highlights

At this stage, stop using the example questions as drafting material. Generate from the audited concise review plus supporting full notes.

MC rules:
- test a clear highlighted distinction or deliberate combination of highlighted facts;
- every correct answer must be source-supported;
- distractors may be plausible but must not teach false authority/position associations;
- do not copy or lightly paraphrase supplied examples.

Essay rules:
- derive topics from highlighted essay/name material;
- represent each graded relationship as an atomic authority/concept → complete position/qualification fact;
- each position block must stand alone; avoid “this case,” “that leniency,” and similar dependent language;
- model answers must contain every required atomic fact.

## 5. Audit generated coverage against the highlights

Build a second matrix: every highlighted fact → generated MC question(s), essay fact(s), or both.

Check for uncovered highlighted material, over-repeated topics, highlighted names missing from essays, lost qualifications/exceptions, and generated content outside the audited scope. Revise until coverage is intentional.

## 6. Process audio and mark locations

Review/transcribe each recording. Create stable audio review IDs.

For every MC question and every essay atomic fact, choose the best audio review, record the start time at the actual discussion, and use a descriptive label. If no relevant audio exists, record that rather than inventing a weak mapping.

## 7. Mark note locations

For every MC question and essay, record the concise-review page/location and full-notes page/location. Verify the jump lands at the actual discussion, not just the right chapter. If a finer PDF anchor is supported, verify it too.

## 8. Build the cohort package

Create `public-src/cohorts/<cohort-id>/` according to `docs/ARCHITECTURE.md`. Use a new permanent cohort ID and analytics key. Do not recycle an old ID for revised content.

## 9. Analytics readiness gate

Before the cohort becomes selectable:
- add its analytics key and question/essay catalog support to the analytics repo;
- verify the Analytics dashboard requires/selects the cohort;
- verify question and essay IDs are interpreted inside that cohort;
- verify feedback cannot collide with same-numbered content in another cohort.

Do not launch a second cohort while Analytics still assumes the first cohort catalog.

## 10. Final QA

Run the build validator, then smoke-test cohort selection, M/C, Essay, Test, categories, glossary, documents, representative note jumps, representative audio jumps/seeking, offline behavior, generated PDFs, analytics, and feedback.

Keep audit artifacts for steps 3 and 5. A future LLM should be able to explain why every generated assessment item exists and which highlighted source material supports it.
