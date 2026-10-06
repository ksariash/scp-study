# SCP Study

SCP Study is the learner-facing PWA for Semichas Chaver course review, adaptive questions, essay practice, cumulative tests, course documents, review audio, glossary study, notifications, and anonymous progress sync.

## Canonical source

Do not edit generated `public/`.

Reusable application source lives in:

- `public-src/index.html`
- `public-src/styles.css`
- `public-src/app.js`
- `public-src/sw.js`
- `public-src/cohort-loader.js` (legacy filename; loads the selected Zman)
- `public-src/manifest.webmanifest`
- `public-src/images/`
- `src/index.js`
- `build.mjs`

Zman content is authored under `zmanim/` as YAML plus WebVTT transcripts. The build compiles that readable source into the legacy browser compatibility shape under generated `public/cohorts/`.

See `zmanim/README.md`, `docs/ARCHITECTURE.md`, and `docs/NEW-ZMAN-PIPELINE.md` before changing or adding course content.

## Current Summer 2026 package

The current Zman is `2026-summer`, displayed as **Nat Bar Nat & Stam Ye'enam - Summer 26**.

Its questions, essays, glossary, chabura data, audio metadata/transcripts, note mappings, and coverage audit live in `zmanim/2026-summer/`.

Summer 2026 still uses the `legacy-root` document compatibility path so already-installed clients keep their historical root PDF URLs.

## Legacy binary assets

Two legacy binary mechanisms are still active and must not be deleted merely as repository cleanup:

- `assets/static-binaries.tar.gz.b64.*.part` reconstructs binary static assets that are not checked into `public-src/`, including the legacy Summer compact review and other binary app assets such as icons/pronunciation media.
- `assets/full-course-notes.pdf.b64.*.part` reconstructs the legacy Summer full-notes PDF.

These are build inputs, not generated leftovers. They can be retired only after their still-needed contents are moved to explicit canonical locations and `build.mjs` is changed accordingly.

Review audio itself is not stored in Git. It is served from the private R2 bucket through same-origin paths such as `/audio/2026-summer/<file>`.

## Build and validation

```bash
npm install
npm run zman:validate
npm run build
```

The production build:

1. copies the reusable app shell from `public-src/`;
2. validates and compiles deployable Zmanim into generated browser runtime files;
3. generates the service-worker Zman precache list from the registry;
4. restores required legacy binary assets;
5. generates the cumulative test, answer key, essay Q&A, and glossary PDFs from the canonical Zman YAML;
6. creates Zman-namespaced document copies.

Generated `public/` is ignored by Git.

## New Zman workflow

Create an initially non-deployable draft package with:

```bash
npm run zman:new -- <zman-id> <YYYY-MM-DD> "<display name>"
```

A draft must be completed and pass `npm run zman:validate`. Analytics support is a release gate. Only after Analytics is ready should the Zman leave `draft` status and be made latest/default when intended.

## Deployment

Cloudflare Workers Builds deploys pushes to `main`.

Recommended settings:

- production branch: `main`
- root directory: `/`
- build command: `npm run build`
- deploy command: `npx wrangler deploy`

The Worker is `scp-study`; `wrangler.jsonc` binds the private `scp-study-audio` R2 bucket as `AUDIO`.

A Git commit alone is not deployment verification. Confirm that the Cloudflare Workers Builds check completes successfully after a production change.

## Repository guidance

- `AGENTS.md` contains the operating/architecture rules for automated work.
- `docs/DESIGN-SYSTEM.md` is the learner-facing UI contract.
- `docs/ARCHITECTURE.md` documents Zman isolation, documents, audio, analytics, sync, and notifications.
- `docs/NEW-ZMAN-PIPELINE.md` documents the content-production and launch pipeline.

Historical release-by-release notes are intentionally not kept in this README; Git history is the source for old implementation chronology.
