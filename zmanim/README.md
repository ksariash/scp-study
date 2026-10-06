# Zman authoring

This directory is the human- and AI-readable source for study content. The browser still receives optimized JavaScript; the build generates that JavaScript from these files.

Each Zman has one directory. Keep meaning next to the content it describes:

- `zman.yaml` — identity, lifecycle, audio migration policy, and document filenames.
- `questions.yaml` — questions, their course-note pages, and optional review-audio clips.
- `essays.yaml` — prompts, facts, category tags, note pages, and optional review-audio clips.
- `glossary.yaml` — terms and the categories that use them.
- `audio-reviews.yaml` — review metadata and transcript filenames.
- `transcripts/*.vtt` — standard WebVTT transcripts, editable in normal subtitle tools.
- `chaburos.yaml` — locations and their Rav lists.

Derived values do not belong here: question/essay counts, analytics keys, public paths, R2 prefixes, token IDs, audio maps, category maps, and course-note lookup tables are generated.

## Workflow

Create a skeleton with:

```sh
npm run zman:new -- 2026-fall 2026-10-20 "Fall 2026"
```

Then add the new ID to `registry.yaml`, fill in the YAML/VTT files, put the referenced PDFs/audio objects in their documented storage locations, and run:

```sh
npm run zman:validate
npm run zman:compile
npm run build
```

The validator treats an incomplete or inconsistent package as an error so the same contract works for a person editing by hand or an automated authoring workflow.
