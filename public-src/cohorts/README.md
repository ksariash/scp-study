# Cohort packages

Each subdirectory is one independently selectable course cohort. Read the root `AGENTS.md`, `docs/ARCHITECTURE.md`, and `docs/NEW-COHORT-PIPELINE.md` before adding or editing a cohort.

Do not copy cohort content into the reusable app shell. Register a new cohort in `index.js`, provide every required package file, keep IDs stable, and let `build.mjs` validate the package.

A cohort is not ready to be registered for students until the analytics repository supports its `analyticsKey`.
