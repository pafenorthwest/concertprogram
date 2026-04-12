# Phase 1 — Review And Test Alignment

## Objective

Confirm whether the small diff introduced any actionable issue, then align the two failing tests with the current reviewed behavior and verify the repo stays green.

## Code areas impacted
- `src/lib/server/programDocx.ts`
- `src/routes/admin/program/+page.svelte`
- `src/test/lib/programDocx.test.ts`
- `src/test/db/program.test.ts`
- `tasks/align-program-tests-with-updated-code/`

## Work items
- [x] Review the diff between `713be81eafb54abbc7c45cc3b7a15ab2095691ab` and `HEAD` for correctness issues.
- [x] Update the DOCX export test to assert the new performer-line output.
- [x] Update the scheduling integration test to validate placements for the fixtures it creates.
- [x] Run the targeted failing tests, then the pinned lint/build/test commands.
- [x] Record review and verification outcomes in the task artifacts.

## Deliverables
- Updated `src/test/lib/programDocx.test.ts`
- Updated `src/test/db/program.test.ts`
- Completed review verdict
- Verification results recorded in `final-phase.md`

## Gate (must pass before proceeding)
Define objective pass/fail criteria.
- [x] Review completed with either actionable findings or an explicit correctness verdict.
- [x] Both stale tests updated to match the reviewed behavior.
- [x] Targeted tests pass before full verification starts.

## Verification steps
List exact commands and expected results.
- [ ] Command: `npm test -- --run src/test/db/program.test.ts src/test/lib/programDocx.test.ts`
  - Expected: `PASS`
- [ ] Command: `npm run lint`
  - Expected: `PASS`
- [ ] Command: `npm run build`
  - Expected: `PASS`
- [ ] Command: `npm run test`
  - Expected: `PASS`

## Risks and mitigations
- Risk: The scheduling failure may reveal a real regression rather than a stale assertion.
- Mitigation: Inspect placements for the imported fixtures before changing the test, and only keep test-only changes if the underlying behavior is sound.
