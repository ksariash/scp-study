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


## Release 29

- Moved Essay Practice out of the Questions tab and into a dedicated top-bar Essay button immediately before Test.
- Renamed the top-bar “Test mode” button to “Test”.
- Added an Essay intro dialog with instructions, mastery/coverage stats, essay-attempt stats, and a Start essay practice button.
- Kept the five mobile header controls (Categories, Materials, Stats, Essay, Test) on one compact row.


## Release 30

- Added a searchable Essay Questions & Answers library from the Essay intro popup.
- Each essay can show its required green-highlight pairings and model answer, with a Practice this essay shortcut.
- Reworded all essay prompts to read like normal exam questions.
- Reworked Essay Practice into cleaner two-part concept pairings: authority/concept + complete held position/qualification.
- Distractors now use plausible position blocks that can be paired with the wrong authority instead of awkward sentence fragments.
- Split mixed-authority concept blocks so each graded relationship tests one clean association.


## Release 31

- Rewrote Essay Practice position blocks so each name pairing is self-contained and does not depend on phrases such as “this case” or “the lenient track.”
- Replaced near-miss false distractors with clearly off-topic statements that are themselves true course facts, reducing the risk of reinforcing an incorrect name/position association.
- Distractor blocks remain visually comparable to position blocks but are treated as standalone extras rather than name pairings.
- Added SCP Study — Essay Questions & Sample Answers to the Downloads tab with Print and Download controls.


## Release 32

- Rebuilt Essay Practice as a one-pairing-at-a-time matching flow instead of a large block bank.
- Removed distractors entirely.
- Each step shows one authority/concept and three position choices drawn only from correct facts in that essay.
- Wrong choices receive immediate feedback and are disabled; correct choices are immediately added to the essay buildout.
- The next pairing appears automatically, so there is no Submit button.
- Essay completion now records first-try accuracy and reveals Practice again, Next essay, and the model answer.


## Release 33

- Added student content feedback for multiple-choice questions, essay prompts, and individual essay pairings.
- Feedback includes common issue reasons plus an optional 500-character detail box.
- Reports are anonymous, explicitly submitted, and separate from the automatic anonymous-usage preference.
- Each report stores the exact wording/content version the student saw plus relevant answer/pairing context.
- Duplicate reports for the same unchanged content are suppressed on-device; queued reports retry when connectivity returns.


## Release 35

- Checks the service worker for a newer app shell at startup and refreshes controlled clients when a new version activates.
- Adds one-time chabura setup, saved locally and editable under Materials → Settings.
- Anonymous analytics events now include the selected chabura when analytics are enabled.
- On mobile, tapping the SCP Study logo or title opens the native share sheet when available.


## Release 36

- Reorders Essay Practice pairing content so relevant audio appears before the authority/name, followed by the position choices. This is especially intended to make the mobile flow read naturally as audio → name → pairing choices.


## Release 37

- Adds tap-safe mobile interaction by disabling double-tap zoom while preserving normal pan/pinch gestures.
- Makes the question-number badge a quick navigator to any question 1–58 in Study or Test mode.
- Checks for service-worker updates on launch and when the user pulls down from the top of the app.
- Shows a versioned update toast after a newly activated app shell reloads, and shows the current app version at the bottom of the app.


## Release 38

- Essay analytics use responsive performance cards instead of a wide table on small screens.
- PDF downloads show Print + Download on desktop and Download only on mobile; on iOS Download opens the native file/share sheet.
- The Compact Course Review is no longer generated at build time. Its original PDF stays in the versioned static asset bundle and is copied unchanged.
- The cumulative test, answer key, and essay PDF remain generated from the same source-controlled question and essay banks as the app.

PDF regression diagnostics compare generated study PDFs against the legacy reference layout during CI.


## Release 39

- Fixes Essay Buildout glossary links so matched glossary terms remain inline inside the sentence instead of being forced onto separate lines.
- Replaces the question-number jump dialog with a native 1–58 dropdown directly in the question badge for faster navigation.


## Release 40

- Essay Practice now takes over the app's main study area after it starts instead of running inside a modal.
- While Essay mode is active, the top Essay button becomes M/C. Tapping it opens a short Multiple Choice explanation before returning to adaptive question study.
- Multiple-choice question timing and keyboard shortcuts pause while the Essay workspace is active.
- Refined the native question-number dropdown into a compact pill with a custom chevron and cleaner focus/hover treatment.
