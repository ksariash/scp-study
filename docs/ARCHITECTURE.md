# Multi-Zman SCP Study architecture

## Goal

One reusable PWA supports multiple independent Semichas Chaver **Zmanim** without mixing content, progress, audio, notes, feedback, analytics, or notifications.

## Registry and package loading

`public-src/cohorts/index.js` is the Zman registry. The `cohorts/` directory and a few `SCP_COHORT_*` aliases remain only for compatibility with already-shipped clients and build code.

The canonical browser registry is `window.SCP_ZMAN_REGISTRY`. Each entry has:
- stable `id`;
- display `name`;
- stable `analyticsKey`;
- status/start metadata;
- source `path`;
- expected question/essay counts;
- optional legacy IDs for local-state migration.

The active selection is stored at `scpStudy.activeZman.v1`. `cohort-loader.js` is a legacy filename; it resolves the selected Zman and loads that package before `app.js`.

Current Zman:
- ID / analytics key: `2026-summer`
- display: `Nat Bar Nat & Stam Ye'enam - Summer 26`
- package: `public-src/cohorts/2026-summer/`

## Zman package contract

Each package contains `cohort.js`, `questions.js`, `essay-practice.js`, `audio-reviews.js`, `glossary.js`, `chaburos.js`, and `course-notes.js`.

`cohort.js` exports `SCP_ZMAN_CONFIG` and a temporary `SCP_COHORT_CONFIG` alias. New logic should consume the Zman form.

`build.mjs` validates identities, counts, IDs, answers, note coverage, audio references, namespace rules, and glossary IDs. Registered Zmanim must pass validation before deployment.

## Browser data isolation

The visible legacy key `courseReviewSpacedRepetition.v1` is retained for migration compatibility. Its internal envelope remains keyed by active Zman ID even though the legacy property is named `cohorts`.

Other content-specific local state is Zman-scoped. App-wide preferences may remain global only when they genuinely apply to every Zman.

Summer 2026 migrates reads from legacy ID `nat-bar-nat-stam-yeinam-summer-26` into `2026-summer`.

Switching Zman reloads the page so content globals from the previous Zman cannot remain in memory.

## R2 review audio

Browser URL:

`/audio/<zman-id>/<file>`

R2 object:

`audio/<zman-id>/<file>`

Summer 2026 is canonical at `audio/2026-summer/<file>`. Production playback failed after the migration was declared complete, so the Worker temporarily probes the canonical key, a literal-leading-slash variant, and the legacy flat `audio/<file>` key for reads. Keep the compatibility probes until a live HEAD and Range request confirms the canonical object key, MIME type, and byte-range response in production. The Worker derives media MIME from the filename rather than trusting copied R2 metadata.

## Documents

Configured Zman documents use:

`documents/<zman-id>/<file>`

The build also preserves legacy root documents for previously installed clients. Materials UI resolves its buttons from the active Zman configuration rather than treating root paths as canonical.

Learner-facing study documents are offline-first. The current service-worker app shell precaches the compact review, full course notes, cumulative test, answer key, and essay Q&A PDF so installed clients can open them without a prior online view. A cache-membership change must use a new cache name so existing PWAs receive the new file set. The current cache-only document revision is `scp-study-v61-docs2`.

Generated study PDFs use an LTR page layout with embedded RTL Hebrew phrases. The generator keeps source strings in logical reading order and performs visual word/run ordering only at draw time. Adjacent Hebrew words and punctuation must therefore be handled as RTL runs; source content must not be manually reversed to compensate for the renderer.

## Analytics and feedback

Study emits the stable Zman analytics key with every analytics/feedback payload. Analytics must be deployed first for new Zmanim or protocol changes.

Identity is conceptually:

`zman + content type + content ID`

Question numbers, essay IDs, and fact IDs must never be interpreted outside the selected Zman.

## Notification architecture

Analytics/D1 owns:
- typed notification records;
- per-installation read/archive state;
- push subscriptions;
- daily reminder preferences;
- issue-resolution notifications.

Study always requests inbox data for the active Zman and current anonymous installation ID.

Notification records deliberately support a generic `kind` and optional action object so future link, feedback-request, poll, and similar messages do not require redesigning the inbox.

Web Push carries a notification back to the PWA; the service worker opens/focuses the app and the inbox remains the durable record.

## Reminder boundaries

The Study client sends the browser's IANA timezone and chosen HH:MM. Analytics stores Cloudflare's broad, rounded IP-derived coordinates with the push subscription when available. Analytics uses Hebcal sunset/tzeit calculations plus the user's Diaspora/Israel setting to suppress reminders during Shabbat and Yom Tov.

No GPS permission is requested.

## Data lifecycle

Reset Statistics:
- active Zman only, or
- all Zmanim.

Delete All Data:
- local-only, or
- local plus anonymous server data tied to the installation ID.

Server deletion must happen before local deletion erases that installation ID.

Export/import deliberately excludes anonymous identifiers, queued uploads, notification state, and push credentials.

## Adding another Zman

Follow `docs/NEW-ZMAN-PIPELINE.md`. Analytics readiness is a launch gate, not post-launch cleanup.
