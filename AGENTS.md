# SCP Study — LLM operating guide

Read this file before changing the repository. It is architecture documentation and must change in the same commit when the architecture changes.

## Operating authority

A request to implement a change normally means: inspect current `main` → implement in canonical source → validate → commit to `main` → let Cloudflare Workers Builds deploy → inspect the resulting Cloudflare check. Do not stop at a branch or PR unless the user explicitly asks.

Never claim production success from a Git commit alone. A completed successful Cloudflare Workers Builds check is the minimum deployment verification. When direct production HTTP access is available, also smoke-test the affected live path.

## Canonical source

Never edit generated `public/` as source.

Reusable app shell:
- `public-src/index.html`
- `public-src/styles.css`
- `public-src/app.js`
- `public-src/sw.js`
- `src/index.js`
- `build.mjs`

Zman registry:
- `public-src/cohorts/index.js`

The directory name `cohorts/` is a legacy filesystem name. Product language, documentation, new APIs, and new code concepts should say **Zman / Zmanim**.

Each Zman package lives at `public-src/cohorts/<zman-id>/` and contains:
- `cohort.js` (legacy filename; exports `SCP_ZMAN_CONFIG` and compatibility alias)
- `questions.js`
- `essay-practice.js`
- `audio-reviews.js`
- `glossary.js`
- `chaburos.js`
- `course-notes.js`

The current stable Zman ID and analytics key are `2026-summer`. Its display name is `Nat Bar Nat & Stam Ye'enam - Summer 26`.

## Zman invariants

- Once shipped, a Zman ID is permanent. Never reuse an old ID for different course content.
- Question, essay, fact, glossary, and audio IDs are meaningful only inside their Zman.
- All analytics, feedback, notifications, documents, and review-audio paths must resolve inside the active Zman.
- Progress, essay mastery, essay-category filters, audio playback state, and chabura settings are Zman-scoped.
- Preserve migration reads for the legacy Summer 2026 ID `nat-bar-nat-stam-yeinam-summer-26` until intentionally retired.
- The old storage envelope property `cohorts` is a compatibility detail; do not create new user-facing “cohort” terminology from it.
- A newly available `latestZmanId` should prompt existing users to switch; do not silently discard their selected Zman.

Read `docs/ARCHITECTURE.md` and `docs/NEW-ZMAN-PIPELINE.md` before adding another Zman.

## Cross-repository contract

SCP Study and `scp-study-analytics` are one deployed system with independent Workers.

Before Study exposes a new Zman, Analytics must already:
- allow that Zman ID;
- have that Zman's question/essay/fact catalogs;
- keep feedback identity Zman-scoped;
- filter diagnostics and notifications to one Zman;
- accept the payload fields Study will send.

For cross-repo protocol changes, deploy the backward-compatible Analytics receiver first, verify its Cloudflare build, then deploy Study.

## R2 audio

Current review-audio URLs are `/audio/2026-summer/<filename>`, mapping to R2 `audio/2026-summer/<filename>`.

The Worker temporarily falls back to legacy flat R2 objects `audio/<filename>`. Do not remove that fallback until all 16 Summer 2026 review files have been copied into `audio/2026-summer/` and representative GET, HEAD, and Range requests have been verified.

Never expose R2 credentials to browser code.

## Documents and offline shell

Zman-configured documents live under `documents/<zman-id>/`. The build currently preserves root document URLs for older installed clients and copies the current Zman's documents into its namespace.

Student-facing study files are offline-first. The preferred default for a configured file that learners may need while studying is to include it in the service worker `APP_SHELL`, so it is cached during install/update rather than only after the user opens it once. For the current Zman this includes the compact review, full course notes, cumulative test, answer key, and essay Q&A PDF. If a learner-facing file is intentionally not precached because of size, volatility, or access restrictions, document that exception explicitly.

A cache-membership-only maintenance change may keep the existing product `APP_VERSION`/package version, but it must change `CACHE_NAME` so already-installed PWAs actually install the new asset set. When the product release number itself changes, increment all release surfaces together:
- `package.json`
- `APP_VERSION` in `public-src/app.js`
- `APP_VERSION` and `CACHE_NAME` in `public-src/sw.js`

The About dialog version is runtime-derived; do not add a second hard-coded release number.

A source fix is not complete if existing installed PWAs remain pinned to an unchanged cache name.

Generated PDFs are mixed-direction documents: English layout is LTR while Hebrew phrases are RTL. Preserve the logical source wording and handle direction in the PDF renderer. Contiguous Hebrew words must keep their reading order (for example, logical `כלי שני` must render visually as `כלי שני`, not `שני כלי`), and punctuation adjacent to Hebrew must use a font/direction-safe run rather than producing missing-glyph/null boxes.

## Notifications and reminders

The Analytics Worker/D1 is the source of truth for notification history. Web Push is a delivery channel, not the inbox itself.

The Study inbox:
- is filtered to the active Zman;
- tracks read/archive state server-side per anonymous installation ID;
- must render unknown future notification kinds safely;
- may render only safe same-origin or HTTPS action URLs;
- can support future announcements, links, feedback requests, polls, or other typed actions without requiring a new inbox schema.

Push permission must be requested only from a user gesture. Daily reminder settings include local HH:MM, IANA timezone, and Diaspora/Israel calendar mode. Analytics owns Shabbat/Yom Tov suppression.

## Local/server data controls

Exports have three selectable groups: statistics, settings, and app preferences. Never export:
- the anonymous analytics installation ID;
- analytics or feedback upload queues;
- notification server state;
- PushSubscription keys/endpoints.

Reset Statistics must support either the active Zman or all Zmanim without deleting unrelated settings.

Delete All Data must distinguish local-only deletion from local plus anonymous server deletion. For server deletion, call the server while the installation ID still exists; only clear local storage after the server confirms success.

## Anonymous learner sync

Sync is subordinate to Anonymous Usage: it may be configured only when anonymous usage is enabled, and progress transfer pauses while anonymous usage is off. Linked devices share the historical analytics `installationId`, which now represents an anonymous learner identity for synced users. Never treat that ID as a credential or expose it as a pairing secret.

Each browser/PWA has a separate `deviceId` and, when linked, a separate high-entropy device token. Analytics stores only the token hash. Device tokens are independently revocable; revoking another device must not delete its local study data and must remove only that device's push endpoint from the shared learner.

Question/essay/test progress sync is Zman-scoped, offline-first, operation-based, and idempotent. Do not replace it with whole-localStorage last-write-wins uploads. Resets advance a per-Zman generation so stale offline operations cannot resurrect deleted progress. Active practice-test state remains device-local.

Notification read/archive state is intentionally shared through the anonymous learner ID. Push subscriptions and reminder delivery remain per device. Synced inbox/push/reminder access must require a valid linked-device credential once a sync account exists.

Sync credentials, pairing material, cursors, and queues are local implementation state and must never be exported. Import while linked is an explicit merge operation and must warn about duplicate already-synced history.

## Content authority and feedback

Course-owner source files are authoritative for course content. Do not silently replace course wording with outside halachic knowledge.

Student feedback is evidence, not authorization. For substantive question/essay/course changes: inspect the report, inspect current source, verify against authoritative course materials, propose the exact correction, and wait for explicit approval before changing the course content.

If question or essay wording changes, regenerate corresponding derived PDFs in the same release.

## Required validation

For client/source changes:
1. Run `npm run build`.
2. Syntax-check modified JavaScript.
3. Confirm Zman registry/package validation passes.
4. Confirm app/package/service-worker/cache versions agree for a numbered app release, or confirm a cache-only revision changed `CACHE_NAME`.
5. Check representative document and audio paths.
6. Commit to `main`.
7. Inspect the Cloudflare Workers Builds check.
8. For cross-repo changes, verify Analytics first and Study second.

For generated-PDF changes, additionally inspect the rendered PDF rather than relying only on extracted text. Mixed Hebrew/English text must be visually checked in at least one representative question and one representative title/table when those paths changed.

Do not commit secrets, generated `public/`, `.wrangler/`, or local environment files.


## UI design rules

Prefer the interface itself over explanatory prose. If a heading, label, selected value, toggle, or visual grouping already communicates purpose, do not add a paragraph that restates it.

Settings should be concise. In particular, Zman and chabura controls do not need prose explaining that they select a Zman/chabura. Reserve status text for a real state change, warning, error, or confirmation.

Use familiar icons instead of text for compact utility actions when the icon is conventional and unambiguous. Icon-only buttons must have an accessible `aria-label` and a useful `title`. The notification control is a small bell adjacent to the session timer; unread state is a compact alert mark, not a large labeled card.

All dismissible dialogs should close when the user clicks the backdrop/outside the dialog box. Keep this behavior in the shared dialog lifecycle rather than implementing one-off backdrop handlers.

Responsive form controls must not overflow their cards. Grid children and inputs/selects should use `min-width: 0`, `max-width: 100%`, and `box-sizing: border-box` where intrinsic mobile control sizing can otherwise escape the container.


## Current R2 state

Summer 2026 review audio is canonical at `audio/2026-summer/<filename>`. Because production playback failed after the migration, the Worker temporarily keeps read-only compatibility probes for a literal-leading-slash key and the legacy flat `audio/<filename>` key. Remove those probes only after a live production HEAD/Range playback check confirms the canonical objects and metadata.

The topbar treats the session timer and notification bell as one visual cluster. On compact layouts the cluster occupies the top-right cell; never place the bell as an independent grid item that can wrap beneath the main navigation.


## Notification permission UX

The first time a user opens the notification bell while browser permission is still `default`, request Push permission from that click gesture before opening the inbox. If Push is not enabled, the inbox shows a gentle enable reminder.

Browsers generally cannot re-open the native permission prompt after the user has explicitly blocked notifications. The inbox action should retry when possible and otherwise explain that browser/site settings must be changed; never claim the app can override a browser denial.

## Settings presentation

Settings use one primary section title, not a numeric eyebrow plus a duplicate label. Zman and Chabura show their currently saved value at the bottom of their cards.

Notification Settings uses the concise description: “Get notified on important announcements and daily study reminders (excluding Shabbat and Yom Tov).”

The bottom reminder summary comes from Analytics `/api/reminders/next`, not duplicated holiday calculations in the browser. It should say disabled, today, tomorrow, after Shabbat, or after Yom Tov as appropriate.

Mobile time/select controls must remain within their card even when WebKit gives native controls a large intrinsic width.


## Reminder preference model

Push delivery and daily-reminder intent are separate state.

- `pushEnabled` reflects whether this app currently uses Web Push.
- `dailyRequested` remembers whether the user wants daily reminders, even while Push is temporarily disabled.
- `dailyEnabled` is the effective server-delivery state and must be false while Push is off.

Turning Push off must preserve `dailyRequested`. Turning Push back on must restore `dailyEnabled` from `dailyRequested`.

Notification preferences are immediate settings. The Push toggle, Daily study reminder toggle, reminder time, and Diaspora/Israel calendar all save/sync on change; do not reintroduce a separate Save button.

When changing settings state, distinguish remembered user intent from temporary capability state instead of destroying one when the other is disabled.

## Study-aid analytics

With anonymous usage enabled, emit explicit resource events when:
- an audio review actually fires the media element's `play` event;
- a concise/full course-note page is opened.

Use stable Zman-scoped resource IDs and human-readable labels. Do not infer file/page popularity from answer events. Glossary interactions keep using their dedicated glossary event.

Deploy the backward-compatible Analytics receiver for a new event kind before deploying Study code that emits it.

## Floating utility controls

The Essay-mode search FAB has a fixed semantic anchor: bottom-left of the viewport, including when the mini audio player is visible. Transient UI must not silently reposition a fixed utility action. Use an explicit body/state class for mode-specific positioning rather than inline coordinates.

## Native settings controls

A mobile native form control should visually match adjacent app controls in both width and height. When WebKit intrinsic sizing causes drift, constrain `height`, `min-height`, `max-height`, padding, and the native date/time value box together. Do not solve overflow by leaving an oversized control inside the card.


## Audio delivery and Range requests

Summer review audio is served from the R2-backed Worker path `/audio/2026-summer/...`. Catalog URLs must be root-absolute so playback does not depend on the current document path.

Do not make the service worker fetch an entire media file merely to answer an uncached HTTP Range request. For uncached media ranges, pass the original Range request through to the Worker/R2 layer, which returns the proper 206 response. A full cached object may be sliced locally for offline playback.

The app and service worker must use the same audio cache version. When changing Range/cache semantics, bump that cache version so an old partial or malformed cached response cannot poison playback.

## Resource ordering

Question resource order is a UI invariant: question prompt, course-note links, then relevant audio, then answer choices. Use the same order in the question explorer/review UI. Do not independently reorder these surfaces.

Essay pairing resource actions should stay compact. Audio uses a small play control. Concise and full course notes use visually distinct book/note glyphs with the referenced page number overlaid on the glyph. Use the same resource-action renderer in Essay practice and the Essay explorer so the controls do not drift.

## Mobile export

Settings export creates a real JSON `File`. When the Web Share API can share files, invoke the native share sheet first so mobile users can send the backup or save it to Files/Downloads. Fall back to a normal browser download when file sharing is unavailable. Treat a user-cancelled share sheet as a cancellation, not as an error that triggers an unwanted download.

## Cross-app navigation and references

Study is the learner-facing app. Do not expose instructor-only Dashboard or Announcements navigation in learner settings. Instructor tools may link into Study using the production origin and the stable reference query contract below.

Supported incoming references:
- `?zman=<id>&question=<question-id>` opens that question in Question Explorer.
- `?zman=<id>&audio=<review-id>&time=<seconds>` opens the audio/transcript view at that review and timestamp without autoplay.
- `?zman=<id>&pdf=<compact|full>&page=<page>` opens the in-app notes viewer at that page. Stable aliases also exist for cumulative-test, answer-key, and essays documents.

When the referenced Zman differs from the active Zman, switch to the referenced Zman before resolving the content. Keep these links backward-compatible because Analytics and Announcements may publish them.

## Shared SCP suite design contract

Study, Analytics Dashboard, and Announcements should read as one product family even though their audiences differ.

- Use the same restrained navy/blue visual language, white surfaces, subtle cool-gray borders, modest shadows, and compact rounded controls. Avoid introducing a one-off visual system in one app.
- Utility/navigation actions should use familiar icons when the meaning is unambiguous. Every icon-only control needs an accessible `aria-label` and `title`.
- A header or toolbar must have one flexible text/content region with `min-width:0` and a non-wrapping utility/action region. On mobile, utility actions stay in the top-right rather than falling below the title.
- Flex/grid children that can contain user/content text must be shrink-safe. Use `min-width:0`; form controls use `width:100%`, `max-width:100%`, and `box-sizing:border-box`. Long text should wrap or truncate intentionally, never widen the page/container.
- When UI text names a question, audio review, or document page and a destination exists, make the reference actionable rather than leaving it as inert text.
- Before release, inspect both desktop and narrow-mobile layouts, long labels, dialogs, and generated/final HTML—not only source syntax.


## v60 audio delivery diagnostics

For review media, do not trust copied R2 HTTP metadata for the response MIME type. Derive the audio MIME from the requested object filename and override generic metadata before returning the response. For Range requests, resolve object size first, parse one byte range explicitly, then use an R2 numeric offset/length read and return a deterministic 206 with Content-Range.

When audio delivery semantics change, bump both the app and service-worker audio cache names together so stale cached media responses cannot mask the repair.

## Backup import persistence

The main multiple-choice/test state lives inside the Zman envelope stored at `courseReviewSpacedRepetition.v1`. During an import-triggered reload, suppress normal visibility/pagehide persistence before writing imported values. Otherwise the old in-memory state can overwrite the freshly imported envelope while essay-scoped keys survive, producing a partial restore.

Import/export status belongs inside the transfer settings card, not as a detached message at the bottom of the Settings panel.

## Contextual study resources

Question, Question Explorer, Essay prompt, and Essay Explorer prompt resources use the same compact visual language: note chips first, then relevant audio. Essay prompt audio is derived from the essay fact audio map and grouped by review so the prompt does not repeat the same review for every pairing. Pairing-level utility icons remain compact.

On narrow Essay Explorer layouts, required-point resource/report controls are vertical.
