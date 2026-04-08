# Apostrophy Bug Comments

## Overview
Verify the reported schedule-page server error when a submitted comment contains
one or more apostrophes, and if reproduced, make the schedule comment path store
that text safely without widening the change beyond the affected flow.

## Goals
- Verify whether an apostrophe-containing schedule comment reproduces the
  current server-side failure.
- If the issue is reproduced, update the schedule comment persistence path so
  schedule submission succeeds when comments contain apostrophes.
- Keep the change scoped to schedule comment submission and directly affected
  tests/task artifacts.
- Add automated coverage for the apostrophe comment case through the affected
  schedule submission path.
- Preserve existing plain-text comment behavior while allowing apostrophe-
  containing comments to persist successfully.

## Non-goals
- No broader rewrite of the database layer to parameterize every query.
- No unrelated changes to schedule validation, scheduling rules, or admin/program
  comment rendering.
- No schema migration, API contract expansion, or new dependency introduction.

## Use cases / user stories
- A performer or parent submits the schedule form with a comment such as `I'm available after 5`.
- The current schedule submission path is exercised end-to-end and either
  reproduces the reported failure or proves it no longer exists.
- If the bug is present, the same schedule workflow succeeds after the fix and
  preserves the submitted comment semantics.

## Current behavior
- `src/routes/schedule/+page.server.ts` reads `comment` from form data and
  passes it directly to `updateConcertPerformance`.
- `src/lib/server/db.ts` currently builds the `UPDATE performance ... comment =`
  SQL by string concatenation, which makes apostrophes a likely failure mode in
  the schedule submission path.
- Existing schedule-page Playwright coverage verifies plain-text comments such as
  `Thank you` and `See you there`, but it does not cover apostrophes.
- Key files:
  - `src/routes/schedule/+page.server.ts`
  - `src/lib/server/db.ts`
  - `src/test/api/schedule-page.test.ts`

## Proposed behavior
- Reproduce the apostrophe comment submission path against the current schedule
  implementation and capture whether it fails.
- If reproduction succeeds, adjust the affected comment persistence path so the
  schedule submission accepts apostrophes without triggering a server-side
  failure.
- Edge cases:
  - Existing non-apostrophe comments continue to save successfully.
  - The stored schedule comment should retain apostrophe semantics rather than
    dropping the character entirely.
  - If the issue cannot be reproduced, stop implementation and document the
    evidence instead of forcing an unnecessary code change.

## Technical design
### Architecture / modules impacted
- `src/routes/schedule/+page.server.ts` only if the schedule action needs
  localized escaping before persistence.
- `src/lib/server/db.ts` for the schedule performance comment update path.
- `src/test/api/schedule-page.test.ts` for end-to-end regression coverage.

### API changes (if any)
- None intended. The schedule page request and response contract should remain
  unchanged.

### UI/UX changes (if any)
- None. The schedule form behavior should stay the same apart from the apostrophe
  submission no longer failing.

### Data model / schema changes (PostgreSQL)
- Migrations: none.
- Backward compatibility: existing schema and stored comment column remain
  unchanged.
- Rollback: revert the schedule comment persistence change and the added tests.

## Security & privacy
- Keep existing schedule lookup behavior and auth boundaries unchanged.
- Avoid widening the change into unrelated input handling or exposing new error
  detail.

## Observability (logs/metrics)
- No new logging required for this task.

## Verification Commands
> Pin the exact commands discovered for this repo (also update `./codex/project-structure.md` and `./codex/codex-config.yaml`).

- Lint:
  - `npm run lint`
- Build:
  - `npm run build`
- Test:
  - `npm run test`

## Test strategy
- Unit: none expected unless a small escaping helper is introduced.
- Integration: add coverage around the schedule submission path with an
  apostrophe-containing comment and verify persisted results.
- E2E / UI (if applicable): use the existing Playwright-backed schedule page test
  coverage if it remains the most direct reproduction surface.

## Acceptance criteria checklist
- [ ] The current apostrophe comment path is either reproduced with concrete
      evidence or explicitly shown not to fail.
- [ ] If reproduced, schedule submission succeeds with an apostrophe-containing
      comment after the fix.
- [ ] Automated coverage verifies the apostrophe case and persisted comment
      behavior.
- [ ] Existing plain-text schedule comment behavior remains intact.
- [ ] `npm run lint`, `npm run build`, and `npm run test` pass.

## IN SCOPE
- `src/routes/schedule/+page.server.ts` only if required for a localized fix
- `src/lib/server/db.ts`
- `src/test/api/schedule-page.test.ts`
- `tasks/apostrophy-bug-comments/*`
- `goals/apostrophy-bug-comments/*`

## OUT OF SCOPE
- Database-wide query parameterization outside the affected schedule comment
  path.
- Unrelated schedule page copy, validation, or piece-selection behavior.
- Schema migrations, admin workflow changes, or broader comment rendering work.

## Goal lock assertion
- Locked goals source: `goals/apostrophy-bug-comments/goals.v0.md`
- Goal changes, non-goal changes, and success-criteria changes are not allowed
  without restarting the lifecycle from `establish-goals`.

## Ambiguity check
- Result: passed.
- Remaining ambiguity: none blocking.

## Governing context
- Rules:
  - `./.codex/rules/expand-task-spec.rules`
  - `./.codex/rules/git-safe.rules`
- Skills:
  - `acac`
  - `establish-goals`
  - `prepare-takeoff`
  - `prepare-phased-impl`
  - `implement`
  - `land-the-plan`
- Sandbox:
  - workspace-write filesystem
  - restricted network

## Environment & tooling notes
- Repository root: `/Users/eric/.codex/worktrees/fe54/concertprogram`
- Current branch during Stage 2 prep: `(detached HEAD)`
- Worktree safety prep found uncommitted task/goals metadata created during this
  lifecycle; do not revert them.
- Canonical verification commands confirmed from `./.codex/project-structure.md`
  and `./.codex/codex-config.yaml`.

## Execution posture lock
- Simplicity bias: prefer the smallest change that makes apostrophe-containing
  schedule comments safe.
- Surgical-change rule: limit behavior edits to the schedule comment persistence
  path and directly affected tests.
- Fail-fast rule: do not hide reproduction results or database write failures.

## Change control
- Scope expansion is not allowed after Stage 2.
- Changes to goals, constraints, success criteria, verification commands, or
  scope require explicit relock through the lifecycle.
- Override authority: the user must approve any scope or contract change.

## Existing-worktree safety prep
- Command: `./.codex/scripts/prepare-takeoff-worktree.sh apostrophy-bug-comments`
- Result: completed without merge conflicts.
- Notes:
  - Running on detached `HEAD`.
  - Uncommitted entries were present for `.codex/codex-config.yaml`,
    `goals/task-manifest.csv`, and `goals/apostrophy-bug-comments/`.

## Stage verdict
- READY FOR PLANNING

## Implementation phase strategy
- Complexity: scored:L2 (focused)
- Complexity scoring details: score=8; recommended-goals=4; guardrails-all-true=true; signals=/Users/eric/.codex/worktrees/fe54/concertprogram/tasks/apostrophy-bug-comments/complexity-signals.json
- Active phases: 1..3
- No new scope introduced: required
