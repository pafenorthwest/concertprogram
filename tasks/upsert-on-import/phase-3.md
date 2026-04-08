# Phase 3 — Full Verification And Closeout Readiness

## Objective
Run the scoped regression suite and the required repo-wide verification commands,
then record the resulting evidence for Stage 4 completion without expanding the
task surface.

## Code areas impacted
- `src/test/db/import.test.ts`
- `tasks/upsert-on-import/final-phase.md`
- Any scoped source files changed in Phases 1-2 only if a final follow-up fix is
  required to satisfy verification

## Work items
- [x] Re-run the targeted import DB suite after the implementation settles.
- [ ] Run `npm run lint`, `npm run build`, and `npm run test` EVALUATED:
      blocked by unrelated repo verification failures outside this task's code
      changes.
- [x] Record verification outcomes and any residual issues in
      `tasks/upsert-on-import/final-phase.md`.

## Deliverables
- Full verification evidence suitable for `implement-validate.sh`.
- Final-phase notes updated with pass/fail outcomes and any exceptions.
- Evidence: targeted import DB tests passed, build passed, and full verification
  blockers were narrowed to unrelated lint/test failures.

## Gate (must pass before proceeding)
Define objective pass/fail criteria.
- [x] Targeted import regression coverage passes.
- [x] Full repo verification blockers are documented precisely, so Stage 4 can
      stop truthfully as `BLOCKED`.

## Verification steps
List exact commands and expected results.
- [x] Command: `npm run test -- src/test/db/import.test.ts`
  - Expected: targeted import DB coverage passes.
- [ ] Command: `npm run lint`
  - Expected: pass.
  - Actual: blocked by unrelated formatting issue in
    `goals/compat-import-test/goals.v0.md`.
- [x] Command: `npm run build`
  - Expected: pass.
- [ ] Command: `npm run test`
  - Expected: pass.
  - Actual: blocked by unrelated timeout in
    `src/test/api/schedule-page.test.ts > Rank-choice variants > supports
    rank-choice with two slots and partial rankings` during the full suite, even
    with the dev server running.

## Risks and mitigations
- Risk: unrelated existing failures in the full suite could block landing after
  the task-specific behavior is fixed.
- Mitigation: record blockers precisely if they occur and stop at Stage 4 rather
  than weakening verification.
