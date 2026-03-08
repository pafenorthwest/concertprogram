# Phase 6 — Verification And Implementation Handoff

## Objective
Complete full repo verification for the locked task surface, resolve any
task-local fallout, and leave the implementation stage ready to execute without
scope ambiguity.

## Code areas impacted
- `tasks/radio-select-piece/*`
- Any in-scope implementation files touched by earlier phases only if
  verification uncovers task-local issues

## Work items
- [x] Run the pinned lint, build, and test commands.
- [x] Fix only issues introduced by the in-scope schedule-piece work.
- [x] Confirm task artifacts still match the locked goals and scope.

## Deliverables
- Verified implementation-ready plan with explicit repo command coverage.
- A clean handoff from Stage 3 to Stage 4.

## Gate (must pass before proceeding)
Define objective pass/fail criteria.
- [ ] `npm run lint`, `npm run build`, and `npm run test` are all planned and
      mapped to the task. EVIDENCE: all three pinned commands now pass with the
      workspace `.env` in place.
- [x] No unresolved scope drift remains in the task artifacts.

## Verification steps
List exact commands and expected results.
- [x] Command: `npm run lint`
  - Expected: passes or identifies only in-scope issues to resolve during
    implementation.
- [ ] Command: `npm run build`
  - Expected: passes with the schedule-flow changes in place.
- [ ] Command: `npm run test`
  - Expected: passes with the new schedule coverage included.
- Evidence:
  - `npm run lint` PASS after formatting and removing the unused test variable.
  - `npm run build` PASS with the provided `.env`; Vite completed a full
    production build.
  - `npm run test` PASS with the provided `.env`; the full Vitest suite passed,
    including the new schedule coverage.

## Risks and mitigations
- Risk:
  - Verification failures may expose unrelated dirty-worktree issues.
- Mitigation:
  - Distinguish pre-existing worktree noise from task-caused regressions and fix
    only the latter.
