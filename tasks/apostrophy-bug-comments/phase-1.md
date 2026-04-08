# Phase 1 — Reproduce the Apostrophe Failure

## Objective
Exercise the existing schedule submission path with an apostrophe-containing
comment, confirm whether it fails server-side, and identify the smallest
affected implementation surface.

## Code areas impacted
- `src/test/db/lookupByCode-multi-class.test.ts`
- `src/routes/schedule/+page.server.ts`
- `src/lib/server/db.ts`

## Work items
- [x] Inspect the current schedule submission flow and identify where the
      comment string reaches persistence.
- [x] Add or adapt targeted test coverage to reproduce the apostrophe comment
      case against the current implementation.
- [x] Record whether the failure reproduces and which layer actually fails.

## Deliverables
- Reproduction evidence for the apostrophe comment path: `npm run test --
  src/test/db/lookupByCode-multi-class.test.ts -t "accepts apostrophes in
  schedule comments during submission"` failed before the fix with PostgreSQL
  `syntax error at or near "m"`.
- Confirmed implementation surface for a localized fix:
  `src/lib/server/db.ts:updateConcertPerformance`.

## Gate (must pass before proceeding)
Phase 1 passes only if the task has concrete reproduction evidence or explicit
proof that the reported failure is not present in the current code.
- [x] The apostrophe comment case has been exercised against the current
      schedule submission flow.
- [x] The failing or non-failing surface is identified without expanding scope.

## Verification steps
- [x] Command: `npm run test -- src/test/db/lookupByCode-multi-class.test.ts -t "accepts apostrophes in schedule comments during submission"`
  - Expected: current behavior is observed for the apostrophe case, including a
    failing reproduction if the bug is present.

## Risks and mitigations
- Risk: the end-to-end test surface could make the failure harder to isolate.
- Mitigation: use the reproduction result to narrow the fix to the smallest
  proven server-side path before changing code.
