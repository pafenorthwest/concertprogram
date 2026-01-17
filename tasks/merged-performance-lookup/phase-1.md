# Phase 1 — Contracts and Test Scaffolding

## Objective
Define the updated lookup contract and add test coverage scaffolding for same-series multi-class lookups.

## Code areas impacted
- `src/lib/server/common.ts`
- `src/test/db/lookupByCode-multi-class.test.ts`

## Work items
- [ ] Extend `PerformerSearchResultsInterface` to include primary class code and class display.
- [ ] Add same-series multi-class fixtures/tests to validate merged lookup expectations.
- [ ] Document expected fields and behavior in tests (primary code + class list + merged pieces).

## Deliverables
- Updated types for lookup results.
- Tests covering multi-class lookups within the same series/year.

## Gate (must pass before proceeding)
- [ ] Types compile with new fields and tests describe expected behavior.

## Verification steps
- [ ] Command: `npm run test`
  - Expected: tests pass or failures are documented as blockers.

## Risks and mitigations
- Risk: Additional fields are missed in some lookup mappings.
- Mitigation: Update tests to assert fields are populated and non-empty.
