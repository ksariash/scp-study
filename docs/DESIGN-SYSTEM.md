# SCP Study design system

SCP Study should feel like one carefully designed installed application, not a collection of independently styled web controls. This document defines the interaction and visual methodology for learner-facing UI.

## 1. Product hierarchy

The interface has four levels of navigation and action. Do not blur them:

1. **Identity and global utilities** — product mark, session status, Materials, Progress, Settings, Notifications.
2. **Primary study mode** — Questions, Essays, Test.
3. **Context controls** — question/essay picker, category, filter, test progress, search, local resource actions.
4. **Content actions** — answer choices, pairings, play audio, open notes, reveal answers, submit, next/previous.

A control's location, style, and remembered state must reflect its level. A top-level destination must always mean the same thing when tapped.

## 2. Icon vocabulary

Prefer existing semantic icons before drawing another version. Icons should use a common outline family: approximately 1.8–2px stroke at a 24px viewBox, round caps/joins where appropriate, and similar optical weight.

Current vocabulary:

- **Materials / notes:** open-book language. Course-note buttons may add page badges, but the underlying book silhouette stays recognizable.
- **Progress & stats:** bar-chart language.
- **Settings:** adjustment/sliders language. Do not use radial marks that can read as sun/brightness.
- **Filter:** funnel. In the compact question context row it is icon-only with an accessible name.
- **Notifications:** bell.
- **Audio:** play triangle; transcript uses the established text/document glyph.
- **Follow-up:** bookmark/ribbon language. Do not reuse the content-report flag glyph for a learner's follow-up marker.
- **Share / print / download:** reuse the existing PDF/action glyphs rather than drawing screen-specific versions.

One icon means one thing. Do not reuse the same glyph for a different action, and do not introduce several glyphs for the same action without a platform-specific reason.

## 3. Component language

### Header utilities

Global utility buttons share one size, shape, border treatment, icon optical size, hover/pressed behavior, and focus treatment. Their order is Materials → Progress → Settings → Notifications. On compact phones, preserve the group rather than wrapping a utility to a second row.

During a practice test, Materials and Progress are hidden to reduce distraction, while Settings and Notifications remain available. Hiding neighboring utilities must not change the internal geometry of the surviving controls: Settings and Notifications stay optically centered in the same circles they use elsewhere.

### Product identity / About

The top-left app icon is the stable About entry point. It opens the lightweight About dialog with product metadata and update/share actions. Preserve this behavior when restructuring the header; product identity should not become an unexplained dead element.

The app icon and Settings → About are two entry points into the same dialog and therefore must share one metadata-hydration path. On a cold page load, the first About open from either route must already show the current version and current Zman. Do not direct-show a shared dialog from one route if another route performs required initialization first.

### Session status

In normal Question study, the session timer itself is the reset target. It remains visually a single status capsule; tapping/clicking it asks for reset confirmation. Do not add a separate reset icon beside the timer. In Essay and Test modes the timer is display-only.

### Primary mode selector

Questions / Essays / Test form one stable primary-navigation control. Their labels never mutate based on selection, inactive choices must still look actionable, and the selected mode must be unmistakable. Equal alignment and balanced geometry matter at phone size.

The exact visual treatment is intentionally open for a future reference-driven redesign. Do not assume the current segmented-control appearance is permanent. Once the product owner selects an external reference pattern, reproduce that visual logic consistently rather than creating a hybrid. Preserve the semantic contract and accessibility regardless of the chosen styling.

### Context groups

Controls that describe or modify the same context travel together. For Questions, use the compact order **Filter → question picker → category** on one deliberate row. The filter is the established funnel icon. Do not let Filter or category wrap by itself beneath the picker; truncate the category before breaking the semantic group.

### Shared dialogs with distinct entry points

Implementation reuse is welcome, semantic ambiguity is not. If Materials and Settings reuse the same dialog shell, the title/navigation chrome must adapt to the entry point. Materials should expose material tabs; Settings should read as Settings and should not appear merely as the remembered sixth Materials tab. Persisted Materials state may remember the last material content tab only.

Settings has one visual frame: the dialog shell. Do not repeat “Settings / App settings” title-description blocks inside a second bordered wrapper. Individual setting cards may retain their own grouping, but the settings surface itself should not look like a card nested inside a duplicate card.

Any dialog with multiple launch controls must have a canonical preparation step that runs before `showModal()`. Dynamic labels, version/Zman data, selected state, counts, and permissions must never depend on another launch control having been used earlier in the session.

Settings controls must be intrinsically size-safe. Toggle labels, sync state, and action buttons must remain inside their cards at desktop dialog widths as well as narrow phones. Prefer `minmax(0,1fr)`, `min-width:0`, and intentional wrapping over fixed intrinsic widths that force overflow.

### Test question state

In Test mode, the question picker communicates three attempt states: **Not answered**, **Answered**, and **Follow-up**. Symbols/shape/text supplement color so native mobile selects and accessibility settings retain the distinction. An unfinished question must be visually conspicuous enough for rapid scanning; faint gray text is not sufficient.

A submitted multiple-choice answer may be locked, but its correctness is private until the entire test is submitted. During the active attempt, suppress result-colored choice styling, Correct/Incorrect/Partial status, explanations, and correct-answer text. Neutral “Answered” is sufficient.

Submitting a question advances to the next question automatically. This behavior is part of the exam rhythm, not a separate shortcut, so it must be identical whether Submit was tapped or Enter was used.

### Test sections, progress, and timer

The combined test uses one three-hour countdown for Questions plus Essays. Questions and Essays are peer sections inside one active attempt: the learner may switch between them at any time, jump directly to a question, essay, or essay pairing, and return to unfinished work. Do not gate Essays behind completion of every multiple-choice question.

Progress bars report work completed, not navigation position. The question bar is `answered questions / total questions`. Directly beneath it, a visually distinct essay bar is `fully completed essays / total essays`. An essay is complete only when every required pairing has a submitted selection; merely opening or partially completing an essay does not advance the overall essay bar.

Each progress bar has one visual state owner. Do not let a legacy position-based renderer briefly write a width that a completion-based renderer then corrects; visible “jump then settle” behavior is a design bug even when the final percentage is mathematically right.

The displayed countdown also has one visual writer. Internal safety/grace timing may exist, but it must not race the learner-facing countdown or make seconds visibly stutter. The displayed timer reaches zero exactly when the test finalization path runs.

### Test essays

Test essays deliberately reuse the normal Essay-mode pairing vocabulary. Show the essay prompt, the same authority/concept → position pairing task, and a neutral list of submitted pairings. Do not introduce a parallel free-form essay editor for the test.

The entire choice row is a touch/click target; text or number-badge descendants must not create dead areas. Submitted pairings are likewise whole-row Edit targets. Interaction reliability is part of visual quality: a control that only works when a particular glyph is tapped does not meet the design standard.

Pairings are freely navigable. Learners can skip forward, go backward, and select a precise pairing from the essay picker. The picker exposes the essay→pairing hierarchy and shows completion/follow-up markers for both levels. Essay-level and pairing-level Follow-up use the established bookmark language and remain independent.

Number badges on pairing options intentionally echo multiple-choice keyboard affordances. Number keys select the corresponding option; Enter submits the selected pairing. Left/Right navigate pairings, while Shift+Left/Right move between essays. A compact footer explains these controls on keyboard-capable layouts without competing with content.

Correctness remains hidden for essay pairings until final test submission. No green/red states, “Correct”, corrective copy, model answers, or study-aid hints appear during the timed attempt.

### Post-test review

Submitting a test transitions from **exam state** to **review state**. Review should feel like navigating the completed exam, not reading a long report.

Multiple-choice review uses stable numerical question order even though the actual attempt was shuffled. One question is reviewed at a time with the learner's selection, correct answer, result, explanation, and saved Follow-up state clearly differentiated.

Essay review uses the same hierarchical mental model as the attempt: essay prompt + one pairing at a time, with the submitted pairing and canonical correct pairing shown together. The full submitted essay buildout and model answer may appear in review because grading is now final. Preserve essay and pairing Follow-up markers.

Previous-test history belongs primarily in Progress & stats because it is historical performance. A secondary `Review previous tests` affordance in the Start Test dialog is acceptable because it is contextually relevant. Both launch the same history/review components; do not create two different review UIs.

Older test records that predate detailed local review storage should be clearly labeled as summary-only rather than pretending per-question selections are available.

### Test exit/finish

`Exit test` must remain a reliable escape route while the attempt is incomplete. After confirmation, it records an incomplete result and leaves Test mode. Once every multiple-choice question has been submitted, the same control becomes `Finish test`; finishing submits the combined attempt and confirms if any essays are still incomplete.

## 4. Spacing and geometry

Use a small spacing rhythm rather than arbitrary gaps: roughly 4, 8, 12, 16, 24, and 32px increments, adjusted optically when needed. Related controls sit closer together than unrelated groups. Repeated controls on the same tier should share corner radius and height.

Touch controls should be comfortably tappable on coarse pointers; where a visually compact icon is necessary, preserve adequate hit area through padding/container sizing. Do not solve a crowded phone header by shrinking every target until meaning and usability degrade.

## 5. Responsive methodology

Before a learner-facing release, inspect at roughly 320, 375, 390, and 430 CSS px plus normal and constrained desktop dialog widths. Also test at least one enlarged app font setting. At each width verify:

- no horizontal overflow, including Settings toggle/action cards;
- global utilities remain one coherent group and their glyphs remain centered;
- the primary mode selector is balanced and its active/inactive states are clear;
- Filter / question picker / category remain deliberately grouped;
- long labels truncate or wrap in the intended place;
- no control is stranded on a row by itself;
- selected/unselected/disabled states remain understandable;
- test unanswered/answered/follow-up states can be scanned quickly in native and custom pickers;
- question submission auto-advance does not cause a progress flash/jump;
- the three-hour countdown changes smoothly and does not visibly fight another renderer;
- test Questions/Essays section switching and exact essay/pairing jumping remain usable;
- submitted test pairings are legible and whole-row editable without implying correctness;
- pairing Previous/Next controls fit without horizontal scrolling;
- the question and essay progress bars remain visually distinct and aligned;
- post-test question and essay review remains usable at narrow widths;
- test-history rows reflow cleanly;
- safe-area insets and bottom floating controls remain usable;
- dialogs have one intentional scroll surface.

Passing CSS syntax or avoiding overflow is not a visual audit. Check optical centering, icon meaning, spacing rhythm, hierarchy, touch hit areas, and whether a first-time user can predict what a control will do.

## 6. State and predictability

Remember state only when remembering it helps the same semantic destination. Examples: remembering the last audio transcript position is useful; remembering a Settings panel and then opening it from the Materials button is not. A user's prior navigation should never silently change the meaning of a top-level control.

When two controls lead into shared internals, their entry contracts remain independent but their initialization must be equivalent. Test each path as the **first** path used after a cold load, not merely after another path has already populated the shared UI.

Test question flags, essay flags, pairing flags, pairing selections, current section, and current essay/pairing position belong to the active attempt. Finalized test review data may persist with the bounded local test history so historical review remains possible. During the active attempt, stored grading data may exist internally, but the UI contract still forbids revealing correctness until final submission.

Question-answer analytics remain part of the normal answer submission path. Test UI orchestration must preserve that canonical path so test answers continue to be emitted as `mode: test` when anonymous analytics is enabled.

## 7. Review before release

A UI change is complete only after a design pass over the affected surface and its neighboring controls. Ask:

- Did we reuse an established component/icon where one already existed?
- Does every icon have one obvious meaning at phone size?
- Do top-level buttons always open deterministic destinations?
- Do all entry points into a shared dialog show correct dynamic state on their first open after a cold load?
- Are repeated controls geometrically and visually consistent?
- Does the session timer use the intended mode-specific interaction?
- Does the layout still look intentional at narrow iPhone widths, constrained desktop dialogs, and large text?
- If Test changed, is there zero correctness leakage before final submission?
- Does Submit/Enter advance cleanly without a progress-bar flash?
- Can a learner identify every unfinished question at a glance?
- Can the learner freely move Questions↔Essays, skip/revisit/edit pairings, use the documented keyboard controls, and flag questions/essays/pairings?
- Can a completed test be reviewed item-by-item immediately and later from Stats/Test history?
- Do old tests degrade to an honest summary-only view when detail was never stored?
- Did this change create a new visual dialect that should instead be folded into the shared component system?

Prefer fewer, stronger patterns over more custom styling.
