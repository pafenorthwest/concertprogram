# establish-goals

## Status

- Iteration: v0
- State: locked
- Task name (proposed, kebab-case): `stabilize-schedule-page-tests`

## Request restatement

- Re-run the schedule-page test file and, if it passes, move the work to the next lifecycle stage.
- Determine whether the prior `Valid Concerto page` timeout came from stale page expectations or from test/setup behavior, and keep the fix scoped to that test surface.

## Context considered

- Repo/rules/skills consulted:
  - `AGENTS.md`
  - `.codex/project-structure.md`
  - `.codex/codex-config.yaml`
  - `/Users/eric/.codex/skills/establish-goals/SKILL.md`
  - `/Users/eric/.codex/skills/prepare-takeoff/SKILL.md`
  - `/Users/eric/.codex/skills/prepare-phased-impl/SKILL.md`
  - `/Users/eric/.codex/skills/implement/SKILL.md`
- Relevant files (if any):
  - `src/test/api/schedule-page.test.ts`
  - `src/routes/schedule/+page.svelte`
  - `src/routes/schedule/+page.server.ts`
  - `src/lib/cache.ts`
  - `src/lib/server/slotCatalog.ts`
- Constraints (sandbox, commands, policy):
  - `workspace-write`
  - network restricted
  - repo requires lifecycle stage validation and pinned verification commands

## Ambiguities

### Blocking (must resolve)

1. None.

### Non-blocking (can proceed with explicit assumptions)

1. "Pinned test" refers to `npm test -- --run src/test/api/schedule-page.test.ts`.
2. Proceeding to the next stage means advancing this task through the repo lifecycle once the file-level test is green.

## Questions for user

1. None.

## Assumptions (explicit; remove when confirmed)

1. The schedule page markup is authoritative unless the investigation proves the page implementation regressed.
2. A test/setup fix is preferred over a page change if the selectors and form flow still exist in the rendered page.

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

## Risks / tradeoffs

- A file-level green run may still leave repo-wide verification blockers; those must be surfaced instead of hidden.

## Next action

- Ready to lock and proceed to `prepare-takeoff`.
