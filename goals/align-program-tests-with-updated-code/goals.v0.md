# Goals Extract

- Task name: align-program-tests-with-updated-code
- Iteration: v0
- State: locked

## Goals (1-20, verifiable)

1. Review the diff between `713be81eafb54abbc7c45cc3b7a15ab2095691ab` and `HEAD` for actionable issues introduced by the change.
2. Update `src/test/lib/programDocx.test.ts` so the failing DOCX export assertion matches the current performer-line output.
3. Update `src/test/db/program.test.ts` so the failing Eastside overflow assertion validates the current scheduling behavior using only the fixtures created by the test.
4. Verify the updated tests pass.
5. Run the pinned repo verification commands for lint, build, and test, or document a precise blocker if any command fails.

## Non-goals (explicit exclusions)

- Changing `src/lib/server/programDocx.ts` export behavior unless a review finding proves the code itself is incorrect.
- Reworking the scheduling algorithm beyond what is required to make the stale test reflect the current intended behavior.

## Success criteria (objective checks)

> Tie each criterion to a goal number when possible.

- [G1] The review identifies either exact actionable findings with file/line references or explicitly concludes the patch is correct.
- [G2] `src/test/lib/programDocx.test.ts` asserts the current DOCX performer formatting and passes.
- [G3] `src/test/db/program.test.ts` asserts the imported fixture placements without relying on unrelated seeded rows and passes.
- [G4] `npm test -- --run src/test/db/program.test.ts src/test/lib/programDocx.test.ts` passes.
- [G5] `npm run lint`, `npm run build`, and `npm run test` complete successfully, or any failure is documented as a blocker with command output context.
