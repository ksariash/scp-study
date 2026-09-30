# SCP Study

SCP Study is the installable study PWA for the SCP kashrut course.

## Hosting layout

- Application code, PDFs, icons, the iOS install tutorial image, and glossary-pronunciation clips are deployed as Cloudflare Workers Static Assets.
- The 16 Short & Sweet review recordings live in the private R2 bucket `scp-study-audio` under the `audio/` prefix.
- Requests to `/audio/*` are handled by the Worker through the `AUDIO` R2 binding, so the app keeps same-origin audio URLs and does not need a public R2 hostname or CORS configuration.
- Anonymous course analytics continue to post to the separate `scp-study-analytics` Worker.

## Build

```bash
npm install
npm run build
```

`npm run build` creates `public/` from the versioned text sources in `public-src/` plus the binary static-asset bundle at `assets/static-binaries.tar.gz`. Review audio is intentionally not included in that archive.

## Deploy

```bash
npm run deploy
```

The Worker name is `scp-study`. The deployment expects the private R2 bucket `scp-study-audio`, bound as `AUDIO` by `wrangler.jsonc`.

### Cloudflare Workers Builds

Recommended settings for the GitHub integration:

- Production branch: `main`
- Root directory: `/`
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`

After the repository is connected to the existing `scp-study` Worker, pushes to `main` can deploy automatically.

## Audio behavior

The app still refers to review files at paths such as `/audio/nat-bar-nat-foundations.m4a`. The Worker maps those paths to identically named R2 objects, supports `GET`, `HEAD`, and byte-range responses, and preserves long-lived cache metadata. The app's existing per-track and Download All offline-cache controls continue to work.

## Release 25

- Moved the 16 large Short & Sweet recordings out of the static deployment and into R2.
- Kept all existing audio URLs same-origin.
- Reduced the iOS installation tutorial image from 1223×1286 / ~1.5 MB to 768×808 / ~250 KB while preserving the same artwork.
- Added sticky Audio / Glossary / Downloads tabs to the Materials dialog, with remembered tab and scroll position.
- Contextual transcript links and the mini audio bar open Materials directly to Audio.
- Kept the transcript and mobile playlist collapsible within the Audio tab.
- Bumped the app/service-worker release to v25.


## Release 26

- Simplified the 10-second seek controls to clean circular-arrow icons without numeric labels.
- Made the quick-access audio bar use the same rewind icon as the main player.


## Release 27

- Expanded Course Materials to five compact tabs in this order: Audio, Questions, Glossary, Downloads, Settings.
- Added a Questions tab with search, current-question access, all-question browsing, and topic shortcuts.
- Moved anonymous usage sharing into Settings.
- Added Settings controls to clear the offline cache and reset local study statistics.
- Kept the mobile tab strip to a single compact row to preserve question-reading space.


## Release 28

- Added Essay Practice based on the compact course review's essay/name material.
- Essay answers are built from shuffled name, position, and qualification blocks with plausible distractors.
- Grading checks each required name → position → detail relationship rather than requiring one rigid full-answer sentence order.
- Wrong pairings and selected distractors are marked red; missing relationships are listed explicitly.
- Added immediate same-question retry, model answers after submission, and weighted fact-level mastery so weak associations return more often.
- Essay mastery is saved locally and is cleared by Reset statistics.
