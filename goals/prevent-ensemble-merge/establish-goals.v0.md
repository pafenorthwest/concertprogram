# establish-goals

## Status

- Iteration: v0
- State: locked
- Task name (proposed, kebab-case): prevent-ensemble-merge

## Request restatement

- Prevent same-performer scheduling merges from combining ensemble performances with solo or concerto performances when the class code family indicates an ensemble.
- Specifically, when the first dot-delimited class-code segment is a three-letter code ending in `EP`, that performance must not merge with non-ensemble performances in either `performance_pieces` or `adjudicated_pieces`.
- Add regression coverage for the reported case where an ensemble class such as `WEP.8-13.A1` and a solo class such as `WS.12-13.A1` share the same performer name.

## Context considered

- Repo/rules/skills consulted:
  - `AGENTS.md`
  - `/Users/eric/.codex/skills/acac/SKILL.md`
  - `/Users/eric/.codex/skills/establish-goals/SKILL.md`
  - `.codex/project-structure.md`
- Relevant files (if any):
  - `src/lib/server/import.ts`
  - `src/lib/server/db.ts`
  - `src/test/db/lookupByCode-multi-class.test.ts`
  - `src/test/db/import.test.ts`
- Constraints (sandbox, commands, policy):
  - Do not modify application source before goals are approved and locked.
  - Verification commands are pinned to `npm run lint`, `npm run build`, and `npm run test`.
  - Keep changes minimal and limited to the merge rule plus regression coverage.

## Ambiguities

### Blocking (must resolve)

1. None identified from the request and inspected code path.

### Non-blocking (can proceed with explicit assumptions)

1. The new merge restriction is intended to prevent cross-family merges where an `*EP` ensemble class would otherwise merge with solo or concerto performance classes for the same performer, series, and year.
2. Existing same-series merges for non-ensemble class families should continue to work as they do today.

## Questions for user

1. None. The request is specific enough to proceed to goal review.

## Assumptions (explicit; remove when confirmed)

1. A class is treated as an ensemble for this rule when its first dot-delimited segment is exactly three characters long and ends with `EP`, such as `WEP`.
2. The reported bug should be fixed in the same-series merge path triggered during import, because that is the code currently rebuilding both `performance_pieces` and `adjudicated_pieces`.

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

## Risks / tradeoffs

- Tightening merge eligibility at the class-family level could reveal previously hidden data-quality assumptions in same-series imports, so regression coverage must verify that the intended non-ensemble merge path still works.

## Next action

- Present normalized goals for approval. Lock goals only after explicit user approval.
