# Phase 2 — Test Coverage and Verification

## Objective
Update automated schedule-page coverage for the clearer instructions/help UI
and finish Stage 4 with passing lint, build, and test verification.

## Code areas impacted
- `src/test/api/schedule-page.test.ts`
- `src/routes/schedule/+page.svelte` for any minimal follow-up fixes revealed
  by test runs

## Work items
- [x] Update schedule-page tests to assert the new instructional content.
- [x] Add coverage for dismissing help UI if that affordance is implemented.
- [x] Run pinned `lint`, `build`, and `test` commands and address any
      task-related failures.

## Deliverables
- Updated automated schedule-page tests.
- Recorded verification results for lint, build, and test.

## Gate (must pass before proceeding)
Define objective pass/fail criteria.
- [x] Tests assert the locked instructional behavior.
- [x] Full verification passes without weakening checks.

## Verification steps
List exact commands and expected results.
- [x] Command: `npm run lint`
  - Expected: passes.
  - Actual: passed.
- [x] Command: `npm run build`
  - Expected: passes.
  - Actual: passed with existing SvelteKit/Svelte export warnings and optional
    dependency warnings while using `.env`.
- [x] Command: `npm run test`
  - Expected: passes.
  - Actual: passed with 20 test files and 119 tests while using `.env` and a
    local dev server on port 8888.

## Risks and mitigations
- Risk: Existing schedule-page tests may depend on exact legacy strings.
- Mitigation: Update assertions narrowly to the new wording and keep behavior
  assertions intact.
