# Phase Plan
- Task name: first-gen-program
- Complexity: scored:L2 (focused)
- Phase count: 2
- Active phases: 1..2
- Verdict: READY TO LAND

## Constraints
- no code/config changes are allowed except phase-plan document updates under ./tasks/*
- no new scope is allowed; scope drift is BLOCKED

## Complexity scoring details
- score=8; recommended-goals=4; guardrails-all-true=true; signals=/Users/eric/.codex/worktrees/38c1/concertprogram/tasks/first-gen-program/complexity-signals.json
- Ranges: goals=3-5; phases=2-4

## Execution order
- Phase 1 builds the export-side document generation path and the data shaping
  needed for single-concert Word output.
- Phase 2 wires the admin UI to the new export path, applies the disabled
  state rules, and adds/updates automated tests plus full verification.

## Drift checks
- Stay within the scope lock captured in
  `tasks/first-gen-program/.scope-lock.md`.
- Do not add database, placement, or unrelated admin behavior changes.
- Do not weaken `npm run lint`, `npm run build`, or `npm run test`.
