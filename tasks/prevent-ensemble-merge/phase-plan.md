# Phase Plan
- Task name: prevent-ensemble-merge
- Complexity: focused
- Phase count: 3
- Active phases: 1..3
- Verdict: BLOCKED

## Constraints
- no code/config changes are allowed except phase-plan document updates under ./tasks/*
- no new scope is allowed; scope drift is BLOCKED

## Complexity scoring details
- score=6; recommended-goals=4; guardrails-all-true=true; signals=/Users/eric/.codex/worktrees/3a2f/concertprogram/tasks/prevent-ensemble-merge/complexity-signals.json
- Ranges: goals=3-5; phases=2-4

## Ordered phases
1. Phase 1 adds regression coverage for the same-series ensemble-versus-solo
   merge case and pins the expected unmerged state.
2. Phase 2 updates the merge eligibility logic so `*EP` ensemble classes no
   longer merge with solo or concerto classes while preserving existing
   non-ensemble behavior.
3. Phase 3 runs targeted and full verification, records the outcomes, and
   closes the task artifacts without expanding scope.
