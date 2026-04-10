# Goals Extract

- Task name: restyle-admin-program-page-comments
- Iteration: v0
- State: locked

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
