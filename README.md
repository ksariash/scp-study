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

`npm run build` creates `public/` from the versioned text chunks in `parts/` plus the binary static-asset bundle stored as base64 chunks in `assets/`. Review audio is intentionally not included in that archive.

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

## Release 24

- Moved the 16 large Short & Sweet recordings out of the static deployment and into R2.
- Kept all existing audio URLs same-origin.
- Reduced the iOS installation tutorial image from 1223×1286 / ~1.5 MB to 768×808 / ~250 KB while preserving the same artwork.
- Bumped the app/service-worker release to v24.
