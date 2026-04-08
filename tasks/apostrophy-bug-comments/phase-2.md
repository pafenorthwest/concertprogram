# Phase 2 — Fix the Localized Comment Persistence Path

## Objective
Implement the smallest safe change that prevents apostrophes from breaking the
verified schedule comment submission path, and keep persisted comment semantics
correct.

## Code areas impacted
- `src/lib/server/db.ts`
- `src/routes/schedule/+page.server.ts` only if required for a localized fix
- `src/test/db/lookupByCode-multi-class.test.ts`

## Work items
- [x] Apply the localized escaping/sanitization change only to the verified
      schedule comment persistence path.
- [x] Extend the targeted schedule regression coverage to assert successful
      apostrophe submission and persisted comment behavior.
- [x] Preserve the existing plain-text comment workflow and avoid unrelated
      schedule behavior changes.

## Deliverables
- A bounded implementation change that prevents the verified apostrophe failure
  by parameterizing `updateConcertPerformance` in `src/lib/server/db.ts`.
- Automated coverage for the apostrophe comment case and persisted value checks
  in `src/test/db/lookupByCode-multi-class.test.ts`.

## Gate (must pass before proceeding)
Phase 2 passes only if the reproduced failure is fixed without widening scope.
- [x] Apostrophe-containing schedule comments succeed through the affected path.
- [x] Existing plain-text comment handling still behaves as expected.
- [x] The change remains within the locked file surface or a documented
      directly affected subset.

## Verification steps
- [x] Command: `npm run test -- src/test/db/lookupByCode-multi-class.test.ts -t "accepts apostrophes in schedule comments during submission"`
  - Expected: apostrophe regression coverage passes.
- [x] Command: `npm run test -- src/test/db/lookupByCode-multi-class.test.ts`
  - Expected: apostrophe regression coverage and existing same-series schedule
    submission coverage pass together.

## Risks and mitigations
- Risk: escaping at the wrong layer could store altered text or hide a broader
  SQL issue.
- Mitigation: verify the persisted comment value directly in the regression
  coverage and keep the change localized to the proven path.
