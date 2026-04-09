# Phase 3 — Verification And Closeout

## Objective
Run the pinned repository verification commands, capture truthful evidence in
task artifacts, and leave the task ready for landing if all checks pass.

## Code areas impacted
- `tasks/repair-program-button/final-phase.md`
- `tasks/repair-program-button/phase-plan.md`
- `tasks/repair-program-button/phase-1.md`
- `tasks/repair-program-button/phase-2.md`
- `tasks/repair-program-button/phase-3.md`

## Work items
- [x] Run full `lint`, `build`, and `test` verification.
- [x] Record verification results and any residual issues in `final-phase.md`.
- [x] Ensure phase gates and task artifacts reflect the completed evidence.

## Deliverables
- Completed verification evidence in task artifacts.
- A truthful implementation verdict suitable for landing or blocking.

## Gate (must pass before proceeding)
Define objective pass/fail criteria.
- [ ] `lint`, `build`, and `test` pass and the task artifacts reflect the real
      outcomes.

## Gate evidence
- [x] `npm run lint` PASS
- [x] `npm run build` PASS
- [x] `npm run test` PASS
- [x] Task artifacts updated with root cause, regression coverage, and
      closeout evidence

## Verification steps
List exact commands and expected results.
- [ ] Command: `npm run lint`
  - Expected: PASS
- [ ] Command: `npm run build`
  - Expected: PASS
- [ ] Command: `npm run test`
  - Expected: PASS

## Risks and mitigations
- Risk: unrelated pre-existing failures could block closeout after the export
  repair is complete.
- Mitigation: separate targeted regression evidence from full-suite results and
  document any blocker explicitly if it appears.
