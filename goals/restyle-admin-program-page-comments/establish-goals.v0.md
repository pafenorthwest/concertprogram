# establish-goals

## Status

- Iteration: v0
- State: locked
- Task name (proposed, kebab-case): restyle-admin-program-page-comments

## Request restatement

- Restyle the admin program page so its controls, table container, buttons, and text presentation align with the established visual language on the admin review page.
- Remove the `Num in Series` column from the program table without breaking the remaining table layout or the drag-and-drop ordering flow.
- Replace inline comment text cells with a clearly interactive comment button, show a disabled button when a row has no comment, and open a dismissable popover with the full comment text only for rows that actually have comments.

## Context considered

- Repo/rules/skills consulted: `AGENTS.md`, `/.codex/codex-config.yaml`, `/.codex/project-structure.md`, `establish-goals`, `prepare-takeoff`, `prepare-phased-impl`, and `implement` skill instructions.
- Relevant files (if any): `src/routes/admin/program/+page.svelte`, `src/routes/admin/review/+page.svelte`.
- Constraints (sandbox, commands, policy): Must follow the repo lifecycle stage order; no source edits before goals lock; keep scope limited to the admin program page and minimum supporting task artifacts; verification target is `npm run lint`, `npm run build`, and `npm run test` unless blocked.

## Ambiguities

### Blocking (must resolve)

1. None.

### Non-blocking (can proceed with explicit assumptions)

1. "Align with the visual language" means reusing or closely matching the review page's rounded surfaces, control styling, and text treatment without requiring the program page to duplicate the review page's layout or interaction model.
2. The comment popover can be implemented as page-local client state on `src/routes/admin/program/+page.svelte`; no server or API changes are required as long as existing comment data is already available in `data.program`.
3. A disabled comment button should remain visible for consistency but must not open the popover or imply interactivity when the row has no comment.

## Questions for user

1. None.

## Assumptions (explicit; remove when confirmed)

1. It is acceptable to keep all work inside the admin program page component unless a minimal supporting test or artifact update is needed for verification.
2. It is acceptable for the comment popover to show one selected row's full comment at a time and close via an explicit dismiss action or equivalent clear UI affordance.

## Goals (1-20, verifiable)

1. Restyle the admin program page controls and table container so they match the admin review page's visual language for buttons, rounded surfaces, and comparable text treatment.
2. Remove the `Num in Series` table header and body cells from the admin program page without breaking table rendering, filtering, or drag-and-drop ordering behavior.
3. Replace inline comment text rendering in the program table with a distinct comment button for rows that have a comment.
4. Show a visibly disabled comment button for rows without a comment and prevent disabled comment buttons from opening a popover.
5. Add a dismissable popover on the admin program page that shows the full comment text for the selected row when an enabled comment button is activated.
6. Keep implementation scope limited to the admin program page and only the minimum supporting verification and task artifacts needed to complete the lifecycle honestly.

## Non-goals (explicit exclusions)

- Reworking ordering, filtering, export, or force-move behavior beyond styling adjustments needed to match the updated UI treatment.
- Changing backend APIs, database shape, or the comment data model.

## Success criteria (objective checks)

> Tie each criterion to a goal number when possible.

- [G1] The admin program page uses review-page-style rounded containers, control/button styling, and comparable text treatment for the affected controls and table surface.
- [G2] The `Num in Series` header and its row cells are no longer rendered, and the remaining table content still renders in the expected order flow.
- [G3] Rows with comments render an obviously interactive comment button instead of inline comment text.
- [G4] Rows without comments render a visibly disabled comment button, and activating that disabled control does not open the popover.
- [G5] Activating an enabled comment button opens a dismissable popover that shows the full comment text for that row.
- [G6] Verification records outcomes for `npm run lint`, `npm run build`, and `npm run test`, or documents an explicit blocker if any command cannot pass.

## Risks / tradeoffs

- Matching the review page too literally could pull in unnecessary layout changes, so the implementation needs to borrow the visual treatment while keeping the program page's existing workflow intact.

## Next action

- Handoff: `prepare-takeoff` owns task scaffolding, verification command pinning, and scope recording for execution.
