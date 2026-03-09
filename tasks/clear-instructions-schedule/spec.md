# Clear Instructions Schedule

## Overview
Clarify the `/schedule` page so parents and teachers can complete the form
without guessing. The task is limited to clearer schedule-page copy,
step-by-step guidance, and an optional dismissible help affordance that stays
within the existing page.

## Goals
- Clearly label the concert information parents and teachers should review at
  the top of the page, including performer name, classes, performance piece,
  and lookup code.
- Add explicit instructions for selecting a performance piece when multiple
  options exist and explain the single-piece default case.
- Add explicit instructions for choosing preferred concert times, marking
  unavailable times, entering duration, and adding comments.
- Remind users that duration must not exceed 8 minutes and that they can
  return to edit the page later.
- Preserve the existing ranked-choice and confirm-only submission flows while
  improving clarity.
- Add or update automated tests that verify the revised instructional content
  and any dismissible help behavior that is added.

## Non-goals
- Changing schedule assignment rules, lookup authentication, or persistence.
- Adding new admin tooling or a multi-page tutorial flow.
- Refactoring unrelated schedule ranking or selection logic.

## Use cases / user stories
- A parent opening `/schedule` can understand the order of the form before
  entering any values.
- A teacher helping a student can quickly confirm the lookup code, performance
  piece, and required timing information from the page copy.
- A performer with multiple pieces can understand that they must select one
  piece before submitting, while a performer with one piece does not see an
  unnecessary step.

## Current behavior
- Notes:
  - `src/routes/schedule/+page.svelte` renders the current schedule form and
    already distinguishes ranked-choice and confirm-only modes.
  - The page shows the top scheduling facts, but the wording is terse and does
    not walk users through the form step by step.
  - Piece-selection and time-selection controls exist, but the surrounding
    instructional copy is minimal.
- Key files:
  - `src/routes/schedule/+page.svelte`
  - `src/test/api/schedule-page.test.ts`

## Proposed behavior
- Behavior changes:
  - The schedule page introduces a short step-by-step instruction block near
    the top of the form.
  - The top information area uses clearer labels for the information users
    should review before completing the form.
  - If implemented, a dismissible help panel or overlay summarizes the steps
    without changing the actual submission workflow.
- Edge cases:
  - Single-piece scheduling remains effectively preselected and should not gain
    a new blocking step.
  - Confirm-only mode should show guidance relevant to confirming attendance
    for the available concert.
  - Ranked-choice mode should explain preference ranking and unavailable times
    in plain language.

## Technical design
### Architecture / modules impacted
- `src/routes/schedule/+page.svelte`
- `src/test/api/schedule-page.test.ts`

### API changes (if any)
- None planned.

### UI/UX changes (if any)
- Rewrite schedule-page instructional copy for clarity and sequence.
- Group the instructions into a visible review-and-steps section.
- Optionally add a dismissible help panel or overlay if it remains page-local
  and non-blocking.

### Data model / schema changes (PostgreSQL)
- Migrations: none expected.
- Backward compatibility: preserve existing form submission and lookup
  behavior.
- Rollback: revert schedule-page copy/help changes and matching tests.

## Security & privacy
- No new PII or auth surface is introduced.
- Keep any help UI purely client-side and page-local.

## Observability (logs/metrics)
- No new logging or metrics are required.

## Verification Commands
> Pin the exact commands discovered for this repo (also update
> `./codex/project-structure.md` and `./codex/codex-config.yaml`).

- Lint:
  - `npm run lint`
- Build:
  - `npm run build`
- Test:
  - `npm run test`

## Test strategy
- Unit:
  - None expected unless page helper logic is extracted.
- Integration:
  - Keep route-level schedule page coverage for both multi-piece and
    single-flow behavior.
- E2E / UI (if applicable):
  - Verify the revised instructional copy renders on `/schedule`.
  - Verify any dismissible help control can be opened/read and dismissed.

## Acceptance criteria checklist
- [ ] The top section clearly labels the concert information users should
      review before filling out the form.
- [ ] The page explains piece selection clearly, including the multi-piece and
      single-piece cases.
- [ ] The page explains how to choose preferred concert times, mark
      unavailable times, provide duration, and add comments.
- [ ] The page states that performances are limited to 8 minutes and that the
      schedule page can be revisited later for edits.
- [ ] Ranked-choice and confirm-only submission behavior still works as before.
- [ ] Automated tests cover the revised copy and any added dismissible help.

## IN SCOPE
- `src/routes/schedule/+page.svelte`
- Matching route/UI tests in `src/test/api/schedule-page.test.ts`
- Task-planning artifacts under `tasks/clear-instructions-schedule/`

## OUT OF SCOPE
- `src/routes/schedule/+page.server.ts` unless implementation evidence shows a
  strictly necessary page-data tweak
- Database, migration, and persistence changes
- Admin pages, lookup flow changes, and unrelated scheduling behavior

## Goal Lock Assertion
- Locked goals source: `goals/clear-instructions-schedule/goals.v0.md`
- Goal state: locked
- Reinterpretation or expansion is not permitted without a new
  establish-goals iteration and explicit approval.

## Ambiguity Check
- Result: passed
- Blocking ambiguity remaining: none
- Non-blocking assumptions carried forward:
  - A dismissible help affordance may be implemented as an inline overlay or
    panel within `/schedule`.
  - Existing scheduling rules remain unchanged unless a minimal UI-only
    adjustment is required to support the clearer instructions.

## Governing Context
- Rules files:
  - `.codex/rules/expand-task-spec.rules`
  - `.codex/rules/git-safe.rules`
  - `AGENTS.md`
- Skills used:
  - `acac`
  - `establish-goals`
  - `prepare-takeoff`
- Sandbox / environment notes:
  - Filesystem sandbox: workspace-write
  - Network access: restricted
  - Current execution starts in an existing worktree with detached `HEAD`.

## Existing-Worktree Safety Prep
- Helper: `./.codex/scripts/prepare-takeoff-worktree.sh clear-instructions-schedule`
- Result: completed successfully
- Summary:
  - Repository: `/Users/eric/.codex/worktrees/b371/concertprogram`
  - Branch: `(detached HEAD)`
  - Uncommitted entries observed by helper: `4`
  - Reported unresolved merge conflicts: none

## Execution Posture Lock
- Simplicity bias: downstream stages must prefer the smallest coherent page
  and test changes that satisfy the locked goals.
- Surgical-change rule: downstream stages may touch only the schedule page,
  matching tests, and task artifacts unless new evidence requires a narrower
  supporting change.
- Fail-fast rule: downstream stages must stop on contradictory UI behavior,
  missing verification prerequisites, or scope drift.

## Change Control
- Goals, constraints, success criteria, and verification classes are frozen.
- Any scope change requires a new establish-goals iteration plus explicit user
  approval before planning or implementation continues.
- Verification may not be weakened, bypassed, or silently redefined.

## Drift Hard-Gate
- Enforce the Stage 2 drift policy from `AGENTS.md`.
- Stop immediately on unauthorized scope expansion, verification weakening, or
  progress-budget overrun.

## Readiness Verdict
- `READY FOR PLANNING`

## Implementation phase strategy
- Complexity: scored:L2 (focused)
- Complexity scoring details: score=8; recommended-goals=4; guardrails-all-true=true; signals=/Users/eric/.codex/worktrees/b371/concertprogram/tasks/clear-instructions-schedule/complexity-signals.json
- Active phases: 1..2
- No new scope introduced: required
