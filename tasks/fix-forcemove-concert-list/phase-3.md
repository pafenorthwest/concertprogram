# Phase 3 — Regression Coverage And Verification

## Objective

Prove the new force-move workflow with regression tests and complete the required lint/build/test verification.

## Code areas impacted
- `src/test/api/program-api.test.ts`
- `src/test/db/program.test.ts`
- `tasks/fix-forcemove-concert-list/final-phase.md`

## Work items
- [x] Add coverage for a valid move into an Eastside concert.
- [x] Add coverage for a valid move into the waitlist.
- [x] Run and record `npm run lint`, `npm run build`, and `npm run test`.

## Deliverables
- Regression tests and final verification evidence covering the force-move workflow.

## Gate (must pass before proceeding)
The changed workflow is covered by automated tests and the repository verification commands pass.
- [x] Eastside move regression added.
- [x] Waitlist move regression added.
- [x] Full verification recorded.

## Verification steps
- [x] Command: `npm run test`
  - Expected: updated regression coverage passes
- [x] Command: `npm run lint`
  - Expected: PASS
- [x] Command: `npm run build`
  - Expected: PASS

## Risks and mitigations
- Risk: tests could validate implementation details instead of persisted behavior.
- Mitigation: assert the rebuilt program placement and endpoint behavior rather than internal incidental state.
