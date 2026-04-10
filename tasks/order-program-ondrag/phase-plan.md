# Phase Plan
- Task name: order-program-ondrag
- Complexity: 2
- Phase count: 2
- Active phases: 1..2
- Verdict: READY TO LAND

## Constraints
- no code/config changes are allowed except phase-plan document updates under ./tasks/*
- no new scope is allowed; scope drift is BLOCKED

## Complexity scoring details
- score=8; recommended-goals=4; guardrails-all-true=true; signals=/Users/eric/side-projects/concertprogram/tasks/order-program-ondrag/complexity-signals.json
- Ranges: goals=3-5; phases=2-4

## Ordered phases
1. Phase 1 captures the reorder persistence contract in tests and confirms the
   current failure surface of the missing collection `POST` handler.
2. Phase 2 implements the `POST /api/program` persistence path, runs targeted
   and full verification, and records closeout evidence without expanding
   scope.
