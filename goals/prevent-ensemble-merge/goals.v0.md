# Goals Extract

- Task name: prevent-ensemble-merge
- Iteration: v0
- State: locked

## Goals (1-20, verifiable)

1. Prevent the same-series merge logic from merging a performance whose class-family prefix is a three-letter code ending in `EP` with solo or concerto performances for the same performer, series, and year.
2. Ensure the merge-prevention rule preserves separate `performance_pieces` rows for affected ensemble and non-ensemble performances instead of collapsing them into one primary performance.
3. Ensure the merge-prevention rule preserves separate `adjudicated_pieces` merge state for affected ensemble and non-ensemble performances so the non-primary record is not marked merged solely because of the shared performer identity.
4. Add an automated regression test covering the reported ensemble-versus-solo scenario and asserting the pieces remain unmerged.
5. Keep existing same-series merge behavior unchanged for in-scope non-ensemble scenarios already covered by the current tests.

## Non-goals (explicit exclusions)

- Changing performer matching, lookup-code generation, or broader import deduplication rules.
- Introducing new database schema changes, migrations, or UI behavior unrelated to the merge guard.

## Success criteria (objective checks)

> Tie each criterion to a goal number when possible.

- [G1] Importing same-performer performances where one class-family prefix matches the `*EP` ensemble rule and the other does not does not combine them into a single merged performance set.
- [G2] After the import/merge flow runs for that scenario, each affected performance retains its own `performance_pieces` associations.
- [G3] After the import/merge flow runs for that scenario, the affected `adjudicated_pieces` rows remain unmerged for the separate performances rather than marking one side as merged.
- [G4] A regression test fails without the rule and passes with it.
- [G5] Existing same-series multi-class merge tests continue to pass.
