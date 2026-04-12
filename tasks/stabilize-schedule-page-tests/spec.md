# Stabilize Schedule Page Tests

## Overview

Rerun and stabilize the schedule-page Playwright-backed test file, with special attention to the prior `Valid Concerto page` timeout. The scope is limited to the test/setup behavior needed to make the file deterministic and to advance the task to the next lifecycle gate.

## Goals

1. Re-run `src/test/api/schedule-page.test.ts` and confirm its current status.
2. Determine whether the prior `Valid Concerto page` timeout was caused by stale page formatting expectations or by test/setup behavior.
3. Keep the fix scoped to the schedule-page test surface and any directly required setup helper behavior.
4. Advance the task to the next valid lifecycle stage once the file-level verification passes.
5. Record truthful verification outcomes for the current stage.

## Non-goals

- Changing schedule page product behavior without evidence that the page itself regressed.
- Refactoring unrelated scheduling, lookup, or import behavior.
- Landing or committing unrelated in-progress changes in the worktree.

## Use cases / user stories

- As a maintainer, I can trust `src/test/api/schedule-page.test.ts` to pass when run directly.
- As a maintainer, I know whether the previous timeout came from the page markup or from test orchestration/setup state.

## Current behavior
- Notes:
  - The schedule page still renders the concerto-specific headings, review card, confirmation form, and success message expected by the `Valid Concerto page` test.
  - The test file seeds `TwoSlotTest` and `TenSlotTest` concert times, but the schedule page reads cached concert-time data.
  - Without refreshing cache after seeding/cleanup, the file can depend on external test ordering.
  - The submit helpers expect a navigation to `/schedule?/add`, and the test must wait for that action navigation to settle before issuing a new `goto`.
- Key files:
  - `src/test/api/schedule-page.test.ts`
  - `src/routes/schedule/+page.svelte`
  - `src/routes/schedule/+page.server.ts`
  - `src/lib/cache.ts`
  - `src/lib/server/slotCatalog.ts`

## Proposed behavior
- Behavior changes:
  - Refresh the cached concert-time data whenever the test file seeds or removes concert times for its synthetic series.
  - Keep the submit helpers aligned with the real action-navigation behavior so subsequent navigations do not race the form submission.
- Edge cases:
  - The concerto test should not fail just because the form redirects through `?/add` before the test reloads the page.
  - Rank-choice variant tests should not depend on some earlier test having populated the cache.

## Technical design
### Architecture / modules impacted
- `src/test/api/schedule-page.test.ts`
- `tasks/stabilize-schedule-page-tests/`

### API changes (if any)

- None.

### UI/UX changes (if any)

- None.

### Data model / schema changes (PostgreSQL)
- Migrations:
  - None.
- Backward compatibility:
  - Existing page and server behavior remain unchanged.
- Rollback:
  - Revert the test/setup adjustments in `src/test/api/schedule-page.test.ts`.

## Security & privacy

No auth, permission, or data-exposure behavior changes are in scope.

## Observability (logs/metrics)

No logging or metrics changes are planned.

## Verification Commands
> Pin the exact commands discovered for this repo (also update `./codex/project-structure.md` and `./codex/codex-config.yaml`).

- Lint:
  - `npm run lint`
- Build:
  - `npm run build`
- Test:
  - `npm run test`

## Test strategy
- Unit:
  - None; this scope is integration/Playwright-driven.
- Integration:
  - Re-run `npm test -- --run src/test/api/schedule-page.test.ts`.
- E2E / UI (if applicable):
  - Covered by the existing Playwright-backed schedule page tests in the file.

## Acceptance criteria checklist
- [ ] `src/test/api/schedule-page.test.ts` passes.
- [ ] The diagnosis explicitly concludes this was not a stale concerto page formatting issue.
- [ ] The fix stays within the schedule-page test surface and directly related setup behavior.
- [ ] Task artifacts advance to the next valid lifecycle verdict.

## IN SCOPE
- Re-running and stabilizing `src/test/api/schedule-page.test.ts`
- Updating file-local test/setup behavior in `src/test/api/schedule-page.test.ts`
- Task artifact updates required by the lifecycle

## OUT OF SCOPE
- Schedule page product changes
- Scheduling algorithm changes
- Unrelated test files and unrelated worktree changes

## Goal Lock Assertion

- Locked goals source: `goals/stabilize-schedule-page-tests/goals.v0.md`
- Locked state confirmed: no reinterpretation or expansion is permitted downstream.

## Ambiguity Check

- Result: passed
- Remaining ambiguity: none blocking Stage 2.

## Governing Context

- Rules:
  - `.codex/rules/expand-task-spec.rules`
  - `.codex/rules/git-safe.rules`
- Skills:
  - `establish-goals`
  - `prepare-takeoff`
  - `prepare-phased-impl`
  - `implement`
- Sandbox:
  - `workspace-write`
  - network restricted

## Execution Posture Lock

- Simplicity bias locked for downstream stages.
- Surgical-change discipline locked for downstream stages.
- Fail-fast error handling locked for downstream stages.

## Change Control

- Goal, constraint, and scope changes are not allowed after lock without explicit user approval and lifecycle re-entry as required.

## Readiness Verdict

- READY FOR PLANNING

## Implementation phase strategy
- Complexity: surgical
- Complexity scoring details: score=0; recommended-goals=1; guardrails-all-true=true; signals=/Users/eric/side-projects/concertprogram/tasks/stabilize-schedule-page-tests/complexity-signals.json
- Active phases: 1..1
- No new scope introduced: required
