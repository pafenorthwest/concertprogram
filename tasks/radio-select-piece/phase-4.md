# Phase 4 — Selection Persistence Alignment

## Objective
Adjust the existing performance-piece selection persistence path only as much as
needed so a choice made from the merged schedule context resolves to the stored
selected piece correctly.

## Code areas impacted
- `src/routes/api/performance/pieces/select/+server.ts`
- `src/routes/api/performance/pieces/clear/+server.ts`
- `src/lib/server/db.ts`
- `src/routes/schedule/+page.svelte`

## Work items
- [x] Confirm whether the current selection endpoints can accept the merged
      context inputs as-is.
- [x] If needed, make the minimal helper/endpoint changes required for the
      merged context to persist one selected piece.
- [x] Keep the change localized and avoid broad API redesign.

## Deliverables
- A working persistence path from schedule-page radio selection to stored
  selection state.
- Clear evidence that no broader API contract change was introduced.

## Gate (must pass before proceeding)
Define objective pass/fail criteria.
- [x] A piece selected from the schedule page is persisted and shown again on
      reload.
- [x] The persistence path remains within the locked schedule scope.

## Verification steps
List exact commands and expected results.
- [ ] Command: `npm run test -- schedule-page`
  - Expected: selection persists across reload for the merged context.
- Evidence:
  - The select/clear schedule endpoints no longer reject the schedule page when
    the old self-service feature flag is off.
  - No broader add/remove association APIs were changed.

## Risks and mitigations
- Risk:
  - Supporting the merged context may tempt a wider API redesign than the goals
    require.
- Mitigation:
  - Limit changes to compatibility glue around the current selection path and
    stop if a larger contract change becomes necessary.
