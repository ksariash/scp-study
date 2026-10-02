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

Any app-shell or cached-asset change must increment all release surfaces together:
- `package.json`
- `APP_VERSION` in `public-src/app.js`
- `APP_VERSION` and `CACHE_NAME` in `public-src/sw.js`

The About dialog version is runtime-derived; do not add a second hard-coded release number.

A source fix is not complete if existing installed PWAs remain pinned to an unchanged cache name.

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

## Content authority and feedback

Course-owner source files are authoritative for course content. Do not silently replace course wording with outside halachic knowledge.

Student feedback is evidence, not authorization. For substantive question/essay/course changes: inspect the report, inspect current source, verify against authoritative course materials, propose the exact correction, and wait for explicit approval before changing the course content.

If question or essay wording changes, regenerate corresponding derived PDFs in the same release.

## Required validation

For client/source changes:
1. Run `npm run build`.
2. Syntax-check modified JavaScript.
3. Confirm Zman registry/package validation passes.
4. Confirm app/package/service-worker/cache versions agree for an app-shell release.
5. Check representative document and audio paths.
6. Commit to `main`.
7. Inspect the Cloudflare Workers Builds check.
8. For cross-repo changes, verify Analytics first and Study second.

Do not commit secrets, generated `public/`, `.wrangler/`, or local environment files.
