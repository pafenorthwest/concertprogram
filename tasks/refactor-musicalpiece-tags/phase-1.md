# Phase 1 — Tag Parsing + Admin Data Shaping

## Objective
Prepare shared tag parsing/validation utilities and load tag data for the admin
UI without changing API behavior yet.

## Code areas impacted
- `src/lib/server/review.ts`
- `src/routes/admin/musicalpiece/+page.server.ts`

## Work items
- [ ] Add helper(s) to parse/deduplicate tag arrays and validate against enum
  lists.
- [ ] Add data loading for division/category tags in the admin loader and shape
  single-select defaults.
- [ ] Document how multi-tag data is represented in the UI model (first sorted
  tag).

## Deliverables
- Tag parsing/validation helper(s) ready for API use.
- Admin loader returns tag fields usable by the UI dropdowns.

## Gate (must pass before proceeding)
- [ ] Helpers return only valid, deduped tags and capture invalid tag values.
- [ ] Admin loader returns a stable single-tag value for each piece (or null)
  without errors.

## Verification steps
- [ ] Command: `npm run lint`
  - Expected: no lint errors.

## Risks and mitigations
- Risk: Loader queries impact performance for large datasets.
- Mitigation: Use aggregated queries and avoid per-row queries where possible.
