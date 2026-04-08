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
- Completed verification evidence for lint, build, and test, including explicit
  blocking notes for the failing full-suite tests.
- A truthful final-phase ledger ready for Stage 4 validation, even though the
  expected outcome is blocked on unrelated repo-wide test failures.

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
  - Expected: PASS when repo-wide tests are green; current run is blocked by
    unrelated failures in `src/test/db/import.test.ts` and
    `src/test/api/schedule-page.test.ts`.

## Risks and mitigations
- Risk: full verification may expose unrelated repo instability after the local
  fix is complete.
- Mitigation: document any blocker precisely and stop Stage 4 rather than
  overstating completion.
