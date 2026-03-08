# Phase 1 — Merged Piece Context Audit And Data Plan

## Objective
Define the exact merged schedule-context data shape needed to represent
candidate performance pieces across same-performer, same-series wins without
changing scope or contracts unnecessarily.

## Code areas impacted
- `src/lib/server/db.ts`
- `src/lib/server/performerLookup.ts`
- `src/routes/schedule/+page.server.ts`

## Work items
- [x] Trace how the current primary `performance_id` is chosen for merged lookup
      contexts.
- [x] Identify the minimal helper/query changes needed to surface all candidate
      pieces for the merged schedule context.
- [x] Confirm whether existing selection helpers can still persist the chosen
      piece without widening scope.

## Deliverables
- A bounded data-shape decision for merged candidate-piece loading.
- A confirmed list of server-side helpers/routes that must change in later
  phases.

## Gate (must pass before proceeding)
Define objective pass/fail criteria.
- [x] The merged schedule-context data requirements are explicit and still fit
      inside the locked scope.
- [x] Any need for schema or contract expansion is either ruled out or raised
      as a blocker before implementation proceeds.

## Verification steps
List exact commands and expected results.
- [ ] Command: `rg -n "performance_id|winner_class_display|performance_piece" src/lib/server src/routes/schedule`
  - Expected: confirms the current merged-lookup and piece-selection touch
    points to inform later phases.
- Evidence:
  - The same-series merge already materializes candidate `performance_pieces`
    on the primary performance row via `mergePerformancePiecesForPerformerSeries`.
  - No schema or new cross-performance aggregation contract was required.

## Risks and mitigations
- Risk:
  - The merged schedule context may not map cleanly onto the current
    single-performance selection helpers.
- Mitigation:
  - Stop and surface the mismatch before changing persistence behavior.
