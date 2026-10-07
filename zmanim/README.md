# Zman authoring

This directory is the human- and AI-readable source for study content. The browser receives optimized JavaScript generated from these files.

Each Zman has one directory. Keep meaning next to the content it describes:

- `zman.yaml` - identity, lifecycle, content version, audio policy, and document filenames.
- `questions.yaml` - multiple-choice questions, tested concepts, note pages, provenance, and optional review-audio clips.
- `essays.yaml` - essay prompts, generalized pairing roots/response banks, note pages, provenance, and optional review-audio clips.
- `glossary.yaml` - terms and related categories.
- `audio-reviews.yaml` - review metadata and transcript filenames.
- `transcripts/*.vtt` - WebVTT transcripts.
- `chaburos.yaml` - locations and Rav lists.
- `coverage-audit.yaml` - machine-reviewable highlighted-scope coverage and reviewed scope statement.
- `documents/` - canonical learner-facing compact-review and full-notes PDFs for package-backed Zmanim.

Derived values do not belong here: question/essay counts, analytics keys, public paths, R2 prefixes, runtime lookup maps, and compatibility JavaScript are generated.

## Assessment-source contract

When a highlighted concise copy is supplied, follow `docs/NEW-ZMAN-PIPELINE.md` exactly:
- yellow = multiple-choice scope;
- green = essay scope;
- blue name inside scoped material = explicitly test that name association;
- the plain concise PDF is the compact-study document/page-link authority;
- the full notes clarify and support linkages but do not expand assessment scope.

If source materials conflict or a highlighted point cannot be represented without assuming new course content, stop and ask rather than filling the gap from general knowledge.

## Generalized essay matching

Do not model essay data as hard-coded `authority` and `position` fields.

Each essay uses a response bank plus pairing roots. A root has a stable ID, human-readable text, and one or more accepted response IDs. Response reuse is one use by default and may be explicitly increased/unlimited when the relationship requires many-to-one matching.

This graph supports one-to-one, one-to-many, many-to-one, and many-to-many relationships. Unordered lists are represented by interchangeable roots (for example `First`, `Second`, `Third`, `Fourth`) which all accept the same correct response set while the responses themselves remain single-use.

Distractors are responses with no valid root edge and must be explicitly marked as distractors. Their normalized text must not duplicate a correct response or another distractor.

The validator must reject an essay whose root/response graph cannot produce at least one complete valid assignment under the configured response-use limits.

## Workflow

For a normal new Zman:

```sh
npm run zman:new -- 2026-fall 2026-10-20 "Fall 2026"
```

Then fill the YAML/VTT files, place canonical documents in the Zman package, and run:

```sh
npm run zman:validate
npm run zman:compile
npm run build
```

Draft packages are validated but excluded from the browser runtime.

Summer 2026 has a one-time development-to-production replacement authorized by the course owner. That exception retains `2026-summer`, increments `contentVersion`, and requires an Analytics content-version fence plus a validated database-reset cutover. It does not create a general precedent for recycling shipped Zman IDs.
