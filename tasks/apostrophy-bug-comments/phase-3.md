# Phase 3 — Full Verification and Closeout

## Objective
Run the pinned repository verification commands, update the final-phase ledger
truthfully, and confirm the task is ready to land.

## Code areas impacted
- `tasks/apostrophy-bug-comments/final-phase.md`
- `tasks/apostrophy-bug-comments/phase-plan.md`
- task-scoped implementation files already changed in earlier phases

## Work items
- [x] Run `npm run lint`, `npm run build`, and `npm run test`.
- [x] Update `final-phase.md` with explicit verification outcomes, evaluated
      checklist items, and any remaining issues or explicit none markers.
- [x] Confirm no goal, scope, or verification drift was introduced during
      implementation.

## Deliverables
- Completed verification evidence for lint, build, and test with the full
  pinned suite passing on the branch.
- A truthful final-phase ledger ready for Stage 4 validation and landing.

## Gate (must pass before proceeding)
Phase 3 passes only if the pinned verification commands succeed and the task
artifacts accurately reflect the resulting code state.
- [x] `final-phase.md` records explicit outcomes for the required verification
      commands.
- [x] No unresolved actionable issue remains undocumented.
- [x] The task remains within locked goals and scope.

## Verification steps
- [x] Command: `npm run lint`
  - Expected: PASS
- [x] Command: `npm run build`
  - Expected: PASS
- [x] Command: `npm run test`
  - Expected: PASS

## Risks and mitigations
- Risk: full verification may expose unrelated repo instability after the local
  fix is complete.
- Mitigation: rerun the pinned commands and stop immediately if any branch-wide
  regression reappears.
