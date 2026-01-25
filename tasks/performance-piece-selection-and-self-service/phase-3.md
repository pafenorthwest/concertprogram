# Phase 3 — Schedule and Program Integration

## Objective
Wire selection state into schedule load/action/UI and program output, and add/update tests.

## Code areas impacted
- `src/routes/schedule/+page.server.ts`
- `src/routes/schedule/+page.svelte`
- `src/lib/server/db.ts`
- `src/lib/server/program.ts`
- `src/test/**`

## Work items
- [ ] Update lookup/query functions to use selected performance piece.
- [ ] Add schedule load backfill + auto-selection.
- [ ] Enforce schedule submission gating when self-service is enabled.
- [ ] Render selection UI and warning state in `/schedule`.
- [ ] Update/add tests for backfill, auto-selection, and gating.

## Deliverables
- Schedule UI + server changes for selection flow
- Program output uses only selected piece
- Updated tests

## Gate (must pass before proceeding)
- [ ] Tests complete successfully with updated selection behavior.

## Verification steps
- [ ] Command: `npm run test`
  - Expected: completes with no failures.

## Risks and mitigations
- Risk: Schedule submissions could be blocked unintentionally in staff-managed mode.
- Mitigation: Gate only when `performancePieceSelfService` is true and >1 pieces exist.
