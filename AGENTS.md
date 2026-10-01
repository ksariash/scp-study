# SCP Study — LLM operating guide

This file is the first file an LLM should read before modifying this repository. Treat it as part of the application architecture, not optional documentation. If a code change makes any statement here inaccurate, update this file in the same commit.

## What this repository is

SCP Study is a reusable PWA shell plus cohort-specific study content. The shell lives in `public-src/`; cohort content lives under `public-src/cohorts/<cohort-id>/`. The deployed Worker serves static assets and streams Short & Sweet review audio from the private R2 bucket through same-origin `/audio/*` URLs.

The current cohort is `nat-bar-nat-stam-yeinam-summer-26`. Do not hard-code its question count, essay count, categories, names, notes, or audio into reusable app logic.

## Read before editing

1. Fetch current `main`. Never assume a prior commit or generated `public/` tree is current.
2. Read `docs/ARCHITECTURE.md` for boundaries and invariants.
3. For course-content work, read `docs/NEW-COHORT-PIPELINE.md` and the active cohort package.
4. The class source files supplied by the course owner are authoritative. Preserve their terminology and framing. Do not silently replace a course statement with outside halachic knowledge.
5. Run `npm run build` before committing. The build validates every registered cohort.

## Canonical sources

Never hand-edit generated `public/`.

Reusable shell:
- `public-src/index.html`
- `public-src/styles.css`
- `public-src/app.js`
- `public-src/sw.js`
- `src/index.js`
- `build.mjs`

Cohort registry:
- `public-src/cohorts/index.js`

Per-cohort source:
- `public-src/cohorts/<id>/cohort.js`
- `questions.js`
- `essay-practice.js`
- `audio-reviews.js`
- `glossary.js`
- `chaburos.js`
- `course-notes.js`

Generated PDFs are built from the default cohort's question/essay sources. Supplied compact/full notes are static source assets; do not regenerate or paraphrase them as a build product.

## Hard invariants

- Keep the localStorage key `courseReviewSpacedRepetition.v1`. Its internal envelope is cohort-scoped.
- Cohort IDs and analytics keys are permanent identifiers once data has shipped.
- A question/essay/fact ID only has meaning inside its cohort. Never assume IDs are globally unique across cohorts.
- All student analytics and feedback must include the active cohort analytics key.
- Progress, essay mastery, essay-category filters, audio playback state, and chabura settings are cohort-scoped.
- Every question and essay must have compact and full note locations.
- Every audio mapping must point to an existing review and a valid start time.
- Review-audio public URLs must be namespaced by cohort. Summer 26 currently uses a Worker fallback to the legacy flat R2 objects; do not remove that fallback until the objects have actually been copied into the namespaced R2 prefix and playback/range requests are verified.
- Do not expose R2 credentials, GitHub tokens, or admin secrets to browser code.
- Content feedback does not authorize a content change. Investigate, verify against course sources, propose the fix, and wait for explicit approval before changing substantive course content.
- If question or essay wording changes, regenerate the corresponding derived PDFs in the same release.

## Release workflow

For a normal change: inspect latest main → edit canonical source → bump app/package/service-worker version when client behavior/assets change → run build and syntax checks → commit to main → report that Cloudflare should auto-deploy. Do not claim a live deployment unless independently verified.

For architecture changes, also update this file and the relevant document under `docs/`.
