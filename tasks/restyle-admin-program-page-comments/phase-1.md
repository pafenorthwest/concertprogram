# Phase 1 — Program Page Restyle and Table Cleanup

## Objective
Apply the review-page-inspired visual treatment to the admin program page and
remove the `Num in Series` column while preserving the existing reorder/export
workflow.

## Code areas impacted
- `src/routes/admin/program/+page.svelte`

## Work items
- [x] Restyle the top control bar, table wrapper, buttons, and text treatment to
      align with the admin review page visual language.
- [x] Remove the `Num in Series` header and body cells from the program table.
- [x] Keep the existing drag-and-drop markup hooks and row identity attributes
      intact so reorder persistence still works.

## Deliverables
- Updated admin program page container and control styling.
- Program table markup without the `Num in Series` column.

## Gate (must pass before proceeding)
- [x] The program page visually reflects the intended restyle and the table
      still exposes the controls needed for reorder/export workflows.

## Verification steps
- [ ] Command: `npm run lint`
  - Expected: passes after the UI markup/style changes.
- [ ] Manual check: inspect the admin program page UI in code review terms.
  - Expected: rounded surfaces/button treatment are present and `Num in Series`
    is removed with no obvious drag-and-drop markup regression.

## Risks and mitigations
- Risk: Table markup changes could break the DOM hooks used during drag and
  drop.
- Mitigation: Keep `id`, `data-id`, `sortable-row`, and related row/cell hooks
  stable while changing only the presentation and removed column.
