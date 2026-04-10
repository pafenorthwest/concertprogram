# Phase Plan
- Task name: restyle-admin-program-page-comments
- Complexity: focused
- Phase count: 3
- Active phases: 1..3
- Verdict: READY TO LAND

## Constraints
- no code/config changes are allowed except phase-plan document updates under ./tasks/*
- no new scope is allowed; scope drift is BLOCKED

## Complexity scoring details
- score=8; recommended-goals=4; guardrails-all-true=true; signals=/Users/eric/side-projects/concertprogram/tasks/restyle-admin-program-page-comments/complexity-signals.json
- Ranges: goals=3-5; phases=2-4

## Ordered phases
1. Phase 1 updates the admin program page structure and styling so the controls
   and table surface align with the review page visual language while removing
   the `Num in Series` column.
2. Phase 2 replaces inline comment text with enabled/disabled comment buttons
   and adds a dismissable full-comment popover without changing backend data
   flow.
3. Phase 3 runs full verification, records final evidence, and closes the task
   without expanding scope.
