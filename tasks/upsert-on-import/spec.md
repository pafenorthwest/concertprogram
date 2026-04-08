# Upsert On Import

## Overview
Make the import flow recover cleanly when a malformed import leaves behind a
partial `performance` row. A corrected re-import for the same logical
performance should reuse that row, refresh its selected pieces, and avoid
creating a duplicate performance entry.

## Goals
- Reuse an existing matching `performance` row during import instead of
  attempting a second insert that fails on duplicate data.
- Allow a corrected re-import to succeed after a malformed import left only the
  matching performance row behind.
- Ensure the recovered import leaves the selected performance pieces aligned to
  the corrected payload.
- Add automated coverage for the malformed-import recovery path and duplicate-row
  prevention.
- Preserve the existing behavior for truly new imports.

## Non-goals
- No change to performer matching semantics beyond what is needed to reuse the
  existing `performance` row.
- No transactional rewrite of the full import workflow.
- No schema migration, API contract expansion, or new dependency introduction.

## Use cases / user stories
- Admin imports a performance payload with malformed musical piece contributor
  data that fails after the `performance` row has been created.
- Admin corrects the payload and retries the import for the same performer,
  class, concert series, and year.
- The retry succeeds, updates the existing performance record path, and the
  performer lookup shows the corrected selected piece data without duplicate
  performance rows.

## Current behavior
- `src/lib/server/import.ts` searches for an existing performance by performer,
  class, concert series, and year, but only returns the existing row without
  explicitly upserting or refreshing import-owned fields.
- Import failures that happen after `processPerformance` can leave a partial
  `performance` row in the database.
- A subsequent corrected import can fail when downstream insert logic collides
  with the previously created performance state.
- Existing database tests in `src/test/db/import.test.ts` cover basic re-import
  refresh behavior, but not the malformed-import recovery path described in the
  task.
- Key files:
  - `src/lib/server/import.ts`
  - `src/routes/api/import/+server.ts`
  - `src/test/db/import.test.ts`

## Proposed behavior
- Import will treat the matching `performance` row as an update target whenever
  it already exists for the same performer, class, concert series, and year.
- Recovery imports after malformed payload failures will reuse that existing row
  and continue rebuilding `performance_pieces` from the corrected payload.
- The logical performance remains single-row after recovery.
- Edge cases:
  - New logical performances must still create a new row and report as new.
  - Imports with no matching performance row must keep the current insert path.
  - The task does not relax validation for malformed musical piece payloads; it
    only makes the later corrected retry resilient to the existing performance.

## Technical design
### Architecture / modules impacted
- `src/lib/server/import.ts` for performance insert/update behavior within the
  import workflow.
- Existing DB helpers in `src/lib/server/db.ts` only if import needs an explicit
  update helper instead of the current insert-only path.
- `src/test/db/import.test.ts` for recovery-path coverage.

### API changes (if any)
- None intended. `api/import` keeps the current request and response contract.

### UI/UX changes (if any)
- None.

### Data model / schema changes (PostgreSQL)
- Migrations: none.
- Backward compatibility: existing schema and endpoint contract remain intact.
- Rollback: revert the import logic and tests; no database rollback required.

## Security & privacy
- Keep existing import authorization behavior unchanged.
- Avoid expanding logged payload contents or exposing additional error detail.

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
- Unit: none expected unless small helper extraction becomes necessary.
- Integration: extend `src/test/db/import.test.ts` with a malformed-import
  recovery case that leaves a performance row behind, then verifies the
  corrected retry succeeds and keeps a single performance row.
- E2E / UI (if applicable): none.

## Acceptance criteria checklist
- [ ] A corrected import succeeds when the only persisted side effect from the
      failed import is the matching `performance` row.
- [ ] The corrected import reuses the same logical performance row instead of
      creating a duplicate.
- [ ] The recovered import refreshes the selected piece mappings to match the
      corrected payload.
- [ ] Existing new-import behavior remains intact.
- [ ] `npm run lint`, `npm run build`, and `npm run test` pass.

## IN SCOPE
- `src/lib/server/import.ts`
- `src/lib/server/db.ts` only if required for an explicit performance update
  helper
- `src/test/db/import.test.ts`
- `tasks/upsert-on-import/*`
- `goals/upsert-on-import/*`

## OUT OF SCOPE
- Performer search identity changes outside the current import key.
- Contributor or musical piece deduplication redesign.
- Schema migrations or transaction-wide rollback behavior.
- Frontend or admin UI changes.

## Goal lock assertion
- Locked goals source: `goals/upsert-on-import/goals.v0.md`
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
- Repository root: `/Users/eric/side-projects/concertprogram`
- Current branch during Stage 2 prep: `main`
- Worktree safety prep found uncommitted task/goals metadata and unrelated
  pre-existing goal changes; do not revert them.
- Canonical verification commands confirmed from `./.codex/project-structure.md`
  and `./.codex/codex-config.yaml`.

## Execution posture lock
- Simplicity bias: prefer the smallest change that makes import reuse the
  existing performance row.
- Surgical-change rule: limit behavior edits to the import flow and its tests.
- Fail-fast rule: preserve explicit errors for malformed imports and surface any
  unrecoverable mismatch clearly.

## Change control
- Scope expansion is not allowed after Stage 2.
- Changes to goals, constraints, success criteria, verification commands, or
  scope require explicit relock through the lifecycle.
- Override authority: the user must approve any scope or contract change.

## Existing-worktree safety prep
- Command: `./.codex/scripts/prepare-takeoff-worktree.sh upsert-on-import`
- Result: completed without merge conflicts.
- Notes:
  - Running on protected branch `main`.
  - Uncommitted entries were present for `.codex/codex-config.yaml`,
    `goals/task-manifest.csv`, `goals/compat-import-test/`,
    `goals/upsert-on-import/`, and `tasks/upsert-on-import/`.

## Stage verdict
- READY FOR PLANNING

## Implementation phase strategy
- Complexity: scored:L2 (focused)
- Complexity scoring details: score=8; recommended-goals=4; guardrails-all-true=true; signals=/Users/eric/side-projects/concertprogram/tasks/upsert-on-import/complexity-signals.json
- Active phases: 1..3
- No new scope introduced: required
