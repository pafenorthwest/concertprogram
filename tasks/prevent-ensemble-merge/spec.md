# Prevent Ensemble Merge

## Overview
Prevent same-performer, same-series merge logic from combining ensemble-class
performances with solo or concerto performances when the ensemble class family
uses a three-letter prefix ending in `EP`. Preserve separate piece mappings and
merged-state tracking for those performances, and add regression coverage for
the reported scheduling case.

## Goals
- Prevent the merge path from combining an `*EP` ensemble performance with
  solo or concerto performances for the same performer, concert series, and
  year.
- Preserve separate `performance_pieces` rows for the affected performances.
- Preserve separate `adjudicated_pieces` merge flags for the affected
  performances.
- Add an automated regression test for the ensemble-versus-solo case.
- Keep the existing same-series non-ensemble merge behavior intact.

## Non-goals
- No broader changes to performer matching or import deduplication.
- No schema migration, API contract change, or UI update.
- No redesign of the existing same-series merge behavior outside the `*EP`
  ensemble guard.

## Use cases / user stories
- Admin imports two winning performances for the same performer in the same
  concert series and year.
- One performance belongs to an ensemble class such as `WEP.8-13.A1`, where
  the first class-code segment is a three-letter code ending in `EP`.
- Another performance belongs to a solo or concerto class such as
  `WS.12-13.A1`.
- Scheduling and lookup flows must continue to find both performances without
  collapsing their pieces into one merged primary record.

## Current behavior
- `src/lib/server/import.ts` invokes the same-series merge path after import for
  any performer with multiple performances in the same concert series and year.
- `src/lib/server/db.ts` currently selects those performances without
  considering class-family boundaries, then rebuilds `performance_pieces` and
  flips `adjudicated_pieces.is_merged` for the secondary records.
- Existing regression coverage in
  `src/test/db/lookupByCode-multi-class.test.ts` verifies same-series merging
  for non-ensemble classes, but does not cover the ensemble-versus-solo case.
- Key files:
  - `src/lib/server/db.ts`
  - `src/lib/server/import.ts`
  - `src/test/db/lookupByCode-multi-class.test.ts`

## Proposed behavior
- Same-series merging will exclude cross-family combinations where one
  performance uses a three-letter first class-code segment ending in `EP` and
  the other performance does not.
- For that scenario, each performance retains its own `performance_pieces`
  associations and its own unmerged `adjudicated_pieces` rows.
- Existing non-ensemble same-series merge behavior remains unchanged.
- Edge cases:
  - Multiple non-ensemble same-series performances for one performer must still
    merge as they do today.
  - An ensemble performance imported without any non-ensemble counterpart must
    still rebuild its own piece associations correctly.
  - The task does not add new category metadata; it derives eligibility from the
    existing class-code prefix only.

## Technical design
### Architecture / modules impacted
- `src/lib/server/db.ts` for the merge eligibility rule inside
  `mergePerformancePiecesForPerformerSeries`.
- `src/lib/server/common.ts` only if a shared class-family helper materially
  reduces duplication.
- `src/test/db/lookupByCode-multi-class.test.ts` for the regression fixture and
  assertions.

### API changes (if any)
- None.

### UI/UX changes (if any)
- None.

### Data model / schema changes (PostgreSQL)
- Migrations: none.
- Backward compatibility: existing schema and schedule lookup contracts remain
  unchanged.
- Rollback: revert the merge guard and regression test; no database rollback
  required.

## Security & privacy
- Keep existing authorization and data exposure behavior unchanged.
- Do not expand logging or surface additional personal data in errors.

## Observability (logs/metrics)
- No new logging or metrics are required.

## Verification Commands
> Pin the exact commands discovered for this repo (also update `./codex/project-structure.md` and `./codex/codex-config.yaml`).

- Lint:
  - `npm run lint`
- Build:
  - `npm run build`
- Test:
  - `npm run test`

## Test strategy
- Unit: none expected unless the merge rule is extracted into a small helper.
- Integration: extend `src/test/db/lookupByCode-multi-class.test.ts` with a
  same-series ensemble-versus-solo regression case that verifies both
  `performance_pieces` and `adjudicated_pieces` stay separate.
- E2E / UI (if applicable): none.

## Acceptance criteria checklist
- [ ] Same-series imports no longer merge an `*EP` ensemble performance with a
      solo or concerto performance for the same performer.
- [ ] The affected performances retain separate `performance_pieces` rows.
- [ ] The affected performances retain unmerged `adjudicated_pieces` state.
- [ ] A regression test covers the ensemble-versus-solo scenario.
- [ ] `npm run lint`, `npm run build`, and `npm run test` pass.

## IN SCOPE
- `src/lib/server/db.ts`
- `src/lib/server/import.ts` only if the merge guard needs a small call-site
  adjustment
- `src/test/db/lookupByCode-multi-class.test.ts`
- `tasks/prevent-ensemble-merge/*`
- `goals/prevent-ensemble-merge/*`

## OUT OF SCOPE
- Performer identity matching changes.
- Broader merge-policy redesign beyond the `*EP` ensemble guard.
- Schema migrations, API changes, or UI updates.

## Goal lock assertion
- Locked goals source: `goals/prevent-ensemble-merge/goals.v0.md`
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
- Repository root: `/Users/eric/.codex/worktrees/3a2f/concertprogram`
- Current branch during Stage 2 prep: detached `HEAD`
- Worktree safety prep found uncommitted task/goals metadata only; do not
  revert them.
- Canonical verification commands confirmed from
  `./.codex/project-structure.md` and `./.codex/codex-config.yaml`.

## Execution posture lock
- Simplicity bias: prefer the smallest merge-eligibility change that blocks the
  bad ensemble/non-ensemble combination.
- Surgical-change rule: limit behavior edits to the same-series merge path and
  targeted DB regression coverage.
- Fail-fast rule: preserve explicit failures for unexpected lookup or merge
  state rather than silently broadening merge behavior.

## Change control
- Scope expansion is not allowed after Stage 2.
- Changes to goals, constraints, success criteria, verification commands, or
  scope require explicit relock through the lifecycle.
- Override authority: the user must approve any scope or contract change.

## Existing-worktree safety prep
- Command: `./.codex/scripts/prepare-takeoff-worktree.sh prevent-ensemble-merge`
- Result: completed without merge conflicts.
- Notes:
  - Running from detached `HEAD`.
  - Uncommitted entries were present for `.codex/codex-config.yaml`,
    `goals/task-manifest.csv`, `goals/prevent-ensemble-merge/`, and
    `tasks/prevent-ensemble-merge/`.

## Stage verdict
- READY FOR PLANNING

## Implementation phase strategy
- Complexity: focused
- Complexity scoring details: score=6; recommended-goals=4; guardrails-all-true=true; signals=/Users/eric/.codex/worktrees/3a2f/concertprogram/tasks/prevent-ensemble-merge/complexity-signals.json
- Active phases: 1..3
- No new scope introduced: required
