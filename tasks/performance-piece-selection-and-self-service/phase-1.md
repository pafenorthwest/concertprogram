# Phase 1 — Schema, Flags, and DB Helpers

## Objective
Introduce the schema change for selecting a performance piece, add feature-flag plumbing, and implement DB helpers for selection/backfill/auto-selection.

## Code areas impacted
- `database/migrations/*`
- `database/init.sql`
- `src/lib/server/common.ts`
- `src/lib/server/db.ts`
- `src/lib/server/featureFlags.ts`

## Work items
- [ ] Add migration for `performance_pieces.is_performance_piece` and partial unique index.
- [ ] Update `database/init.sql` with the new column + index.
- [ ] Extend `PerformancePieceInterface` to include `is_performance_piece`.
- [ ] Add `performancePieceSelfService` feature flag helper.
- [ ] Implement DB helpers for:
  - backfilling `adjudicated_pieces` when empty
  - auto-selecting the only piece
  - fetching selection state + piece details

## Deliverables
- Migration file under `database/migrations/`
- Updated schema baseline in `database/init.sql`
- DB helper functions + feature flag module

## Gate (must pass before proceeding)
- [ ] Migration and schema updates are in place.
- [ ] DB helpers compile with TypeScript and lint passes.

## Verification steps
- [ ] Command: `npm run lint`
  - Expected: completes with no errors.

## Risks and mitigations
- Risk: Migration adds column but selection state remains unset for existing rows.
- Mitigation: Auto-select helper will set the only piece to selected on access.
