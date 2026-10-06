# SCP Study design system

SCP Study should feel like one carefully designed installed application, not a collection of independently styled web controls. This document defines the interaction and visual methodology for learner-facing UI.

## 1. Product hierarchy

The interface has four levels of navigation and action. Do not blur them:

1. **Identity and global utilities** — product mark, session status, Materials, Progress, Settings, Notifications.
2. **Primary study mode** — Questions, Essays, Test, presented as one segmented control.
3. **Context controls** — question/essay picker, category, filter, test progress, search, local resource actions.
4. **Content actions** — answer choices, play audio, open notes, reveal answers, submit, next/previous.

A control's location, style, and remembered state must reflect its level. A top-level destination must always mean the same thing when tapped.

## 2. Icon vocabulary

Prefer existing semantic icons before drawing another version. Icons should use a common outline family: approximately 1.8–2px stroke at a 24px viewBox, round caps/joins where appropriate, and similar optical weight.

Current vocabulary:

- **Materials / notes:** open-book language. Course-note buttons may add page badges, but the underlying book silhouette stays recognizable.
- **Progress & stats:** bar-chart language.
- **Settings:** adjustment/sliders language. Do not use radial marks that can read as sun/brightness.
- **Filter:** funnel. In the compact question context row it is icon-only with an accessible name; do not add a visible label unless the context becomes ambiguous elsewhere.
- **Notifications:** bell.
- **Audio:** play triangle; transcript uses the established text/document glyph.
- **Follow-up:** bookmark/ribbon language. Do not reuse the content-report flag glyph for a learner's follow-up marker.
- **Share / print / download:** reuse the existing PDF/action glyphs rather than drawing screen-specific versions.

One icon means one thing. Do not reuse the same glyph for a different action, and do not introduce several glyphs for the same action without a platform-specific reason.

## 3. Component language

### Header utilities

Global utility buttons share one size, shape, border treatment, icon optical size, hover/pressed behavior, and focus treatment. Their order is Materials → Progress → Settings → Notifications. On compact phones, preserve the group rather than wrapping a utility to a second row.

During a practice test, Materials and Progress may be hidden to reduce distraction, but Settings and Notifications remain available. A user's ability to inspect or change app-level settings is not a study aid.

### Product identity / About

The top-left app icon is the stable About entry point. It opens the lightweight About dialog with product metadata and update/share actions. Preserve this behavior when restructuring the header; product identity should not become an unexplained dead element.

The app icon and Settings → About are two entry points into the same dialog and therefore must share one metadata-hydration path. On a cold page load, the first About open from either route must already show the current version and current Zman. Do not direct-show a shared dialog from one route if another route performs required initialization first.

### Session status

In normal Question study, the session timer itself is the reset target. It remains visually a single status capsule; tapping/clicking it asks for reset confirmation. Do not add a separate reset icon beside the timer. In Essay and Test modes the timer is display-only.

### Segmented mode selector

Questions / Essays / Test form one equal-width segmented control. The outer control needs a visible neutral container. Inactive segments must still look tappable; the selected segment gets a distinct filled surface/shadow. Labels stay centered and never change meaning based on selection.

### Context groups

Controls that describe or modify the same context travel together. For Questions, use the compact order **Filter → question picker → category** on one deliberate row. The filter is the established funnel icon. Do not let Filter or category wrap by itself beneath the picker; truncate the category before breaking the semantic group.

### Shared dialogs with distinct entry points

Implementation reuse is welcome, semantic ambiguity is not. If Materials and Settings reuse the same dialog shell, the title/navigation chrome must adapt to the entry point. Materials should expose material tabs; Settings should read as Settings and should not appear merely as the remembered sixth Materials tab. Persisted Materials state may remember the last material content tab only.

Settings has one visual frame: the dialog shell. Do not repeat “Settings / App settings” title-description blocks inside a second bordered wrapper. Individual setting cards may retain their own grouping, but the settings surface itself should not look like a card nested inside a duplicate card.

Any dialog with multiple launch controls must have a canonical preparation step that runs before `showModal()`. Dynamic labels, version/Zman data, selected state, counts, and permissions must never depend on another launch control having been used earlier in the session.

### Test question state

In Test mode, the question picker communicates three attempt states: unanswered, answered, and marked for follow-up. Use symbols/shape in addition to color so native mobile selects and accessibility settings retain the distinction. Follow-up marking is a review aid only and must not resemble “report content.”

### Test sections and essays

The combined test uses one three-hour countdown for Questions plus Essays. Questions and Essays are peer sections inside one active attempt: the learner may switch between them at any time, jump directly to a question or essay, and return to unfinished work. Do not gate Essays behind completion of every multiple-choice question.

Essay prompts use a quiet exam-like response surface with autosaved text and no model answer/study aid during the attempt. Post-test self-review may reveal the model answer. Multiple-choice score and essay completion are reported separately because free-form essay responses are not automatically graded.

## 4. Spacing and geometry

Use a small spacing rhythm rather than arbitrary gaps: roughly 4, 8, 12, 16, 24, and 32px increments, adjusted optically when needed. Related controls sit closer together than unrelated groups. Repeated controls on the same tier should share corner radius and height.

Touch controls should be comfortably tappable on coarse pointers; where a visually compact icon is necessary, preserve adequate hit area through padding/container sizing. Do not solve a crowded phone header by shrinking every target until the meaning and usability degrade.

## 5. Responsive methodology

Before a learner-facing release, inspect at roughly 320, 375, 390, and 430 CSS px plus a normal desktop width. Also test at least one enlarged app font setting. At each width verify:

- no horizontal overflow;
- global utilities remain one coherent group;
- the segmented mode selector is centered and equal-width;
- Filter / question picker / category remain deliberately grouped;
- long labels truncate or wrap in the intended place;
- no control is stranded on a row by itself;
- selected/unselected/disabled states remain understandable;
- Settings action rows reflow as a whole when a generic full-width mobile button would otherwise collide with adjacent copy;
- test question statuses remain readable in native and custom pickers;
- test Questions/Essays section switching and direct essay jumping remain usable at narrow widths;
- essay response fields and navigation fit without creating a second horizontal scroll surface;
- safe-area insets and bottom floating controls remain usable;
- dialogs have one intentional scroll surface.

Passing CSS syntax or avoiding overflow is not a visual audit. Check optical centering, icon meaning, spacing rhythm, hierarchy, and whether the first-time user can predict what a control will do.

## 6. State and predictability

Remember state only when remembering it helps the same semantic destination. Examples: remembering the last audio transcript position is useful; remembering a Settings panel and then opening it from the Materials button is not. A user's prior navigation should never silently change the meaning of a top-level control.

When two controls lead into shared internals, their entry contracts remain independent but their initialization must be equivalent. Test each path as the **first** path used after a cold load, not merely after another path has already populated the shared UI.

Test follow-up flags and essay drafts belong to the active test attempt. They must not leak into a later attempt. Free-form essay text is device-local unless a future feature explicitly asks the learner to sync or submit it.

## 7. Review before release

A UI change is complete only after a design pass over the affected surface and its neighboring controls. Ask:

- Did we reuse an established component/icon where one already existed?
- Does every icon have one obvious meaning at phone size?
- Do top-level buttons always open deterministic destinations?
- Do all entry points into a shared dialog show correct dynamic state on their first open after a cold load?
- Are repeated controls geometrically and visually consistent?
- Does the session timer use the intended mode-specific interaction?
- Does the layout still look intentional at narrow iPhone widths and large text?
- If Test changed, are Settings, question states, follow-up marking, free Questions↔Essays navigation, direct essay jumping, and the three-hour timer all coherent?
- Did this change create a new visual dialect that should instead be folded into the shared component system?

Prefer fewer, stronger patterns over more custom styling.
