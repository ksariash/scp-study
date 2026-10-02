# SCP Study — LLM operating guide

This file is the first file an LLM should read before modifying this repository. Treat it as part of the application architecture, not optional documentation. If a code change makes any statement here inaccurate, update this file in the same commit.

## What this repository is

SCP Study is a reusable PWA shell plus Zman-specific study content. The shell lives in `public-src/`; Zman content lives under `public-src/Zmans/<Zman-id>/`. The deployed Worker serves static assets and streams Short & Sweet review audio from the private R2 bucket through same-origin `/audio/*` URLs.

The current Zman is `2026-summer`. Do not hard-code its question count, essay count, categories, names, notes, or audio into reusable app logic.

## Read before editing

1. Fetch current `main`. Never assume a prior commit or generated `public/` tree is current.
2. Read `docs/ARCHITECTURE.md` for boundaries and invariants.
3. For course-content work, read `docs/NEW-ZMAN-PIPELINE.md` and the active Zman package.
4. The class source files supplied by the course owner are authoritative. Preserve their terminology and framing. Do not silently replace a course statement with outside halachic knowledge.
5. Run `npm run build` before committing. The build validates every registered Zman.

## Canonical sources

Never hand-edit generated `public/`.

Reusable shell:
- `public-src/index.html`
- `public-src/styles.css`
- `public-src/app.js`
- `public-src/sw.js`
- `src/index.js`
- `build.mjs`

Zman registry:
- `public-src/Zmans/index.js`

Per-Zman source:
- `public-src/Zmans/<id>/Zman.js`
- `questions.js`
- `essay-practice.js`
- `audio-reviews.js`
- `glossary.js`
- `chaburos.js`
- `course-notes.js`

Generated PDFs are built from the default Zman's question/essay sources. Supplied compact/full notes are static source assets; do not regenerate or paraphrase them as a build product.

## Hard invariants

- Keep the localStorage key `courseReviewSpacedRepetition.v1`. Its internal envelope is Zman-scoped.
- Zman IDs and analytics keys are permanent identifiers once data has shipped.
- A question/essay/fact ID only has meaning inside its Zman. Never assume IDs are globally unique across Zmans.
- All student analytics and feedback must include the active Zman analytics key.
- Progress, essay mastery, essay-category filters, audio playback state, and chabura settings are Zman-scoped.
- Every question and essay must have compact and full note locations.
- Every audio mapping must point to an existing review and a valid start time.
- Review-audio public URLs must be namespaced by Zman. Summer 26 currently uses a Worker fallback to the legacy flat R2 objects; do not remove that fallback until the objects have actually been copied into the namespaced R2 prefix and playback/range requests are verified.
- Do not expose R2 credentials, GitHub tokens, or admin secrets to browser code.
- Content feedback does not authorize a content change. Investigate, verify against course sources, propose the fix, and wait for explicit approval before changing substantive course content.
- If question or essay wording changes, regenerate the corresponding derived PDFs in the same release.

## Release workflow

For a normal change: inspect latest main → edit canonical source → bump app/package/service-worker version when client behavior/assets change → run build and syntax checks → commit to main → report that Cloudflare should auto-deploy. Do not claim a live deployment unless independently verified.

For architecture changes, also update this file and the relevant document under `docs/`.


## Deployment authority

When the user asks to implement a change, the normal meaning is implement → validate → commit to `main` → allow Cloudflare Workers Builds to deploy → inspect the resulting Cloudflare check. Do not stop at a branch or PR unless explicitly requested.

## Zman migration compatibility

The stable current Zman ID and analytics key are `2026-summer`. Older installed clients may still reference the legacy ID `nat-bar-nat-stam-yeinam-summer-26`; preserve read/migration compatibility for shipped local state until that compatibility is intentionally retired.

Current review audio should live in R2 at `audio/2026-summer/<filename>`. The Worker still falls back to flat `audio/<filename>` objects until the namespaced copies are verified in production.


## Notifications, push, reminders, and data controls

The notification inbox is filtered to the active Zman. D1 is canonical notification history; Web Push is a delivery channel. The browser stores only reminder preferences and the PushSubscription. Unknown future notification kinds must still render title/body safely, and only recognized safe actions should become links.

Daily reminder preferences include an IANA timezone, HH:MM time, and Diaspora/Israel holiday calendar choice. The Analytics Worker suppresses reminders on Shabbat and Yom Tov.

Exports must never include the anonymous analytics installation ID, analytics/feedback upload queues, notification state, or PushSubscription keys. Server-data deletion must occur before the local installation ID is erased.

Settings are intentionally ordered: Zman → chabura → study reminders → anonymous usage → cache → import/export → reset statistics → delete all data.
