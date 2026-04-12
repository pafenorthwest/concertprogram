# Phase 1 — Stabilize File-Local Schedule Tests

## Objective

Make `src/test/api/schedule-page.test.ts` deterministic by fixing file-local setup and submit-wait behavior, then verify the file passes and advance the task to the next gate.

## Code areas impacted
- `src/test/api/schedule-page.test.ts`
- `tasks/stabilize-schedule-page-tests/`

## Work items
- [x] Re-run `src/test/api/schedule-page.test.ts` and confirm the current failure mode.
- [x] Verify whether the `Valid Concerto page` timeout is caused by stale page formatting expectations or by test/setup behavior.
- [x] Refresh concert-time cache during test seeding and cleanup so the file does not depend on prior test order.
- [x] Keep submit helpers aligned with the actual `?/add` action navigation flow.
- [x] Re-run the schedule-page test file after the fix.

## Deliverables
- Updated `src/test/api/schedule-page.test.ts`
- Passing `src/test/api/schedule-page.test.ts`
- Recorded diagnosis and verification outcomes

## Gate (must pass before proceeding)
Define objective pass/fail criteria.
- [x] The root cause is identified.
- [x] The file-level test passes.
- [x] The fix remains within the approved scope.

## Verification steps
List exact commands and expected results.
- [x] Command: `npm test -- --run src/test/api/schedule-page.test.ts`
  - Expected: `PASS`
- [ ] Command: `npm run lint`
  - Expected: `PASS`
- [ ] Command: `npm run build`
  - Expected: `PASS`
- [ ] Command: `npm run test`
  - Expected: `PASS`

## Risks and mitigations
- Risk: The file-level fix may still leave unrelated repo-wide failures.
- Mitigation: Run canonical repo verification and record any blockers explicitly instead of broadening scope silently.
