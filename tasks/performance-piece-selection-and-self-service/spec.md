# Performance Piece Selection and Self-Service

## Overview
Add performance-piece selection to scheduling and program output. The canonical association and selection are stored in `performance_pieces`, with an `is_performance_piece` flag enforcing a single selected piece per performance. When `features.performancePieceSelfService` is enabled, performers/families can manage associations and selection through a new API and must select a piece before scheduling. When disabled, selection is staff-managed and scheduling is not blocked; the schedule UI shows a non-blocking "not set" message if no selection exists. Schedule load must also backfill `adjudicated_pieces` from `performance_pieces` when missing.

## Goals
- Persist exactly one selected performance piece per performance.
- When self-service is enabled, require selection before schedule submission if multiple pieces exist.
- Display only the selected piece on `/schedule` and use only the selected piece for program output.
- Provide a performer/family-facing API for listing and (when enabled) managing performance pieces.
- Recover by backfilling `adjudicated_pieces` from `performance_pieces` during schedule load when empty.

## Non-goals
- Editing musical piece metadata via the new API.
- Implementing staff UI for selection (staff tooling is out of scope for this change).
- Repertoire-length validation, medleys, or multi-movement formatting changes.

## Use cases / user stories
- Single piece: if a performance has one associated piece, it is auto-selected and displayed.
- Multiple pieces + self-service on: performer/family must select before scheduling can be submitted.
- Multiple pieces + self-service off: staff selection is displayed; if missing, show a warning but do not block.
- Schedule/program output shows only the selected piece.
- Recovery: if `adjudicated_pieces` is empty when schedule loads, backfill from `performance_pieces`.

## Current behavior
- Notes:
  - `/schedule` displays a string aggregated from `adjudicated_pieces` and does not require selection.
  - Program output uses `adjudicated_pieces` and can include multiple pieces.
  - No "selected performance piece" exists.
- Key files:
  - `src/lib/server/db.ts` (lookupByPerformanceContext, queryMusicalPieceByPerformanceId)
  - `src/routes/schedule/+page.server.ts`
  - `src/routes/schedule/+page.svelte`
  - `src/lib/server/program.ts`
  - `database/init.sql`

## Proposed behavior
- Behavior changes:
  - `performance_pieces` becomes the source of truth for associations and selection.
  - Add `performance_pieces.is_performance_piece` and enforce single selection with a partial unique index.
  - Schedule load:
    - Backfill `adjudicated_pieces` from `performance_pieces` if a performance has zero adjudicated rows.
    - Auto-select a piece when exactly one is associated and none selected.
  - Self-service enabled:
    - `/api/performance/pieces` allows listing, association, disassociation, selection, and clear.
    - Schedule submission is blocked if multiple pieces exist and none selected.
    - Schedule UI shows selection controls and a clear option.
  - Self-service disabled:
    - Performer/family API is read-only; selection changes are rejected.
    - Schedule UI hides selection controls and shows a non-blocking "not set" warning when missing.
  - Program generation uses only the selected piece.
- Edge cases:
  - Selected piece removed: if one remains, auto-select; else clear selection.
  - No associated pieces: no selection UI; scheduling proceeds.
  - Concurrent writes: partial unique index enforces one selected per performance.

## Technical design
### Architecture / modules impacted
- `database/migrations/*` (add selection column + index)
- `database/init.sql` (schema baseline update)
- `src/lib/server/db.ts` (performance piece queries, selection helpers, backfill)
- `src/lib/server/common.ts` (extend PerformancePieceInterface)
- `src/lib/server/program.ts` (selected piece only)
- `src/routes/api/performance/pieces/+server.ts` (new API)
- `src/routes/schedule/+page.server.ts` (backfill + selection gating data)
- `src/routes/schedule/+page.svelte` (selection UI + warning)
- `src/lib/server/featureFlags.ts` (new config helper)

### API changes (if any)
- New routes:
  - `GET /api/performance/pieces?performance_id=...` (list pieces + selection state)
  - `POST /api/performance/pieces` (associate piece; self-service only)
  - `DELETE /api/performance/pieces` (disassociate piece; self-service only)
  - `POST /api/performance/pieces/select` (set selection; self-service only)
  - `POST /api/performance/pieces/clear` (clear selection; self-service only)
- Authorization:
  - Same-origin requests allowed; other origins require `Authorization` or session cookie.
  - When `features.performancePieceSelfService=false`, mutation endpoints return 403 for performer/family.

### UI/UX changes (if any)
- Schedule page shows selected piece only.
- When self-service enabled and multiple pieces exist, render selection UI and clear button.
- When self-service disabled and no selection exists, show a non-blocking "not set" message.

### Data model / schema changes (PostgreSQL)
- Migrations:
  - Add `performance_pieces.is_performance_piece BOOLEAN NOT NULL DEFAULT FALSE`.
  - Add partial unique index: `performance_pieces_one_selected_idx`.
  - Update `database/init.sql` with the new column + index.
- Backward compatibility:
  - Existing rows default to `FALSE`; auto-selection will set to `TRUE` when only one piece exists.
- Rollback:
  - Drop the partial unique index and the column if needed.

## Security & privacy
- Enforce mutation authorization and feature-flag checks to prevent unauthorized changes.
- Avoid exposing personal data beyond existing piece metadata.

## Observability (logs/metrics)
- Log warnings when staff-managed mode has no selected piece (non-blocking).
- Log backfill/auto-selection events at info/debug level if needed (optional).

## Verification Commands
> Pin the exact commands discovered for this repo (also update `./codex-commands.md`).

- Lint:
  - `npm run lint`
- Build:
  - `npm run build`
- Test:
  - `npm run test`

## Test strategy
- Unit:
  - DB helpers for selection auto-pick and backfill logic.
- Integration:
  - Schedule load backfills adjudicated pieces when empty.
  - Self-service gating on schedule submission when selection missing.
- E2E / UI (if applicable):
  - Manual QA for schedule selection UI and warning states.

## Acceptance criteria checklist
- [ ] Exactly one selected performance piece is used for schedule display and program output.
- [ ] If `adjudicated_pieces` has zero rows when `/schedule` loads, the system backfills it from `performance_pieces`.
- [ ] If a performance has exactly one associated piece, it is auto-selected and persisted.
- [ ] When `features.performancePieceSelfService=true`:
  - [ ] Performer/family must select a piece when >1; schedule submission is blocked until selection.
  - [ ] API allows POST (associate), DELETE (disassociate), and Clear/Select.
  - [ ] Schedule page shows selection UI and Clear button.
- [ ] When `features.performancePieceSelfService=false`:
  - [ ] Performer/family cannot select or modify associations.
  - [ ] Schedule page does not show selection UI or Clear button.
  - [ ] Scheduling flow is not blocked due to missing selection; warning is shown if none selected.
