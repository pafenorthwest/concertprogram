# Phase Plan
- Task name: fix-forcemove-concert-list
- Complexity: scored:L2 (focused)
- Phase count: 3
- Active phases: 1..3
- Verdict: READY TO LAND

## Constraints
- no code/config changes are allowed except phase-plan document updates under ./tasks/*
- no new scope is allowed; scope drift is BLOCKED

## Complexity scoring details
- score=8; recommended-goals=4; guardrails-all-true=true; signals=/Users/eric/pafenorthwest/concertprogram/tasks/fix-forcemove-concert-list/complexity-signals.json
- Ranges: goals=3-5; phases=2-4

## Planned phases

### Phase 1
- Objective: Confirm the current force-move contract and implement the minimal server route/helper needed to accept and validate move requests.
- Goals mapped: G1, G2, G3
- Surfaces:
  - `src/routes/api/program/`
  - `src/lib/server/db.ts`
- Deliverable:
  - Working force-move endpoint contract with explicit invalid-request handling.

### Phase 2
- Objective: Persist the selected destination so program rebuilds reflect Eastside and waitlist moves correctly.
- Goals mapped: G2, G3
- Surfaces:
  - `src/lib/server/db.ts`
  - Any directly related server-side program route/helper code required by Phase 1
- Deliverable:
  - Minimal persistence logic for Eastside concert-number and waitlist reassignment.

### Phase 3
- Objective: Add regression coverage and run full verification for the changed workflow.
- Goals mapped: G4
- Surfaces:
  - `src/test/api/program-api.test.ts`
  - `src/test/db/program.test.ts`
  - `tasks/fix-forcemove-concert-list/final-phase.md`
- Deliverable:
  - Passing move regression tests plus recorded lint/build/test outcomes.
