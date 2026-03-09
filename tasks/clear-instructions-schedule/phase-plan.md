# Phase Plan
- Task name: clear-instructions-schedule
- Complexity: scored:L2 (focused)
- Phase count: 2
- Active phases: 1..2
- Verdict: READY TO LAND

## Constraints
- no code/config changes are allowed except approved task work inside the
  locked scope
- no new scope is allowed; scope drift is BLOCKED

## Complexity scoring details
- score=8; recommended-goals=4; guardrails-all-true=true;
  signals=/Users/eric/.codex/worktrees/b371/concertprogram/tasks/clear-instructions-schedule/complexity-signals.json
- Ranges: goals=3-5; phases=2-4

## Phase order
1. Update the `/schedule` page copy and local help UI so the form is easier to
   understand without changing scheduling rules.
2. Extend schedule-page tests to prove the new guidance/help behavior and run
   full repo verification (`lint`, `build`, `test`).

## Scope lock confirmation
- `.scope-lock.md` is the no-new-scope source of truth for Stage 3 and Stage 4.
- Any change beyond `src/routes/schedule/+page.svelte`,
  `src/test/api/schedule-page.test.ts`, or a strictly necessary adjacent file
  requires a stop and re-evaluation.
