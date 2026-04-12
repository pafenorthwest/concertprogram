# establish-goals

## Status

- Iteration: v0
- State: locked
- Task name (proposed, kebab-case): `align-program-tests-with-updated-code`

## Request restatement

- Review the code changes between commit `713be81eafb54abbc7c45cc3b7a15ab2095691ab` and `HEAD`.
- Update the failing tests so they match the current code behavior for program scheduling and DOCX export.

## Context considered

- Repo/rules/skills consulted:
  - `AGENTS.md`
  - `.codex/project-structure.md`
  - `.codex/codex-config.yaml`
  - `/Users/eric/.codex/skills/code-review/SKILL.md`
  - `/Users/eric/.codex/skills/establish-goals/SKILL.md`
  - `/Users/eric/.codex/skills/prepare-takeoff/SKILL.md`
  - `/Users/eric/.codex/skills/prepare-phased-impl/SKILL.md`
  - `/Users/eric/.codex/skills/implement/SKILL.md`
- Relevant files (if any):
  - `src/lib/server/programDocx.ts`
  - `src/routes/admin/program/+page.svelte`
  - `src/test/db/program.test.ts`
  - `src/test/lib/programDocx.test.ts`
  - `src/lib/server/program.ts`
- Constraints (sandbox, commands, policy):
  - `workspace-write`
  - network restricted
  - repo requires lifecycle stages and pinned verification commands

## Ambiguities

### Blocking (must resolve)

1. None.

### Non-blocking (can proceed with explicit assumptions)

1. The scheduling failure should be fixed by making the test assert placement behavior for the fixtures it creates, not by changing the scheduling algorithm.
2. The code review deliverable can be satisfied in the final response plus the task review artifact without opening a separate review-only task.

## Questions for user

1. None.

## Assumptions (explicit; remove when confirmed)

1. The updated DOCX performer line format is intentional and the stale test should be rewritten to match it.
2. Existing seeded performances for the active year may legitimately appear in Eastside concerts during integration tests, so the scheduling assertion must isolate imported fixtures.

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

## Risks / tradeoffs

- The scheduling test may still expose a real logic regression; if that happens, the scope must shift from stale-test alignment to a code fix, and the review must call that out explicitly.

## Next action

- Ready to lock and proceed to `prepare-takeoff`.
