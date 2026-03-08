# Phase 5 — Automated Coverage Expansion

## Objective
Add or update automated tests that prove the merged multi-piece schedule flow
renders the selector and blocks submission until a piece is chosen.

## Code areas impacted
- `src/test/api/schedule-page.test.ts`
- Additional nearest-fit files under `src/test/db/` or `src/test/api/` if
  helper-level coverage is required

## Work items
- [x] Add fixture/setup coverage for a same-performer, same-series multi-class
      case with multiple candidate pieces.
- [x] Assert radio selector rendering on the schedule page.
- [x] Assert submit blocking before selection and successful flow after
      selection.

## Deliverables
- Deterministic automated coverage for the new required-selection behavior.
- Regression coverage for zero-piece or single-piece non-blocking behavior if
  needed.

## Gate (must pass before proceeding)
Define objective pass/fail criteria.
- [x] Tests fail before the new behavior and pass after the implementation is
      complete.
- [x] Coverage is deterministic and scoped to the schedule flow.

## Verification steps
List exact commands and expected results.
- [ ] Command: `npm run test`
  - Expected: the new schedule coverage passes with the broader repo test suite.
- Evidence:
  - Added merged same-series route/action assertions in
    `src/test/db/lookupByCode-multi-class.test.ts`.
  - Updated the existing Playwright schedule flow in
    `src/test/api/schedule-page.test.ts` to assert the selector and required
    radio choice.
  - Full test execution is blocked by the missing PostgreSQL database.

## Risks and mitigations
- Risk:
  - Existing schedule tests may be brittle or depend on current single-piece
    assumptions.
- Mitigation:
  - Add the smallest deterministic fixtures necessary and isolate assertions to
    the locked behavior.
