# Multi-Zman SCP Study architecture

## Goal

One reusable PWA supports multiple independent Semichas Chaver **Zmanim** without mixing content, progress, audio, notes, feedback, analytics, or notifications.

## Registry and package loading

`zmanim/registry.yaml` is the authoring registry. Each Zman's editable source lives under `zmanim/<zman-id>/`. `build.mjs` validates that source and compiles it to the browser runtime under `public/cohorts/`.

The generated `cohorts/` runtime directory, `cohort.js` filename, and `SCP_COHORT_*` aliases remain only for compatibility with already-shipped clients. They are not source and must not be edited by hand.

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
- authoring package: `zmanim/2026-summer/`

## Zman package contract

Each authoring package contains `zman.yaml`, `questions.yaml`, `essays.yaml`, `audio-reviews.yaml`, WebVTT transcripts, `glossary.yaml`, `chaburos.yaml`, and `coverage-audit.yaml`. Note locations, review-audio clips, category links, and similar relationships live beside the content they describe.

The compiler derives browser-only plumbing: analytics keys, content counts, document/audio namespaces, essay token IDs, category maps, audio maps, course-note lookup maps, and the compatibility registry/config aliases. The generated `cohort.js` exports `SCP_ZMAN_CONFIG` and a temporary `SCP_COHORT_CONFIG` alias; new logic should consume the Zman form.

`npm run zman:validate` validates the human-readable package. `build.mjs` then validates the compiled runtime identities, counts, IDs, answers, note coverage, audio references, namespace rules, and glossary IDs. Registered Zmanim must pass both layers before deployment.

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

For a normal authored Zman, the compact review and full notes live in `zmanim/<zman-id>/documents/`; the cumulative test, answer key, essay Q&A, and glossary are generated from the YAML. The build namespaces all six. Summer 2026 alone retains `documentSource: legacy-root`, which reconstructs its historical root documents and then copies them into its namespace for previously installed clients. Materials UI resolves its buttons from the active Zman configuration rather than treating root paths as canonical.

Learner-facing study documents use explicit offline caching. PDFs are excluded from the service-worker app shell and are stored only when the learner uses a per-document download action or `Download all`. The dedicated `scp-study-documents-v2` cache survives normal app-cache upgrades; PDF requests consult it first but ordinary viewing does not silently add to it. Configured document requests include the Zman's `contentVersion` in their cache identity, so replacing a PDF at the same path requires incrementing that content version and cannot leave an old explicit download pinned forever. The current application cache is `scp-study-v75-ui8`.

The glossary PDF is generated from the active Zman's `glossary.js` alongside the cumulative test, answer key, and essay Q&A. It is not an independent source of course terminology.

Generated study PDFs use an LTR page layout with embedded RTL Hebrew phrases. The generator keeps source strings in logical reading order and performs visual word/run ordering only at draw time. Adjacent Hebrew words are ordered as a group; neutral trailing punctuation in an LTR sentence stays on the browser-equivalent visual side of that RTL group. Source content must not be manually reversed to compensate for the renderer.

Font size is an app-wide, device-local accessibility preference stored independently of Zman progress. It scales the root font percentage so rem-based UI follows the preference while retaining the browser's own default-font and zoom behavior. It belongs to the Settings export group but is not synchronized across devices because different screens may need different text sizes.

## Analytics and feedback

Study emits the stable Zman analytics key with every analytics/feedback payload. Analytics must be deployed first for new Zmanim or protocol changes.

Identity is conceptually:

`zman + content type + content ID`

Question numbers, essay IDs, and fact IDs must never be interpreted outside the selected Zman.

## Anonymous learner identity and device sync

Device sync is opt-in and available only while anonymous usage is enabled. The historical Analytics field/database name `installation_id` is retained for compatibility, but once sync is enabled its value is the shared anonymous learner ID across linked devices. It is an identifier, never an authentication secret. Turning Anonymous Usage or Sync off pauses shared read/archive state as well as study-progress transfer without unlinking the device.

Every browser/PWA has a separate random `deviceId`. A linked device also has a high-entropy device token; only its hash is stored by Analytics/D1. Device credentials are independently revocable. “Unlink other devices” revokes all credentials except the current device and removes only those devices' push endpoints.

Progress sync is offline-first and operation-based. Zman-scoped question/essay/test mutations are assigned stable operation IDs and retried idempotently. Reset operations advance a per-learner/per-Zman generation so an offline device cannot resurrect progress from before a reset. Active practice-test state remains device-local.

The explicit Sync now action performs the current device's normal push/pull first, then asks Analytics to send a short-TTL `sync_request` Web Push to other linked devices with Push enabled. That message contains no learner credential and is only a best-effort wake-up hint: a service worker forwards it to an active/background Study client, while a fully closed app reconciles through the normal launch/resume sync path.

Existing local progress is seeded as baseline operations when sync is first enabled or a device is linked. Import while linked is an explicit merge and warns against importing a duplicate of history that is already synced. Sync credentials, queues, cursors, and anonymous IDs are never included in normal export.

## Notification architecture

Analytics/D1 owns:
- typed notification records;
- per-anonymous-learner read/archive state (the legacy column name remains `installation_id`);
- push subscriptions;
- daily reminder preferences;
- issue-resolution notifications.

Study always requests inbox data for the active Zman and current anonymous learner ID. For a learner with sync enabled, inbox/push/reminder mutations require the current linked device credential; revoked devices cannot continue using the shared inbox identity. While shared sync is paused, the client overlays read/archive state locally and queues those mutations until Anonymous Usage and Sync are both on again.

Notification records deliberately support a generic `kind` and optional action object so future link, feedback-request, poll, and similar messages do not require redesigning the inbox.

Web Push carries user notifications back to the PWA; the service worker opens/focuses the app and the inbox remains the durable record. The separate `sync_request` control payload is consumed silently by an active client and never becomes an inbox record.

## Reminder boundaries

The Study client sends the browser's IANA timezone and chosen HH:MM. Analytics stores Cloudflare's broad, rounded IP-derived coordinates with the push subscription when available. Analytics uses Hebcal sunset/tzeit calculations plus the user's Diaspora/Israel setting to suppress reminders during Shabbat and Yom Tov.

No GPS permission is requested.

## Data lifecycle

Reset Statistics:
- active Zman only, or
- all Zmanim.

Delete All Data:
- local-only, or
- local plus anonymous server data tied to the anonymous learner ID. When sync is enabled, server deletion applies to the shared learner across linked devices.

Server deletion must happen before local deletion erases that installation ID.

Export deliberately excludes anonymous identifiers, analytics/sync queues, sync credentials/cursors, notification state, and push credentials.

## Adding another Zman

Follow `docs/NEW-ZMAN-PIPELINE.md`. Analytics readiness is a launch gate, not post-launch cleanup.
