# Phase Plan
- Task name: radio-select-piece
- Complexity: scored:L3 (multi-surface)
- Phase count: 6
- Active phases: 1..6
- Verdict: READY TO LAND

## Constraints
- no code/config changes are allowed except phase-plan document updates under ./tasks/*
- no new scope is allowed; scope drift is BLOCKED

## Complexity scoring details
- score=12; recommended-goals=6; guardrails-all-true=true; signals=/Users/eric/.codex/worktrees/488d/concertprogram/tasks/radio-select-piece/complexity-signals.json
- Ranges: goals=5-8; phases=4-6

## Phase sequence
- Phase 1: confirm and shape merged schedule-context piece data.
- Phase 2: update schedule load and submit validation for required selection.
- Phase 3: update the schedule UI radio workflow and blocking state.
- Phase 4: adjust selection persistence helpers/endpoints only as needed for the
  merged context.
- Phase 5: add automated coverage for selector rendering and blocked submit.
- Phase 6: run full verification, fix any task-local issues, and prepare
  implementation handoff.

## Planning notes
- All phases must stay within the locked `IN SCOPE` surface.
- No schema or public API contract change is planned.
- If merged-context selection cannot be satisfied with existing persistence
  helpers, stop and treat the scope or contract mismatch as a blocker.
