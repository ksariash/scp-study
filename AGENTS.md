# SCP Study — LLM operating guide

Read this file before changing the repository. It is architecture documentation and must change in the same commit when the architecture changes.

## Operating authority

A request to implement a change normally means: inspect current `main` → implement in canonical source → validate → commit to `main` → let Cloudflare Workers Builds deploy → inspect the resulting Cloudflare check. Do not stop at a branch or PR unless the user explicitly asks.

**Current Summer 2026 cutover exception:** the owner explicitly requires all remaining migration/content work to stay on `zman-2026-summer-staging-v2` (or a clearly named descendant staging branch) until each stage has passed isolated CI and artifact review. Do not commit or merge further cutover work to `main` without a new explicit approval. Preserve the known-good learner shell while staging; do not replay the prior cleanup deletion commit as part of the cutover.

Never claim production success from a Git commit alone. A completed successful Cloudflare Workers Builds check is the minimum deployment verification. When direct production HTTP access is available, also smoke-test the affected live path.

## Canonical source

Never edit generated `public/` as source.

Reusable app shell:
- `public-src/index.html`
- `public-src/styles.css`
- `public-src/app.js`
- `public-src/sw.js`
- `public-src/images/` (including the iOS install guide artwork)
- `src/index.js`
- `build.mjs`

Zman authoring source:
- `zmanim/registry.yaml`
- `zmanim/<zman-id>/zman.yaml`
- `zmanim/<zman-id>/questions.yaml`
- `zmanim/<zman-id>/essays.yaml`
- `zmanim/<zman-id>/audio-reviews.yaml`
- `zmanim/<zman-id>/transcripts/*.vtt`
- `zmanim/<zman-id>/glossary.yaml`
- `zmanim/<zman-id>/chaburos.yaml`
- `zmanim/<zman-id>/coverage-audit.yaml`

Do not hand-author browser runtime files for Zman content. `build.mjs` compiles the readable source above into `public/cohorts/` for compatibility with already-shipped clients. The runtime directory and `cohort.js`/`SCP_COHORT_*` names are compatibility details only. Product language, documentation, new APIs, and new source concepts should say **Zman / Zmanim**.

The current stable Zman ID and analytics key are `2026-summer`. Its display name is `Nat Bar Nat & Stam Ye'enam - Summer 26`.

## Zman invariants

- Once shipped, a Zman ID is permanent. Never reuse an old ID for different course content.
- Question, essay, fact, glossary, and audio IDs are meaningful only inside their Zman.
- All analytics, feedback, notifications, documents, and review-audio paths must resolve inside the active Zman.
- Progress, essay mastery, essay-category filters, audio playback state, and chabura settings are Zman-scoped.
- Preserve migration reads for the legacy Summer 2026 ID `nat-bar-nat-stam-yeinam-summer-26` until intentionally retired.
- Legacy IDs are storage/selection aliases, not duplicate content packages. Do not keep a second deployable Zman directory solely for a legacy ID; it will drift from the canonical package.
- The old storage envelope property `cohorts` is a compatibility detail; do not create new user-facing “cohort” terminology from it.
- A newly available `latestZmanId` should prompt existing users to switch; do not silently discard their selected Zman.

Read `zmanim/README.md`, `docs/ARCHITECTURE.md`, and `docs/NEW-ZMAN-PIPELINE.md` before adding another Zman. Run `npm run zman:validate` before the normal production build.

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

Student-facing PDFs are offline-first but intentionally **not** part of the service worker `APP_SHELL`. Learners explicitly cache the compact review, full course notes, cumulative test, answer key, essay Q&A, and glossary with the per-document download action or `Download all`. App and service worker must use the same persistent document cache name (`scp-study-documents-v2` until intentionally migrated), and service-worker activation must preserve that cache across app releases. Normal viewing/printing/sharing must not silently populate the document cache.

Configured PDF requests must include the active Zman's `contentVersion` in their cache identity. If a document changes at the same configured path, increment `contentVersion`; otherwise an explicitly cached older PDF can remain valid forever. The v2 document cache intentionally replaced v1 when this invariant was introduced.

The document download action has two jobs: make the PDF available offline and then invoke the platform save/download behavior. A cached download icon is visually muted but stays enabled because learners may still need to save another filesystem copy (and iOS may expose Save to Files through the share sheet). Keep Print, Share, Download in that visual order. `Download all` populates the offline cache only; it must not trigger six filesystem downloads or share sheets.

A cache-membership-only maintenance change may keep the existing product `APP_VERSION`/package version, but it must change `CACHE_NAME` so already-installed PWAs actually install the new asset set. When the product release number itself changes, increment all release surfaces together:
- `package.json`
- `APP_VERSION` in `public-src/app.js`
- `APP_VERSION` and `CACHE_NAME` in `public-src/sw.js`

The About dialog version is runtime-derived; do not add a second hard-coded release number.

A source fix is not complete if existing installed PWAs remain pinned to an unchanged cache name.

The iOS install guide image is canonical at `public-src/images/install-scp-study-ios.png`; never maintain it only in generated `public/`. The legacy static-binary bundle still contains an older copy, so `build.mjs` must keep `images/install-scp-study-ios.png` in `PUBLIC_SOURCE_OVERRIDES` so bundle extraction cannot overwrite the canonical asset. Keep the guide compact enough for a phone modal, and when the production origin shown in the artwork changes, update every visible URL in the image and verify the rendered asset visually before release.

Generated PDFs are mixed-direction documents: English layout is LTR while Hebrew phrases are RTL. Preserve the logical source wording and handle direction in the PDF renderer. Contiguous Hebrew words must keep their reading order (for example, logical `כלי שני` must render visually as `כלי שני`, not `שני כלי`), and punctuation adjacent to Hebrew must use a font/direction-safe run rather than producing missing-glyph/null boxes.

For Hebrew embedded in an English/LTR sentence, neutral trailing punctuation must be visually compared with the browser rendering. Do not assume punctuation belongs on the RTL-leading edge merely because the preceding word is Hebrew; regression-check a mixed phrase such as question 23's `כלי שני.` in the rendered cumulative-test PDF.

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

Sync is subordinate to Anonymous Usage: it may be configured only when anonymous usage is enabled, and shared state transfer pauses while anonymous usage is off. Linked devices share the historical analytics `installationId`, which now represents an anonymous learner identity for synced users. Never treat that ID as a credential or expose it as a pairing secret.

Each browser/PWA has a separate `deviceId` and, when linked, a separate high-entropy device token. Analytics stores only the token hash. Device tokens are independently revocable; revoking another device must not delete its local study data and must remove only that device's push endpoint from the shared learner.

Question/essay/test progress sync is Zman-scoped, offline-first, operation-based, and idempotent. Do not replace it with whole-localStorage last-write-wins uploads. Resets advance a per-Zman generation so stale offline operations cannot resurrect deleted progress. Active practice-test state remains device-local.

Queued study operations normally trigger a sync immediately (short debounce) while the linked device is online and Anonymous Usage + Sync are both enabled. Sync also flushes on app startup, reconnect, and return to the visible app. The Settings status includes a compact `Sync now` action for an explicit push/pull. A sync pass must acknowledge/remove only the operation IDs it actually sent; never replace the persisted queue with a stale in-memory remainder, because new operations may be appended while a request is in flight. If a successful pass finishes with newly queued operations, schedule another pass.

After `Sync now` completes its local study and notification-state push/pull, it asks Analytics to send a short-lived `sync_request` Web Push to the other linked devices that currently have Push enabled. Treat this as a best-effort wake-up hint, never as sync state or authorization: an active/background client may sync immediately, while a fully closed client still reconciles on its normal launch/resume. The service worker must consume `sync_request` as a control message rather than showing it as an inbox notification, and it must never receive or persist a raw device credential in the push payload.

Notification read/archive state is intentionally shared through the anonymous learner ID only while both Anonymous Usage and device Sync are on. If either is paused on a linked device, read/archive changes stay in a device-local pending overlay and must not adopt read/archive mutations from another device; flush the pending state when both controls are on again. Push subscriptions and reminder delivery remain per device. Synced inbox/push/reminder access must require a valid linked-device credential once a sync account exists.

For `issue_resolved` inbox items, `contentType` + `contentId` are the navigation authority for “View details.” Open questions in Question Explorer and essay prompts/pairings in Essay Explorer (expanding the referenced pairing when applicable) rather than following the legacy generic `/?notifications=1` action back to the inbox.

## Adaptive study selection

The recent-question penalty is ordered oldest-to-newest across the last four study-history entries. A more recent question must receive a stronger penalty than an older one. With four recent slots the multipliers are `0.65, 0.45, 0.28, 0.18`; never reverse this ordering when refactoring the picker.

Weighted review treats study-aid use as weaker evidence of independent recall without changing the learner's visible score. If the most recent answer used relevant audio, an inline glossary definition, or the question's course-note link before submission, multiply the next review weight by `1.6` after a correct result or `1.25` after a partial/incorrect result. Persist `lastStudyAidUsed` with question stats and carry it in sync baselines/answer operations so linked devices schedule consistently. Do not count aid browsing in Question Explorer, Materials, or Essay surfaces against the unrelated current multiple-choice question.

Mastery is based on consecutive **unassisted** correct answers, not lifetime correct count. `unassistedCorrectStreak` increments only for a correct answer with no study aid and resets to zero on an aided correct, partial, or incorrect answer. Once the streak reaches 3, divide review weight by `sqrt(min(streak, 9))`. Persist and sync the streak.

Response-speed weighting uses a recent EWMA rather than lifetime average: each new answered attempt contributes 40% and the previous `recentResponseTimeMs` contributes 60%. Legacy state with no EWMA may fall back to lifetime average until the learner answers again. Persist and sync `recentResponseTimeMs`.

Time-spacing must be continuous rather than threshold buckets. Interpolate in log-time between these age-in-minutes → multiplier anchors: `0→0.12`, `3→0.16`, `15→0.32`, `60→0.55`, `360→0.85`, `1440→1.20`, `4320→1.45`, `10080→1.65`, and cap older answers at `1.65`. Avoid reintroducing discontinuities at bucket boundaries.

Sync credentials, pairing material, cursors, and queues are local implementation state and must never be exported. Import while linked is an explicit merge operation and must warn about duplicate already-synced history.

## Planned one-time wider-production cutover

The owner plans one exceptional clean cutover for the rewritten test when the new custom domains are live. This section is a runbook, **not authorization to erase data**. Do not reset D1 until the owner explicitly gives a same-turn go-ahead after confirming the new content and domains are ready. This exception does not weaken the normal no-destructive-migrations rule after launch.

Target public origins are `https://scp-study.com`, `https://dashboard.scp-study.com`, and `https://announcements.scp-study.com`. Treat a custom-domain move as an origin change: browser local storage, service-worker caches, Push subscriptions, and other origin-scoped state do not transfer automatically. Do not silently copy anonymous installation/device/sync credentials across origins. Expect users to relink Sync, re-enable Push where needed, and install the new-origin PWA.

The owner has explicitly authorized one **development-to-production replacement of `2026-summer` in place**, followed by a full production D1 reset. This is a one-time exception to the normal permanent-ID rule, not a precedent for recycling shipped Zman IDs. Increment `2026-summer`'s `contentVersion` for the replacement package and deploy a server-side content-version fence before the destructive cutover so pre-cutover/offline clients cannot repopulate the reset database with stale question, essay, or sync data. Follow `docs/NEW-ZMAN-PIPELINE.md`, regenerate every derived PDF affected by the rewritten content, and deploy compatible Analytics catalog/API support before exposing the replacement package.

Cutover order:

1. Freeze and validate the rewritten canonical Study content at Zman ID `2026-summer`, increment its `contentVersion`, and verify exact highlighted-source coverage.
2. Update Analytics catalogs/allowlists and Announcements current-Zman/chabura configuration for the replacement content version; update cross-app links, API origins, CORS, and VAPID subject/origin configuration for the three target domains.
3. Verify all three custom domains/TLS routes reach the intended Workers before any destructive step. Decide explicitly whether the old `workers.dev` origins get a temporary compatibility path or are retired; do not assume redirects preserve origin-scoped PWA state.
4. Fence retired-Zman writes so an old installed client cannot repopulate the freshly reset production database with stale question/sync data.
5. Immediately before the reset, export a recoverable backup of the exact shared Analytics/Announcements D1 database and record the deployed Worker versions/configuration. Do not wipe R2 as part of the D1 reset.
6. Only after the owner's explicit go-ahead, reset the exact intended D1 database once, recreate/verify schema with the normal runtime migrations, and verify first-request initialization. Remember that this shared reset removes analytics, feedback, notification/sync state, Announcements accounts/sessions/messages/polls/push state, and R2 media metadata links; R2 objects themselves remain unless separately and explicitly deleted.
7. Re-bootstrap Announcements administration through its documented bootstrap flow, then release the new Study Zman and perform end-to-end checks: answer→analytics, feedback→dashboard→resolved notification, announcement→inbox/push, multi-device sync, PDFs/audio, Home Screen icons, and all cross-app navigation.
8. Keep the D1 backup and known-good Git/Cloudflare versions until the new release is accepted. After this cutover, return to data-preserving migrations only; do not treat this runbook as permission for a future reset.

## Content authority and feedback

Course-owner source files are authoritative for course content. Do not silently replace course wording with outside halachic knowledge.

Student feedback is evidence, not authorization. For substantive question/essay/course changes: inspect the report, inspect current source, verify against authoritative course materials, propose the exact correction, and wait for explicit approval before changing the course content.

If question or essay wording changes, regenerate corresponding derived PDFs in the same release. If glossary terms, pronunciations, or definitions change, regenerate the glossary PDF in the same release; it is derived from the Zman `glossary.yaml`, never hand-maintained as a separate content source.

## Required validation

For client/source changes:
1. Run `npm run build`.
2. Syntax-check modified JavaScript.
3. Run `npm run zman:validate` and confirm Zman authoring/runtime validation passes.
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

Use familiar icons instead of text for compact utility actions when the icon is conventional and unambiguous. Icon-only buttons must have an accessible `aria-label` and a useful `title`. The app header is for identity, session status, and global utilities: Materials, Progress/Stats, Settings, then Notifications. Keep those utilities icon-only and keep Notifications last. The product logo/title is identity, not a hidden navigation target; About belongs at the bottom of Settings. Unread state is a compact alert mark, not a large labeled card.

Keep primary study modes in a stable selector below the app header: `Questions`, `Essays`, `Test`. Do not rename a selected mode to mean its inverse (for example, `Essays` must not become `M/C`, and `Test` must not become `Exit test`). Selected mode state is visual and uses `aria-current`; exiting an active test is an explicit action in the test-progress surface. Categories is a contextual question filter beside the question category, not a global header destination.

The normal-study session timer is both status and the reset target: activating it asks for confirmation and resets that study session. In Test and Essay modes the timer is status-only. Center it relative to the full desktop header; on compact layouts keep it in the single header row with the brand mark and utility icons. On very narrow screens, hide brand copy before abbreviating primary navigation labels.

During an active practice test, preserve test integrity and reduce distraction: keep the test's Questions/Essays sections freely navigable, but hide normal-study search/category filtering and study-aid/global utility entries such as Materials and Stats. Settings and Notifications remain available. Provide the explicit `Exit test` action beside test progress.

Keep native keyboard semantics for intentionally focused controls. After main-question navigation changes the displayed question, move focus to the new question heading rather than globally overriding Enter on focused buttons; this lets Enter submit from question context while preserving Tab/Shift+Tab and native button activation. In Question Explorer, answer reveal is a dialog-session preference: preserve it while moving/searching between questions, reset it when the dialog closes, and keep Explorer navigation/reveal shortcuts out of text-entry controls.

Mobile modal surfaces must have one intentional scrolling container. Keep the native `<dialog>` shell non-scrolling when its inner pane owns scrolling, contain overscroll at that pane, and avoid a scripted smooth-scroll animation fighting coarse-pointer momentum at the top/bottom boundaries.

All dismissible dialogs should close when the user clicks the backdrop/outside the dialog box. Keep this behavior in the shared dialog lifecycle rather than implementing one-off backdrop handlers.

Backdrop dismissal must require the pointer gesture to start and end on the actual `<dialog>` backdrop target. Do not infer backdrop clicks from pointer coordinates alone: Firefox native `<select>` popups can report option-click coordinates outside the dialog and must not close Settings when a selection is made.

Responsive form controls must not overflow their cards. Grid children and inputs/selects should use `min-width: 0`, `max-width: 100%`, and `box-sizing: border-box` where intrinsic mobile control sizing can otherwise escape the container.

Small text must keep normal-text contrast, active icon controls must remain distinguishable even when visually muted, and coarse-pointer layouts should provide generous touch targets for primary utility controls. Honor `prefers-reduced-motion` for CSS motion as well as scripted scrolling.


## Current R2 state

Summer 2026 review audio is canonical at `audio/2026-summer/<filename>`. Because production playback failed after the migration, the Worker temporarily keeps read-only compatibility probes for a literal-leading-slash key and the legacy flat `audio/<filename>` key. Remove those probes only after a live production HEAD/Range playback check confirms the canonical objects and metadata.

The topbar separates desktop and compact placement. On desktop the session timer is centered relative to the full app header. On compact layouts, logo, timer, and the icon utility group remain a single visually centered row; never let Notifications wrap beneath that row. Primary mode navigation remains the separate `Questions` / `Essays` / `Test` selector immediately below the header.


## Notification permission UX

The first time a user opens the notification bell while browser permission is still `default`, request Push permission from that click gesture before opening the inbox. If Push is not enabled, the inbox shows a gentle enable reminder.

Browsers generally cannot re-open the native permission prompt after the user has explicitly blocked notifications. The inbox action should retry when possible and otherwise explain that browser/site settings must be changed; never claim the app can override a browser denial.

## Settings presentation

Settings use one primary section title, not a numeric eyebrow plus a duplicate label. Zman and Chabura show their currently saved value at the bottom of their cards.

Font size is the first setting. Keep it device-local, apply it immediately, preserve the browser's own default font/zoom behavior, and include it in Settings import/export. Large text must reflow without making controls overflow their cards.

Settings is the single home for destructive learner-data actions. Stats/Progress is informational and must not duplicate reset/delete controls. Keep About as a compact final Settings row showing the runtime app version; its dialog should be lightweight product metadata (including current Zman) plus Share app / Check for updates, not a second navigation menu.

In Materials → Downloads, use concise document names such as “Compact Course Review” and “Course Glossary”; do not repeat the “SCP Study” product prefix on every row.

Notification Settings uses the concise description: “Get notified on important announcements and daily study reminders (excluding Shabbat and Yom Tov).”

The bottom reminder summary comes from Analytics `/api/reminders/next`, not duplicated holiday calculations in the browser. It should say disabled, today, tomorrow, after Shabbat, or after Yom Tov as appropriate.

Mobile time/select controls must remain within their card even when WebKit gives native controls a large intrinsic width.

The main question picker and the in-PDF question/essay jump picker keep native `<select>` controls on coarse-pointer/mobile devices, but fine-pointer desktop uses app-rendered menus. This avoids platform/native long-select popup rendering and hidden-overflow quirks (notably Firefox) while retaining mobile system pickers. Keep each native/custom pair synchronized to the current selection.

In the full-screen PDF viewer, the desktop jump menu must match the width of its trigger field. The `<dialog>` and viewer shell are non-scrolling containers; `.pdf-viewer-body` is the single PDF scrolling surface. While the viewer is open, lock document scrolling on both `html` and `body` so the main app scrollbar is hidden and cannot be mistaken for the PDF position. Do not allow the document or dialog to expose a second inert scrollbar alongside the PDF scroll position.


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

Contextual audio play controls must not navigate away from their current study/explorer surface. Pairing audio in Essay practice and Essay Explorer uses the same `playAudioReference(..., { autoplay:true })` mini-player behavior as other contextual audio. Only an explicit transcript/open-player action should open Materials → Audio.

When an explicit transcript action targets the review that is already playing, open Materials → Audio with the transcript synchronized to the player's current time without seeking, pausing, or otherwise interrupting playback. If the transcript action targets a different review (or the matching review is not currently playing), honor the clicked reference timestamp and leave playback paused until the learner explicitly starts it.

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
