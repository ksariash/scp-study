# SCP Study client UI guidance

These rules supplement the repository-root `AGENTS.md` and apply to every file under `public-src/`. Read `docs/DESIGN-SYSTEM.md` before changing learner-facing UI. Treat it as a product contract, not optional visual advice.

## Design-system discipline

Build the interface from a small set of reusable primitives instead of solving each screen independently. Before adding a control, icon, spacing pattern, card style, navigation pattern, or interaction, search the existing app for the same semantic job and reuse that implementation or visual language where practical. A new one-off treatment needs a concrete reason.

One icon has one meaning across the product, and one meaning should not accumulate several unrelated icons. Reuse the same book language for course materials and notes, the same play/transcript language for audio, the same funnel language for filtering, the same bell for notifications, and a consistent progress/settings vocabulary. Match stroke weight, optical size, corner treatment, and control chrome. If an icon is not immediately conventional at phone size, use an icon plus a short label or use text instead of inventing an ambiguous glyph.

Top-level destinations must be deterministic. A Materials entry must open course material, not Settings because Settings happened to be the last selected internal panel. Settings is a distinct top-level destination even if it reuses the same dialog implementation. Never let persisted tab state cross semantic destination boundaries.

Primary modes are one control, not three unrelated links. `Questions`, `Essays`, and `Test` must have equal geometry, visible inactive affordance, optical centering, and an unmistakable selected state. The current segmented-control styling is **not a permanent visual mandate**: if the product owner chooses a reference pattern for a future redesign, match that chosen pattern consistently while preserving the same stable labels, semantics, accessibility, and one-tap mode switching.

Contextual controls must stay grouped with the context they modify; do not allow a filter, count, or action to wrap onto an orphan row by itself. The question context row uses the established compact order **Filter icon → question picker → category**. The funnel is already an established app-wide filtering symbol, so this specific contextual action may remain icon-only with an accessible label/title.

The normal-study session timer is intentionally both status and the reset target. Clicking/tapping the timer asks for confirmation and resets the study-session timer; do not add a separate reset button beside it. In Test and Essay modes the timer is status-only.

Shared dialogs with more than one entry point must have one canonical hydration path. Do not call `showModal()` from a shell shortcut if the normal opener first fills dynamic fields such as version, Zman, account state, or selected content. A cold first open from every entry point must show the same metadata without requiring another path to have been opened previously.

Settings cards must remain intrinsically size-safe. Long toggle labels such as Anonymous usage / Sync across devices must wrap within their own card rather than pushing controls or text outside the panel. Test settings layouts at both desktop dialog widths and narrow iPhone widths; do not assume overflow is only a mobile problem.

## Test-mode contract

The practice test is one three-hour attempt containing the full multiple-choice question bank and every configured essay. The three-hour deadline is shared across both sections. Questions and Essays are freely navigable peer sections: a learner may switch to Essays before answering every multiple-choice question, jump directly to any essay or pairing, return to Questions, and finish later. Do not gate Essays behind completion of all questions.

Test mode is an exam surface. **Never show correctness feedback before final test submission.** Multiple-choice selections may be submitted/locked and internally scored, but while the attempt is active do not show correct/incorrect/partial status, red/green answer styling, explanations, or correct-answer text. Only show neutral state such as Answered / Unanswered. Essay pairings follow the same rule: no correctness styling, hints, model answer, or corrective copy until final submission.

After a multiple-choice answer is submitted, advance to the next question automatically. This applies whether submission comes from tapping/clicking Submit or from the Enter-key shortcut. Navigation itself never marks a question answered. If the current question is the last position in the shuffled order but unanswered questions remain, jump to the next unanswered item rather than ending the test.

Question completion state must be glanceable. The selector must distinguish **Not answered**, **Answered**, and **Follow-up** using symbols/shape/text in addition to color. An unanswered option should be visually stronger than subtle gray text; the learner should be able to scan the picker for unfinished work quickly. Follow-up is an attempt-local review marker, not a content-report action.

Progress communicates **completion**, not position. The Questions progress bar is based on submitted/answered questions divided by total questions. A separate, visually distinct Essay progress bar immediately beneath it is based on fully completed essays divided by total essays. Do not write an index-based width and then correct it after render; one state owner must drive each progress bar so Next/Previous cannot cause a visible jump.

The visible test countdown must have one visual writer. If core timing keeps a small internal grace window to protect against races, do not let that internal deadline compete with the exact three-hour display. The countdown should change cleanly once per displayed second and finish the test at the visible zero.

## Test essays

Test essays reuse the normal Essay pairing mental model and canonical fact data, not a free-form editor. A learner works one pairing at a time, may skip it, navigate backward/forward, jump directly through the picker, and return later. Submitted pairings remain editable throughout the attempt.

Choice buttons are whole-row touch/click targets. Child spans, badges, or text must never create dead hit zones. Likewise, a submitted buildout row is one reliable Edit target; tapping anywhere on the row reopens that exact pairing.

The test essay picker represents the hierarchy explicitly. It shows each essay and each pairing, including completion and follow-up markers, and selecting an entry jumps to that exact essay/pairing. Essay-level and pairing-level follow-up markers are independent and persist with the test result for later review.

Keyboard behavior must be discoverable and section-local. In active test essays:
- `Left` / `Right` navigate pairings.
- `Shift+Left` / `Shift+Right` navigate essays.
- number keys select the visible pairing option using the same mental model as question number shortcuts.
- `Enter` submits the selected pairing.
- the footer explains these controls unobtrusively.
- shortcuts do not steal keystrokes from text fields, selects, dialogs, or other focused interactive controls.

Capture/stop keyboard events where necessary so one essay keystroke cannot fall through to the multiple-choice navigation handler.

## Finish, review, and history

`Exit test` is always a functional escape hatch while questions remain unanswered: after confirmation it saves the attempt as incomplete and leaves test mode. Once every multiple-choice question has been submitted, that same control becomes **Finish test**. Finishing submits the entire attempt and must warn if essays/pairings remain incomplete. Never make “answer every question” the only route out of a test.

After submission, review is a **navigable test-like surface**, not only a static score dump. Multiple-choice review is in canonical numerical question order regardless of the test's shuffled presentation order. Each item shows the learner's answer, the correct answer, correctness, explanation, timing/result metadata when useful, and the saved follow-up marker.

Essay review mirrors the pairing workflow: navigate essay pairings in stable essay/pairing order, show the learner's submitted pairing alongside the correct pairing, retain essay/pairing follow-up markers, show the complete submitted buildout, and allow the model answer only because the test is already final. Do not make learners expand dozens of unrelated static result cards to review one item at a time.

Save sufficient device-local detail for the newest test format to reopen item-by-item review later. Keep the existing bounded-history policy (currently 30 tests). Older legacy test summaries that lack per-item data may show a summary-only fallback; never fabricate detailed answers that were not stored.

Previous-test review belongs primarily in **Progress & stats**, with a secondary `Review previous tests` entry in the Start Test dialog when history exists. Both entry points open the same history/review implementation and must work on a cold first use.

## Active implementation ownership

`test-mode-v2.js` is the active owner of combined-test orchestration, supplemental persistence, feedback suppression, essay pairing state, follow-up state, test navigation, exact visible countdown, finish behavior, detailed result persistence, and historical review. `test-mode-v2.css` layers the corresponding exam/review presentation on top of the shared legacy test primitives in `test-mode.css`.

The older `test-mode.js` is retired compatibility source and must **not** be loaded alongside `test-mode-v2.js`; two controllers would double-bind navigation and lifecycle events. When the v2 implementation is stable enough to consolidate, prefer folding/removing legacy files rather than creating a v3/v4 chain of overlays.

`ui-system.js` owns shared shell/design normalization. Do not move test business behavior into the visual component layer, and do not duplicate combined-test state rules in unrelated files. When extending the native test start flow, augment the state created by `app.js` instead of creating a competing second test initializer before the core handler runs.

Question-answer anonymous analytics remain owned by the core `app.js` answer submission path. An active test must continue emitting answer events with `mode: 'test'` when anonymous analytics is enabled. Test-mode UI work must not bypass that path merely to implement auto-advance or custom review.

## Responsive quality bar

Design mobile-first and visually audit at representative narrow iPhone widths before release (roughly 320, 375, 390, and 430 CSS px), plus desktop. Check default and enlarged app font sizes, long category/essay labels, active and inactive states, dialogs, touch targets, and safe-area behavior. A layout that merely avoids overflow is not finished: alignment, spacing rhythm, grouping, icon clarity, and optical balance must also look intentional.

Prefer stable groups over opportunistic wrapping. If a row cannot fit, simplify or restructure the group rather than letting one control fall to a lonely second line. Keep repeated controls aligned to the same grid and baseline wherever possible. Generic rules such as “all action buttons are width:100%” must not be allowed to break a horizontal row; either override the child rule or intentionally reflow the whole component to one column.

## Release check

For every UI release, inspect the final generated app rather than source alone. Verify icon semantics, deterministic destinations, selected/unselected affordances, narrow-phone grouping, large-text reflow, and that no remembered state changes what a top-level button means. For every shared modal, test a cold first open from each entry point and verify dynamic metadata is already correct. For Settings, explicitly inspect the About row and privacy/sync controls at narrow phone and desktop dialog widths.

For Test changes, explicitly verify all of the following in the final generated app: native Start Test; exact three-hour visible countdown; no pre-submit M/C or essay correctness leakage; auto-advance after both button and Enter submission; unmistakable unanswered selector state; question/essay/pairing follow-up; completion-based progress without transient index jumps; reliable Exit→Finish behavior; free Questions↔Essays navigation; direct essay and pairing jumping; whole-row essay choice hit targets; reliable Edit hit targets; skip/previous/next pairing navigation; number-key pairing selection and Enter submission; keyboard footer; Settings/Notifications availability; timeout; final numerical question review; final pairing-by-pairing essay review; old-test access from Stats and Start Test; and summary-only fallback for legacy tests. Then run the normal build/syntax checks and Cloudflare production deployment verification from the root guide.
