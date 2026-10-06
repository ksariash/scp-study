# SCP Study client UI guidance

These rules supplement the repository-root `AGENTS.md` and apply to every file under `public-src/`. Read `docs/DESIGN-SYSTEM.md` before changing learner-facing UI. Treat it as a product contract, not optional visual advice.

## Design-system discipline

Build the interface from a small set of reusable primitives instead of solving each screen independently. Before adding a control, icon, spacing pattern, card style, navigation pattern, or interaction, search the existing app for the same semantic job and reuse that implementation or visual language where practical. A new one-off treatment needs a concrete reason.

One icon has one meaning across the product, and one meaning should not accumulate several unrelated icons. Reuse the same book language for course materials and notes, the same play/transcript language for audio, the same funnel language for filtering, the same bell for notifications, and a consistent progress/settings vocabulary. Match stroke weight, optical size, corner treatment, and control chrome. If an icon is not immediately conventional at phone size, use an icon plus a short label or use text instead of inventing an ambiguous glyph.

Top-level destinations must be deterministic. A Materials entry must open course material, not Settings because Settings happened to be the last selected internal panel. Settings is a distinct top-level destination even if it reuses the same dialog implementation. Never let persisted tab state cross semantic destination boundaries.

Primary modes are one segmented control, not three unrelated text links. `Questions`, `Essays`, and `Test` must share equal geometry, visible inactive affordance, optical centering, and a clearly selected segment. Contextual controls must stay grouped with the context they modify; do not allow a filter, count, or action to wrap onto an orphan row by itself.

The question context row uses the established compact order **Filter icon → question picker → category**. The funnel is already an established app-wide filtering symbol, so this specific contextual action may remain icon-only with an accessible label/title. Do not add a second visible “Filter” label merely to make the control wider.

The normal-study session timer is intentionally both status and the reset target. Clicking/tapping the timer asks for confirmation and resets the study-session timer; do not add a separate reset button beside it. In Test and Essay modes the timer is status-only.

Shared dialogs with more than one entry point must have one canonical hydration path. Do not call `showModal()` from a shell shortcut if the normal opener first fills dynamic fields such as version, Zman, account state, or selected content. A cold first open from every entry point must show the same metadata without requiring another path to have been opened previously.

## Test-mode contract

The practice test is one three-hour attempt containing the full multiple-choice question bank and every configured essay prompt. The three-hour deadline is shared across both sections. Multiple-choice scoring remains automatic; essay responses are saved for self-review and are not automatically graded.

Questions and Essays are freely navigable sections of the same active attempt. A learner may switch to Essays before answering every multiple-choice question, jump directly to any essay, return to Questions, and finish later. Do not make the Questions→Essays transition conditional on all questions being answered. If an attempt is finished with unanswered work, confirm that explicitly.

During an active test, keep Materials, Progress/Stats, category filtering, search, and study-aid resources out of the way. **Settings and Notifications remain available**. Do not hide Settings merely because other study utilities are hidden.

Multiple-choice questions can be marked for follow-up. Follow-up is an attempt-local review flag, not a content-report action; use a different glyph from the app's issue-report control. In the test question selector, preserve immediately legible states for answered, unanswered, and follow-up-marked questions in both the custom desktop menu and the native mobile select. Status must not rely on color alone.

The essay test section is an exam surface, not Essay practice. Show the prompt and a plain response field without model answers or study aids during the timed attempt. Model answers may appear only after the attempt for self-review. Keep raw essay-response text device-local; synced test summaries may include completion counts but should not silently upload free-form essay text.

`test-mode.js` owns this combined-test orchestration and test-only persistence/UI. `ui-system.js` owns shared shell/design normalization. Do not move test business behavior into the visual component layer, and do not duplicate combined-test state rules in unrelated files. When extending the native test start flow, augment the state created by `app.js` instead of creating a competing second test initializer before the core handler runs.

## Responsive quality bar

Design mobile-first and visually audit at representative narrow iPhone widths before release (roughly 320, 375, 390, and 430 CSS px), plus desktop. Check default and enlarged app font sizes, long category/essay labels, active and inactive states, dialogs, touch targets, and safe-area behavior. A layout that merely avoids overflow is not finished: alignment, spacing rhythm, grouping, icon clarity, and optical balance must also look intentional.

Prefer stable groups over opportunistic wrapping. If a row cannot fit, simplify or restructure the group rather than letting one control fall to a lonely second line. Keep repeated controls aligned to the same grid and baseline wherever possible. Generic mobile rules such as “all action buttons are width:100%” must not be allowed to break a horizontal row; either override the child rule or intentionally reflow the whole component to one column.

Use `ui-system.css` and `ui-system.js` for shared shell-level visual normalization that must run before `app.js`. Use `test-mode.css` and `test-mode.js` only for the combined practice-test contract described above. Keep other product behavior in `app.js`; do not turn either shared layer into a general dumping ground. When touching adjacent legacy styling, consolidate toward the shared component system rather than adding another competing visual dialect.

## Release check

For every UI release, inspect the final generated app rather than source alone. Verify icon semantics, deterministic destinations, selected/unselected affordances, narrow-phone grouping, large-text reflow, and that no remembered state changes what a top-level button means. For every shared modal, test a cold first open from each entry point and verify dynamic metadata is already correct. For Settings, explicitly inspect the About row at narrow phone widths with enlarged text. For Test changes, also verify the three-hour deadline, native Start Test flow, question status/flags, free Questions↔Essays navigation, direct essay jumping, essay draft persistence, Settings availability, timeout/exit behavior, and post-test self-review. Then run the normal build/syntax checks and Cloudflare deployment verification from the root guide.
