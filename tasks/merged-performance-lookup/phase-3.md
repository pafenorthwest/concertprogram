# Phase 3 — Schedule UI + Integration

## Objective
Wire unified lookup data into schedule load and display the class list + primary code.

## Code areas impacted
- `src/lib/server/performerLookup.ts`
- `src/routes/schedule/+page.server.ts`
- `src/routes/schedule/+page.svelte`
- `src/test/db/lookupByCode-multi-class.test.ts`

## Work items
- [ ] Pass through primary class code and class display in lookup mappings.
- [ ] Update schedule load payload to include new fields.
- [ ] Render class list and primary class code on the schedule page.
- [ ] Update tests to assert new UI-facing fields.

## Deliverables
- Schedule page displays merged class info for multi-win performers.
- Tests updated for unified lookup payloads.

## Gate (must pass before proceeding)
- [ ] Schedule UI renders primary class code and class list without regressions.

## Verification steps
- [ ] Command: `npm run test`
  - Expected: tests pass or failures are documented as blockers.

## Risks and mitigations
- Risk: UI still shows the entered lookup code instead of the primary.
- Mitigation: Use primary class code field for display and add test coverage.
