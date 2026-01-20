# Phase 2 — Unified Lookup + Merge Implementation

## Objective
Implement unified lookup logic and merge performance pieces into the primary performance on import.

## Code areas impacted
- `src/lib/server/db.ts`
- `src/lib/server/import.ts`

## Work items
- [ ] Add DB helpers for:
  - locating performer/series/year context from a lookup code/details.
  - determining primary performance by lowest `class_lottery.lottery`.
  - aggregating class names + musical pieces for lookup results.
- [ ] Implement merge helper that upserts `adjudicated_pieces` into the primary performance.
- [ ] Call merge helper after each performance import/update.

## Deliverables
- Unified lookup functions returning primary class code and merged piece list.
- Import pipeline that recomputes merged pieces on each relevant import.

## Gate (must pass before proceeding)
- [ ] Lookup returns primary code and merged pieces for same-series multi-class performers.
- [ ] Merge helper is idempotent across repeated imports.

## Verification steps
- [ ] Command: `npm run test`
  - Expected: tests pass or failures are documented as blockers.

## Risks and mitigations
- Risk: Merging overwrites movement data when the same piece appears in multiple classes.
- Mitigation: Use conflict handling that preserves existing movement when present.
