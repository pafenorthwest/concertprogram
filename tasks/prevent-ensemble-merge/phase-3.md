# Phase 3 — Verification And Closeout Readiness

## Objective
Run targeted and repo-wide verification, then record the evidence in the task
artifacts so Stage 4 can truthfully declare the work ready to land or blocked.

## Code areas impacted
- `src/test/db/lookupByCode-multi-class.test.ts`
- `tasks/prevent-ensemble-merge/final-phase.md`
- Any scoped source file changed in Phase 2 only if a final verification follow-up
  is required

## Work items
- [x] Re-run the targeted DB suite after implementation settles.
- [ ] Run `npm run lint`, `npm run build`, and `npm run test` EVALUATED:
      blocked because `npm run lint` and `npm run build` passed, but the full
      `npm run test` suite still fails on unrelated existing issues outside this
      task's scoped change.
- [x] Record the verification outcomes and any remaining issues in
      `tasks/prevent-ensemble-merge/final-phase.md`.

## Deliverables
- Final verification evidence for targeted and full-suite checks.
- Updated `final-phase.md` checklist and outstanding-issues notes.
- A truthful Stage 4 handoff record for `implement-validate.sh`, including the
  full-suite blocker details.

## Gate (must pass before proceeding)
Define objective pass/fail criteria.
- [x] Targeted ensemble merge regression coverage passes.
- [x] Full repo verification outcomes are recorded precisely in
      `final-phase.md`.

## Verification steps
List exact commands and expected results.
- [x] Command: `set -a; source /Users/eric/side-projects/concertprogram/.env; set +a; npm run test -- src/test/db/lookupByCode-multi-class.test.ts`
  - Expected: targeted DB coverage passes.
  - Actual: pass.
- [x] Command: `npm run lint`
  - Expected: pass.
  - Actual: pass.
- [x] Command: `set -a; source /Users/eric/side-projects/concertprogram/.env; set +a; npm run build`
  - Expected: pass.
  - Actual: pass.
- [ ] Command: `set -a; source /Users/eric/side-projects/concertprogram/.env; set +a; npm run test` EVALUATED:
      blocked by unrelated existing full-suite failures in
      `src/test/db/import.test.ts` and multiple API suites timing out at the
      default 5s timeout.
  - Expected: pass.
  - Actual: blocked by unrelated suite failures.

## Risks and mitigations
- Risk: unrelated repo verification failures could block Stage 4 after the task
  logic is fixed.
- Mitigation: record any blocker precisely and stop truthfully instead of
  weakening verification requirements.
