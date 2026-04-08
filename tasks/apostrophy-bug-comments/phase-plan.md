# Phase Plan
- Task name: apostrophy-bug-comments
- Complexity: scored:L2 (focused)
- Phase count: 3
- Active phases: 1..3
- Verdict: READY TO LAND

## Constraints
- no code/config changes are allowed except approved implementation work under the locked task scope
- no new scope is allowed; scope drift is BLOCKED
- if the apostrophe issue cannot be reproduced, stop implementation and document the evidence instead of forcing a speculative fix

## Goal mapping
- Phase 1 maps to Goals 1 and 3 by reproducing the reported schedule comment failure and confirming the bounded file surface.
- Phase 2 maps to Goals 2, 3, and 5 by implementing the narrowest fix only if the apostrophe failure is verified.
- Phase 3 maps to Goals 4 and 5 by finalizing regression coverage and running full pinned verification.

## Planned phases
- Phase 1: reproduce the apostrophe submission failure in the current schedule comment path and record the exact failing surface.
- Phase 2: implement the localized escaping fix in the affected schedule comment persistence path and extend regression coverage.
- Phase 3: run full repo verification, update the final-phase ledger honestly, and confirm the task is ready to land.

## Complexity scoring details
- score=8; recommended-goals=4; guardrails-all-true=true; signals=/Users/eric/.codex/worktrees/fe54/concertprogram/tasks/apostrophy-bug-comments/complexity-signals.json
- Ranges: goals=3-5; phases=2-4
