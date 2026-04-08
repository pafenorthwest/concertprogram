# Phase 2 — Implement Ensemble Merge Guard

## Objective
Update the same-series merge logic so ensemble class families with a three-letter
first segment ending in `EP` do not merge with solo or concerto classes, while
preserving existing non-ensemble merge behavior.

## Code areas impacted
- `src/lib/server/db.ts`
- `src/lib/server/common.ts` only if a tiny shared class-family helper improves
  clarity without expanding scope

## Work items
- [x] Add a narrow merge-eligibility rule based on the first dot-delimited
      class-code segment.
- [x] Apply the rule where `mergePerformancePiecesForPerformerSeries()` selects
      merge groups so cross-family `*EP` ensemble/non-ensemble combinations stay
      separate.
- [x] Preserve existing behavior for non-ensemble same-series merges already
      covered by current tests.
- [x] Keep the change localized and avoid schema, API, or import-flow rewrites.

## Deliverables
- Merge logic that no longer collapses the reported ensemble and solo records
  into one primary performance.
- Separate `performance_pieces` and `adjudicated_pieces` state for the
  protected scenario.
- Lookup grouping now also respects the protected ensemble/non-ensemble split so
  the schedule lookup path no longer collapses the records after the data merge
  guard runs.
- Evidence: `set -a; source /Users/eric/side-projects/concertprogram/.env; set +a; npm run test -- src/test/db/lookupByCode-multi-class.test.ts` passed.

## Gate (must pass before proceeding)
Define objective pass/fail criteria.
- [x] The new ensemble regression passes.
- [x] Existing same-series non-ensemble merge coverage still passes.

## Verification steps
List exact commands and expected results.
- [x] Command: `set -a; source /Users/eric/side-projects/concertprogram/.env; set +a; npm run test -- src/test/db/lookupByCode-multi-class.test.ts`
  - Expected: the targeted DB suite passes, including the new ensemble
    regression and the existing non-ensemble merge tests.
  - Actual: pass.

## Risks and mitigations
- Risk: filtering too broadly could disable legitimate same-series merges for
  other class families.
- Mitigation: derive the guard strictly from the three-letter `*EP` class-code
  prefix and verify the existing non-ensemble merge tests still pass.
