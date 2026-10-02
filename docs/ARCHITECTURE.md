# SCP Study architecture

## Goal

One reusable application should support many independent Semichas Chaver cohorts without mixing content, progress, audio, notes, feedback, or analytics.

## Cohort registry

`public-src/cohorts/index.js` lists deployable cohorts. A registry entry has a stable `id`, display `name`, stable `analyticsKey`, status, source path, and expected question/essay counts.

The browser stores the selected cohort in `scpStudy.activeCohort.v1`. `cohort-loader.js` loads that cohort package before `app.js`.

## Cohort package contract

Each cohort directory must contain `cohort.js`, `questions.js`, `essay-practice.js`, `audio-reviews.js`, `glossary.js`, `chaburos.js`, and `course-notes.js`.

`build.mjs` validates identity, counts, IDs, answers, note coverage, audio references, audio namespace, and glossary IDs. A registered cohort must pass validation before deployment.

## State isolation

The visible legacy key `courseReviewSpacedRepetition.v1` is intentionally preserved, but it stores an envelope keyed by cohort ID. Other content-specific local state is also cohort-scoped. App-wide preferences may remain global only if they truly apply to every cohort.

Switching cohort reloads the page so no old cohort globals remain in memory.

## Audio

Desired layout:

`/audio/<cohort-id>/<file>` → R2 `audio/<cohort-id>/<file>`

Summer 26 originally shipped flat `audio/<file>` objects. The Worker accepts the new namespaced URL and falls back to the flat key until the R2 objects are physically copied. Verify GET, HEAD, byte ranges, seeking, offline caching, and Download All before removing the fallback.

## Documents

Static course-source documents belong to the cohort. Derived PDFs (cumulative questions, answer key, essay Q&A) are generated from the same cohort source used by the app. Once more than one cohort is active, use unambiguous cohort-specific document paths.

## Analytics boundary

The Study app emits the cohort `analyticsKey` with every event. The analytics repository treats cohort as mandatory. Do not enable a new Study cohort until Analytics supports its analytics key and content catalog.

## IDs

Cohort ID, question ID, essay ID, essay fact ID, audio review ID, and glossary ID must remain stable after release. Identity is conceptually `cohort + content type + content ID`.

## Build philosophy

Prefer deterministic validation over manual memory. New package requirements belong in `build.mjs` so the build fails loudly rather than allowing an incomplete cohort to deploy.


## Notification inbox and device data

The header notification control is immediately adjacent to the session timer. Inbox history is fetched from Analytics for the active Zman and anonymous installation ID; read/archive state is server-side so it survives app reloads. Push notification clicks route back to the inbox or a trusted HTTPS action URL.

The app can export three explicitly selected groups: statistics, settings, and non-sensitive app preferences. Anonymous identifiers, queued uploads, and push credentials are intentionally excluded.

Reset statistics can target the current Zman or all Zmanim. Delete All Data distinguishes local-only deletion from local plus anonymous server deletion. Server deletion is attempted before clearing the local installation ID.
