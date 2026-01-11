# Phase 3 — Admin UI Tag Controls

## Objective
Expose single-select category/division controls in the admin UI with clear
messaging about API-only multi-tag support.

## Code areas impacted
- `src/routes/admin/musicalpiece/+page.svelte`
- `src/routes/admin/musicalpiece/+page.server.ts`
- `src/lib/constants/review.ts`

## Work items
- [ ] Add dropdowns for Category and Division tags in the add/edit UI.
- [ ] Include a UI note about API-only multi-tag updates and overwrite behavior.
- [ ] Ensure save payload includes single tag values as arrays for API
  consistency.
- [ ] Ensure add form includes tag fields (single-select) to create tags at
  insert time.

## Deliverables
- Admin UI supports single-select tag updates and displays guidance note.

## Gate (must pass before proceeding)
- [ ] Tag dropdowns render and save without breaking existing fields.
- [ ] UI note about multi-tag API-only behavior is visible.

## Verification steps
- [ ] Command: `npm run lint`
  - Expected: no lint errors.

## Risks and mitigations
- Risk: UI overwrites multi-tag data without warning.
- Mitigation: Prominent UI note and default to first tag only.
