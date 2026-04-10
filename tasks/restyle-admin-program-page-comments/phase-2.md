# Phase 2 — Comment Button and Popover Interaction

## Objective
Replace inline comment cells with explicit comment controls and add a
dismissable popover that only opens for rows with comment content.

## Code areas impacted
- `src/routes/admin/program/+page.svelte`

## Work items
- [x] Add page-local state for the selected comment row and popover visibility.
- [x] Replace inline comment rendering with an enabled comment button when a
      comment exists and a visibly disabled button when it does not.
- [x] Implement a dismissable popover that shows the full comment text for the
      selected row and closes cleanly.
- [x] Prevent disabled comment controls from opening the popover.

## Deliverables
- Program table comment buttons with clear enabled/disabled states.
- Dismissable full-comment popover tied to the selected row.

## Gate (must pass before proceeding)
- [x] Comment interactions are explicit, rows without comments cannot open the
      popover, and the full comment is visible when an enabled button is used.

## Verification steps
- [ ] Command: `npm run lint`
  - Expected: passes with the new comment interaction state/markup.
- [ ] Manual check: inspect comment button states and popover behavior.
  - Expected: enabled buttons open the right comment, disabled buttons do
    nothing, and the popover can be dismissed.

## Risks and mitigations
- Risk: Popover state could become stale after filtering or repeated row
  interaction.
- Mitigation: Store the selected comment against the current row data and clear
  it explicitly on dismiss or when the active row no longer has a valid comment.
