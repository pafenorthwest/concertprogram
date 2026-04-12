# Goals Extract

- Task name: stabilize-schedule-page-tests
- Iteration: v0
- State: locked

## Goals (1-20, verifiable)

1. Re-run `src/test/api/schedule-page.test.ts` and confirm whether the file passes.
2. Verify whether the `Valid Concerto page` timeout is caused by stale page formatting expectations or by test/setup behavior.
3. Keep the fix scoped to the schedule-page test surface and supporting setup only.
4. Advance the task to the next valid lifecycle stage after verification.
5. Run the repo’s pinned verification commands needed for the current stage or record blockers precisely.

## Non-goals (explicit exclusions)

- Changing unrelated schedule page product behavior without evidence of a real page regression.
- Refactoring the scheduling system outside the test/setup issue.

## Success criteria (objective checks)

> Tie each criterion to a goal number when possible.

- [G1] `npm test -- --run src/test/api/schedule-page.test.ts` passes.
- [G2] The diagnosis explicitly concludes whether the failure was stale formatting or a test/setup issue.
- [G3] The code change stays within `src/test/api/schedule-page.test.ts` and any directly required support surface.
- [G4] Task artifacts advance to the next valid lifecycle verdict.
- [G5] Stage verification outcomes are recorded truthfully, including any blockers.
