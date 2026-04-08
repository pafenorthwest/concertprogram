# Phase 1 — Lock Recovery Regression Coverage

## Objective
Capture the malformed-import recovery behavior in tests so the duplicate-row
failure is reproducible and the success path is well-defined before the import
logic changes.

## Code areas impacted
- `src/test/db/import.test.ts`
- `src/lib/server/import.ts` for confirming the exact failure surface only; no
  implementation changes expected in this phase

## Work items
- [x] Review the current import test fixtures and choose a minimal malformed
      payload shape that fails after the `performance` row is created.
- [x] Add or update a DB-level regression test that leaves the matching
      `performance` row behind, retries with corrected input, and expresses the
      expected single-row outcome.
- [x] Verify the test meaningfully exercises the recovery path instead of a
      separate duplicate-prevention path.

## Deliverables
- A targeted regression test in `src/test/db/import.test.ts` covering
  malformed-import recovery and duplicate-row prevention.
- Clear expected assertions for row reuse and corrected selected-piece state.
- Evidence: `npm run test -- src/test/db/import.test.ts` passed after the
  recovery-path test was added.

## Gate (must pass before proceeding)
Define objective pass/fail criteria.
- [x] The new or updated regression test demonstrated the recovery-path gap and
      now captures the intended pass condition for the fix.

## Verification steps
List exact commands and expected results.
- [x] Command: `npm run test -- src/test/db/import.test.ts`
  - Expected: the targeted import DB suite runs and captures the recovery-path
    behavior.

## Risks and mitigations
- Risk: the malformed payload might fail before the `performance` row is
  persisted, making the regression test invalid.
- Mitigation: use the existing import flow order in `Performance.initialize()`
  to pick a failure shape that occurs after `processPerformance()`.
