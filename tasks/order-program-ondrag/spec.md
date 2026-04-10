# Order Program On Drag

## Overview
Repair admin program drag-and-drop persistence so reordering rows on
`/admin/program` saves successfully instead of failing with `405 Method Not
Allowed` on `POST /api/program`.

## Goals
- Identify the concrete cause of the `405` response on `POST /api/program`.
- Implement the minimal server-side fix so the existing drag-save payload
  persists row order.
- Preserve current `GET /api/program` export behavior and
  `PUT /api/program/[id]` force-move behavior.
- Add automated coverage for the reorder persistence path.
- Run the pinned repo verification commands and record the outcome.

## Non-goals
- No redesign of the drag-and-drop UI in `src/routes/admin/program/+page.svelte`.
- No changes to lottery placement logic, export formatting, or unrelated
  program behavior.
- No schema migration or new endpoint surface unless the investigation proves
  the current payload contract cannot be supported.

## Use cases / user stories
- Admin drags rows in the program table to reorder performers within a concert.
- When the drag ends, the page posts the reordered entries to `/api/program`.
- The API persists the new order and later program loads reflect that saved
  ordering.

## Current behavior
- `src/routes/admin/program/+page.svelte` recalculates `order` client-side
  after drag end and posts the full `data.program` array to `/api/program/`.
- `src/routes/api/program/+server.ts` only defines `GET`, so SvelteKit returns
  `405 Method Not Allowed` for the drag-save `POST`.
- `src/lib/server/db.ts` already contains `updateProgramOrder(id, concertSeries, order)`,
  which appears intended for program order persistence but is not currently used
  by the collection route.
- Existing API tests cover CSV/DOCX export and force-move behavior but do not
  cover the collection reorder save path.
- Key files:
  - `src/routes/admin/program/+page.svelte`
  - `src/routes/api/program/+server.ts`
  - `src/lib/server/db.ts`
  - `src/test/api/program-api.test.ts`

## Proposed behavior
- `POST /api/program` accepts the admin page’s reorder payload and persists the
  updated `performance_order` values for the provided entries.
- The save path validates the incoming payload and fails explicitly on malformed
  requests instead of silently ignoring them.
- Existing `GET /api/program` export behavior remains unchanged.
- Edge cases:
  - Invalid payload shapes should return a client error instead of mutating the
    database.
  - Reorder persistence must not change unrelated fields beyond stored order and
    any currently required concert-series alignment for the updated row.
  - Existing item-level `PUT /api/program/[id]` force-move behavior must remain
    intact.

## Technical design
### Architecture / modules impacted
- `src/routes/api/program/+server.ts` for the missing collection `POST` handler.
- `src/lib/server/db.ts` for any hardening needed around program-order updates.
- `src/test/api/program-api.test.ts` and possibly `src/test/db/program.test.ts`
  for regression coverage.

### API changes (if any)
- No new endpoint path. The existing `POST /api/program` route will be
  implemented to support the admin page’s current request body.

### UI/UX changes (if any)
- None intended unless minor error handling is required to align with the fixed
  API behavior.

### Data model / schema changes (PostgreSQL)
- Migrations: none.
- Backward compatibility: existing schema remains unchanged.
- Rollback: revert the route/test changes; no database rollback required.

## Security & privacy
- Keep the existing authorization behavior for same-origin admin requests.
- Validate the posted payload before updating persistence state.

## Observability (logs/metrics)
- No new logging required beyond explicit route-level error handling.

## Verification Commands
> Pin the exact commands discovered for this repo (also update `./codex/project-structure.md` and `./codex/codex-config.yaml`).

- Lint:
  - `npm run lint`
- Build:
  - `npm run build`
- Test:
  - `npm run test`

## Test strategy
- Unit: none expected unless a payload parser/helper is extracted.
- Integration: extend `src/test/api/program-api.test.ts` to cover
  `POST /api/program` reorder persistence.
- E2E / UI (if applicable): none.

## Acceptance criteria checklist
- [ ] `POST /api/program` no longer returns `405` for the admin reorder payload.
- [ ] Reordered entries persist updated `performance_order` values.
- [ ] Existing program export and force-move tests remain passing.
- [ ] Automated coverage fails before and passes after the reorder fix.
- [ ] `npm run lint`, `npm run build`, and `npm run test` pass.

## IN SCOPE
- `src/routes/api/program/+server.ts`
- `src/lib/server/db.ts` only if needed for safe order persistence
- `src/test/api/program-api.test.ts`
- `tasks/order-program-ondrag/*`
- `goals/order-program-ondrag/*`

## OUT OF SCOPE
- `src/routes/admin/program/+page.svelte` redesign or drag behavior changes
- Program export formatting or document generation changes
- Lottery placement algorithm changes
- Database schema migrations

## Goal lock assertion
- Locked goals source: `goals/order-program-ondrag/goals.v0.md`
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
- Worktree safety prep completed on a protected branch with uncommitted task and
  goals metadata present; do not revert unrelated changes.
- Canonical verification commands confirmed from `./.codex/project-structure.md`
  and `./.codex/codex-config.yaml`.

## Execution posture lock
- Simplicity bias: implement the smallest fix that restores reorder persistence.
- Surgical-change rule: constrain behavior changes to the program ordering save
  path and its tests.
- Fail-fast rule: reject invalid reorder payloads explicitly and preserve clear
  error reporting.

## Change control
- Scope expansion is not allowed after Stage 2.
- Changes to goals, constraints, success criteria, verification commands, or
  scope require explicit relock through the lifecycle.
- Override authority: the user must approve any scope or contract change.

## Existing-worktree safety prep
- Command: `./.codex/scripts/prepare-takeoff-worktree.sh order-program-ondrag main`
- Result: completed without merge conflicts.
- Notes:
  - Running on protected branch `main`.
  - Uncommitted entries were present for `.codex/codex-config.yaml`,
    `goals/task-manifest.csv`, `goals/order-program-ondrag/`, and
    `tasks/order-program-ondrag/`.

## Stage verdict
- READY FOR PLANNING

## Implementation phase strategy
- Complexity: 2
- Complexity scoring details: score=8; recommended-goals=4; guardrails-all-true=true; signals=/Users/eric/side-projects/concertprogram/tasks/order-program-ondrag/complexity-signals.json
- Active phases: 1..2
- No new scope introduced: required
