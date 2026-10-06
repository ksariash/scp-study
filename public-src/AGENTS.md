# SCP Study client UI guidance

These rules supplement the repository-root `AGENTS.md` and apply to every file under `public-src/`. Read `docs/DESIGN-SYSTEM.md` before changing learner-facing UI. Treat it as a product contract, not optional visual advice.

## Design-system discipline

Build the interface from a small set of reusable primitives instead of solving each screen independently. Before adding a control, icon, spacing pattern, card style, navigation pattern, or interaction, search the existing app for the same semantic job and reuse that implementation or visual language where practical. A new one-off treatment needs a concrete reason.

One icon has one meaning across the product, and one meaning should not accumulate several unrelated icons. Reuse the same book language for course materials and notes, the same play/transcript language for audio, the same funnel language for filtering, the same bell for notifications, and a consistent progress/settings vocabulary. Match stroke weight, optical size, corner treatment, and control chrome. If an icon is not immediately conventional at phone size, use an icon plus a short label or use text instead of inventing an ambiguous glyph.

Top-level destinations must be deterministic. A Materials entry must open course material, not Settings because Settings happened to be the last selected internal panel. Settings is a distinct top-level destination even if it reuses the same dialog implementation. Never let persisted tab state cross semantic destination boundaries.

Primary modes are one segmented control, not three unrelated text links. `Questions`, `Essays`, and `Test` must share equal geometry, visible inactive affordance, optical centering, and a clearly selected segment. Contextual controls must stay grouped with the context they modify; do not allow a filter, count, or action to wrap onto an orphan row by itself.

Status and action should not be visually fused unless the component is intentionally designed that way. The session timer is status; reset is an adjacent action. Similar status/action pairs elsewhere should use the same principle.

## Responsive quality bar

Design mobile-first and visually audit at representative narrow iPhone widths before release (roughly 320, 375, 390, and 430 CSS px), plus desktop. Check default and enlarged app font sizes, long category/essay labels, active and inactive states, dialogs, touch targets, and safe-area behavior. A layout that merely avoids overflow is not finished: alignment, spacing rhythm, grouping, icon clarity, and optical balance must also look intentional.

Prefer stable groups over opportunistic wrapping. If a row cannot fit, simplify or restructure the group rather than letting one control fall to a lonely second line. Keep repeated controls aligned to the same grid and baseline wherever possible.

Use `ui-system.css` and `ui-system.js` for shared shell-level component normalization that must run before `app.js`. Keep product behavior in `app.js`; do not duplicate business logic in the UI layer. When touching adjacent legacy styling, consolidate toward the shared component system rather than adding another competing visual dialect.

## Release check

For every UI release, inspect the final generated app rather than source alone. Verify icon semantics, deterministic destinations, selected/unselected affordances, narrow-phone grouping, large-text reflow, and that no remembered state changes what a top-level button means. Then run the normal build/syntax checks and Cloudflare deployment verification from the root guide.
