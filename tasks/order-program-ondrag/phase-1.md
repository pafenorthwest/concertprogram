# Phase 1 — Lock Reorder Persistence Regression Coverage

## Objective
Define the current reorder-save contract in automated tests so the missing
`POST /api/program` behavior is reproducible and the intended persisted ordering
is explicit before the route changes.

## Code areas impacted
- `src/test/api/program-api.test.ts`
- `src/routes/api/program/+server.ts` for confirming the exact failure surface
  only; no route behavior change should land until the test contract is clear

## Work items
- [x] Review the existing program API tests and identify the smallest fixture
      setup that can exercise drag-order persistence.
- [x] Add or update API coverage that posts the admin page reorder payload shape
      to `/api/program`.
- [x] Ensure the regression test asserts persisted `performance_order` results
      rather than only the response status.

## Deliverables
- A targeted API regression test in `src/test/api/program-api.test.ts`
  covering `POST /api/program` reorder
  persistence.
- Clear expected assertions for response status and saved row ordering.
- Evidence: `npm run test -- src/test/api/program-api.test.ts` PASS after adding
  reorder persistence coverage.

## Gate (must pass before proceeding)
Define objective pass/fail criteria.
- [x] The program API test suite contains a meaningful reorder-persistence case
      that would have failed against the missing collection `POST` handler.

## Verification steps
List exact commands and expected results.
- [x] Command: `npm run test -- src/test/api/program-api.test.ts`
  - Expected: the targeted program API suite runs and exercises the reorder
    persistence path. Observed: PASS.

## Risks and mitigations
- Risk: the chosen fixture may not end up in a stable concert placement, making
  the persisted order assertion noisy.
- Mitigation: use a minimal imported Eastside test fixture and assert directly
  against the saved `performance_order` state for the known performance ids.
