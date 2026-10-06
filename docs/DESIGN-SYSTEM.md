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
- **Filter:** funnel plus `Filter` text when phone-space permits; contextual filters should favor clarity over extreme compactness.
- **Notifications:** bell.
- **Audio:** play triangle; transcript uses the established text/document glyph.
- **Share / print / download:** reuse the existing PDF/action glyphs rather than drawing screen-specific versions.

One icon means one thing. Do not reuse the same glyph for a different action, and do not introduce several glyphs for the same action without a platform-specific reason.

## 3. Component language

### Header utilities

Global utility buttons share one size, shape, border treatment, icon optical size, hover/pressed behavior, and focus treatment. Their order is Materials → Progress → Settings → Notifications. On compact phones, preserve the group rather than wrapping a utility to a second row.

### Session status

The session timer is a status capsule. Reset is an adjacent circular action, not embedded into the timer text box. The two may be visually related, but spacing must make status versus action unambiguous.

### Segmented mode selector

Questions / Essays / Test form one equal-width segmented control. The outer control needs a visible neutral container. Inactive segments must still look tappable; the selected segment gets a distinct filled surface/shadow. Labels stay centered and never change meaning based on selection.

### Context groups

Controls that describe or modify the same context travel together. For Questions, the question picker is one unit and category + Filter is another unit on the same deliberate row. Do not let Filter wrap by itself beneath the picker. If a label is too long, truncate the category before breaking the semantic group.

### Shared dialogs with distinct entry points

Implementation reuse is welcome, semantic ambiguity is not. If Materials and Settings reuse the same dialog shell, the title/navigation chrome must adapt to the entry point. Materials should expose material tabs; Settings should read as Settings and should not appear merely as the remembered sixth Materials tab. Persisted Materials state may remember the last material content tab only.

## 4. Spacing and geometry

Use a small spacing rhythm rather than arbitrary gaps: roughly 4, 8, 12, 16, 24, and 32px increments, adjusted optically when needed. Related controls sit closer together than unrelated groups. Repeated controls on the same tier should share corner radius and height.

Touch controls should be comfortably tappable on coarse pointers; where a visually compact icon is necessary, preserve adequate hit area through padding/container sizing. Do not solve a crowded phone header by shrinking every target until the meaning and usability degrade.

## 5. Responsive methodology

Before a learner-facing release, inspect at roughly 320, 375, 390, and 430 CSS px plus a normal desktop width. Also test at least one enlarged app font setting. At each width verify:

- no horizontal overflow;
- global utilities remain one coherent group;
- the segmented mode selector is centered and equal-width;
- question picker/category/filter remain deliberately grouped;
- long labels truncate or wrap in the intended place;
- no control is stranded on a row by itself;
- selected/unselected/disabled states remain understandable;
- safe-area insets and bottom floating controls remain usable;
- dialogs have one intentional scroll surface.

Passing CSS syntax or avoiding overflow is not a visual audit. Check optical centering, icon meaning, spacing rhythm, hierarchy, and whether the first-time user can predict what a control will do.

## 6. State and predictability

Remember state only when remembering it helps the same semantic destination. Examples: remembering the last audio transcript position is useful; remembering a Settings panel and then opening it from the Materials button is not. A user's prior navigation should never silently change the meaning of a top-level control.

When two controls lead into shared internals, their entry contracts remain independent. Test both paths after every change to shared dialog/navigation code.

## 7. Review before release

A UI change is complete only after a design pass over the affected surface and its neighboring controls. Ask:

- Did we reuse an established component/icon where one already existed?
- Does every icon have one obvious meaning at phone size?
- Do top-level buttons always open deterministic destinations?
- Are repeated controls geometrically and visually consistent?
- Are status and action visually distinct?
- Does the layout still look intentional at narrow iPhone widths and large text?
- Did this change create a new visual dialect that should instead be folded into the shared component system?

Prefer fewer, stronger patterns over more custom styling.
