# Phase 1 — Lock Ensemble Regression Coverage

## Objective
Capture the reported same-performer ensemble-versus-solo case in tests so the
current bad merge behavior is explicit before the merge guard changes.

## Code areas impacted
- `src/test/db/lookupByCode-multi-class.test.ts`
- `src/lib/server/db.ts` for understanding current merge behavior only; no
  implementation change is planned in this phase

## Work items
- [x] Add a focused fixture with one `*EP` ensemble class and one solo class in
      the same concert series for the same performer.
- [x] Assert that the two performances keep distinct `performance_pieces`
      associations.
- [x] Assert that the relevant `adjudicated_pieces.is_merged` rows remain
      unmerged for both performances.
- [x] Keep the regression coverage adjacent to the existing same-series
      multi-class tests.

## Deliverables
- A regression test in `src/test/db/lookupByCode-multi-class.test.ts` covering
  the reported ensemble-versus-solo scenario.
- Explicit expected assertions for separate lookup/performance state and
  separate piece mappings.
- Evidence: `set -a; source /Users/eric/side-projects/concertprogram/.env; set +a; npm run test -- src/test/db/lookupByCode-multi-class.test.ts` passed.

## Gate (must pass before proceeding)
Define objective pass/fail criteria.
- [x] The new regression test expresses the intended no-merge behavior and
      fails meaningfully before the implementation fix.

## Verification steps
List exact commands and expected results.
- [x] Command: `set -a; source /Users/eric/side-projects/concertprogram/.env; set +a; npm run test -- src/test/db/lookupByCode-multi-class.test.ts`
  - Expected: the targeted DB suite exercises the new ensemble regression case.
  - Actual: pass.

## Risks and mitigations
- Risk: the fixture might accidentally avoid the merge path and miss the bug.
- Mitigation: use the same performer, series, and year as the existing
  same-series merge fixture so the regression exercises the actual merge code.
