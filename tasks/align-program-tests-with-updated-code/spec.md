# Align Program Tests With Updated Code

## Overview

Review the change set between `713be81eafb54abbc7c45cc3b7a15ab2095691ab` and `HEAD`, then update the two failing tests so they reflect the current scheduling and DOCX export behavior without changing unrelated code paths.

## Goals

1. Review the diff between `713be81eafb54abbc7c45cc3b7a15ab2095691ab` and `HEAD` for actionable issues introduced by the change.
2. Update `src/test/lib/programDocx.test.ts` to assert the current DOCX performer-line output.
3. Update `src/test/db/program.test.ts` to assert overflow placement for only the fixtures it creates.
4. Verify the targeted tests pass after the updates.
5. Run the repo’s pinned `lint`, `build`, and `test` commands and record the outcomes.

## Non-goals

- Changing the DOCX export implementation unless the review finds the code is incorrect.
- Reworking the scheduling algorithm beyond what is required to align stale assertions with current behavior.
- Changing the admin program page UI or API behavior.

## Use cases / user stories

- As a maintainer, I can trust that the review identifies any real regression in the small diff.
- As a maintainer, I have passing regression tests that match the current DOCX formatting.
- As a maintainer, I have a scheduling integration test that is stable even when seeded rows already exist for the active year.

## Current behavior
- Notes:
  - `src/lib/server/programDocx.ts` now renders performer lines as bold performer name followed by ` (age), instrument`.
  - The admin program page now presents the performer column in the same `Performer (Age), Instrument` format and no longer renders a separate age column.
  - The failing scheduling test currently assumes the full second Eastside concert contains only the fixtures it inserts, which is not valid when existing program rows for the active year are present.
- Key files:
  - `src/lib/server/programDocx.ts`
  - `src/routes/admin/program/+page.svelte`
  - `src/lib/server/program.ts`
  - `src/test/lib/programDocx.test.ts`
  - `src/test/db/program.test.ts`

## Proposed behavior
- Behavior changes:
  - No production behavior change is planned.
  - Update the DOCX test to assert the new performer-line text fragments.
  - Update the scheduling test to track created performance IDs and verify their placements directly.
- Edge cases:
  - The scheduling assertion must tolerate unrelated seeded rows in Eastside concerts.
  - The DOCX assertion should continue to prove the performer name, age, and instrument are rendered in the expected order.

## Technical design
### Architecture / modules impacted
- `src/test/lib/programDocx.test.ts`
- `src/test/db/program.test.ts`
- `tasks/align-program-tests-with-updated-code/`

### API changes (if any)

- None.

### UI/UX changes (if any)

- None.

### Data model / schema changes (PostgreSQL)
- Migrations:
  - None.
- Backward compatibility:
  - Existing code behavior remains unchanged; only tests and task artifacts are updated.
- Rollback:
  - Revert the test assertions if the reviewed change is later reverted.

## Security & privacy

No auth, data exposure, or secret-handling behavior changes are in scope.

## Observability (logs/metrics)

No logging or metrics changes are planned.

## Verification Commands
> Pin the exact commands discovered for this repo (also update `./codex/project-structure.md` and `./codex/codex-config.yaml`).

- Lint:
  - `npm run lint`
- Build:
  - `npm run build`
- Test:
  - `npm run test`

## Test strategy
- Unit:
  - Update the DOCX unit test assertions to the new text shape.
- Integration:
  - Update the program scheduling test to verify placements of its own inserted performers.
- E2E / UI (if applicable):
  - None planned.

## Acceptance criteria checklist
- [ ] The review concludes with exact findings or an explicit “patch is correct” verdict.
- [ ] `src/test/lib/programDocx.test.ts` matches the current DOCX performer-line format.
- [ ] `src/test/db/program.test.ts` validates imported fixture placement without depending on unrelated seeded data.
- [ ] The targeted failing tests pass.
- [ ] `npm run lint`, `npm run build`, and `npm run test` outcomes are recorded.

## IN SCOPE
- Reviewing the two-file diff between `713be81eafb54abbc7c45cc3b7a15ab2095691ab` and `HEAD`
- Updating the two failing tests
- Running and recording verification commands
- Required lifecycle task artifact updates

## OUT OF SCOPE
- Production logic changes unless required by a review finding
- UI or API changes beyond the already-reviewed diff
- Database schema changes

## Goal Lock Assertion

- Locked goals source: `goals/align-program-tests-with-updated-code/goals.v0.md`
- Locked state confirmed: no reinterpretation or expansion is permitted downstream.

## Ambiguity Check

- Result: passed
- Remaining ambiguity: none blocking Stage 2.

## Governing Context

- Rules:
  - `.codex/rules/expand-task-spec.rules`
  - `.codex/rules/git-safe.rules`
- Skills:
  - `code-review`
  - `establish-goals`
  - `prepare-takeoff`
  - `prepare-phased-impl`
  - `implement`
- Sandbox:
  - `workspace-write`
  - network restricted

## Execution Posture Lock

- Simplicity bias locked for downstream stages.
- Surgical-change discipline locked for downstream stages.
- Fail-fast error handling locked for downstream stages.

## Change Control

- Goal, constraint, and scope changes are not allowed after lock without explicit user approval and lifecycle re-entry as required.

## Readiness Verdict

- READY FOR PLANNING

## Implementation phase strategy
- Complexity: surgical
- Complexity scoring details: score=0; recommended-goals=1; guardrails-all-true=true; signals=/Users/eric/side-projects/concertprogram/tasks/align-program-tests-with-updated-code/complexity-signals.json
- Active phases: 1..1
- No new scope introduced: required
