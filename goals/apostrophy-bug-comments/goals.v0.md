# Goals Extract

- Task name: apostrophy-bug-comments
- Iteration: v0
- State: locked

## Goals (1-20, verifiable)

1. Verify whether submitting a schedule-page comment containing one or more apostrophes reproduces a server-side failure in the current implementation.
2. If the apostrophe failure is verified, update the schedule comment persistence path so schedule submission succeeds when the comment includes apostrophes.
3. Keep the fix scoped to the schedule comment submission flow and avoid unrelated changes to scheduling behavior.
4. Add automated test coverage that exercises the apostrophe comment case through the affected schedule submission path and verifies the failure is prevented.
5. Preserve existing schedule comment behavior for non-apostrophe text while allowing apostrophe-containing comments to persist successfully.

## Non-goals (explicit exclusions)

- Redesigning the full database layer to use parameterized queries everywhere.
- Changing unrelated schedule form behavior, validation rules, or admin/program comment rendering beyond what is required for this bug.

## Success criteria (objective checks)

> Tie each criterion to a goal number when possible.

- [G1] Reproduction evidence shows whether the current schedule submission path fails when the comment contains apostrophes.
- [G2] When the issue is reproduced, the implementation prevents that server-side failure for apostrophe-containing schedule comments.
- [G3] The code change stays within the schedule submission path and its directly affected tests/task artifacts.
- [G4] Automated coverage includes a schedule comment containing an apostrophe and verifies successful handling.
- [G5] Existing plain-text comment submission behavior remains covered and passes.
