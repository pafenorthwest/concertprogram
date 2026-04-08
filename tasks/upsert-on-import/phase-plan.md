# Phase Plan
- Task name: upsert-on-import
- Complexity: scored:L2 (focused)
- Phase count: 3
- Active phases: 1..3
- Verdict: BLOCKED

## Constraints
- no code/config changes are allowed except phase-plan document updates under ./tasks/*
- no new scope is allowed; scope drift is BLOCKED

## Complexity scoring details
- score=8; recommended-goals=4; guardrails-all-true=true; signals=/Users/eric/side-projects/concertprogram/tasks/upsert-on-import/complexity-signals.json
- Ranges: goals=3-5; phases=2-4

## Ordered phases
1. Phase 1 establishes the regression coverage for malformed-import recovery and
   confirms the current failure surface in the import DB tests.
2. Phase 2 changes the import logic so an existing matching performance row is
   reused as an update path and the corrected payload refreshes selected pieces.
3. Phase 3 runs targeted and full verification, records final evidence, and
   closes any remaining implementation notes without expanding scope.
