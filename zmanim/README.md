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
- `coverage-audit.yaml` — highlighted-topic coverage and the reviewed scope statement used in the instructor key.
- `documents/` — for a new Zman, the compact review and full-notes PDFs named in `zman.yaml`.

Question `testedConcept` values and `coverage-audit.yaml` are audit evidence, not runtime plumbing. Keep them readable and source-grounded. A newly scaffolded Zman intentionally fails validation until its content and coverage audit are filled in.

Derived values do not belong here: question/essay counts, analytics keys, public paths, R2 prefixes, token IDs, audio maps, category maps, and course-note lookup tables are generated.

## Workflow

Create a skeleton with:

```sh
npm run zman:new -- 2026-fall 2026-10-20 "Fall 2026"
```

Then fill in the YAML/VTT files, put the referenced PDFs/audio objects in their documented storage locations, and run:

```sh
npm run zman:validate
npm run zman:compile
npm run build
```

The validator treats an incomplete or inconsistent package as an error so the same contract works for a person editing by hand or an automated authoring workflow.

New skeletons start with `status: draft` and `documentSource: package`. Put the compact-review and full-notes PDFs in that Zman's `documents/` directory; the cumulative test, answer key, essay Q&A, and glossary PDFs are generated from the YAML at build time. Draft directories are validated but never emitted into `public/cohorts/`, so Analytics-unapproved material cannot become student-selectable just because it exists on `main`. After the Analytics readiness gate, change the lifecycle status deliberately and update `latestZmanId`/`defaultZmanId` in `registry.yaml` only when that rollout behavior is intended.

Summer 2026 alone uses `documentSource: legacy-root` so already-installed clients keep their historical root PDF URLs. Do not use that setting for a new Zman.
