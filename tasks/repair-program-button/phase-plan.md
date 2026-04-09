# Phase Plan
- Task name: repair-program-button
- Complexity: scored:L2 (focused)
- Phase count: 3
- Active phases: 1..3
- Verdict: READY TO LAND

## Constraints
- no code/config changes are allowed except phase-plan document updates under ./tasks/*
- no new scope is allowed; scope drift is BLOCKED

## Complexity scoring details
- score=8; recommended-goals=4; guardrails-all-true=true; signals=/Users/eric/pafenorthwest/concertprogram/tasks/repair-program-button/complexity-signals.json
- Ranges: goals=3-5; phases=2-4

## Phase summary
- Phase 1: Reproduce the broken export path, inspect the `first-gen-program`
  implementation, and identify the concrete regression cause.
- Phase 2: Apply the minimum code fix in the admin export surface and add or
  update targeted regression coverage.
- Phase 3: Run full verification, record evidence in task artifacts, and
  prepare landing-ready closeout details.
