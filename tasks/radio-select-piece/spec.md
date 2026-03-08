# Radio Select Piece

## Overview
Tighten the schedule flow for merged same-performer, same-concert-series
contexts so a performer must choose one performance piece before submitting
schedule preferences whenever multiple candidate pieces exist. This task is
limited to the scheduling flow and the minimal supporting server/data helpers
needed to supply that selection state.

## Goals
- Expose the full candidate-piece set for the merged schedule context used by
  `/schedule`, including the Eastside multi-class case.
- Render a radio-button selector near the top of the schedule page when that
  context has more than one candidate piece.
- Require one piece to be selected before ranked-choice or confirm-only
  scheduling can be submitted.
- Show the chosen piece as the displayed performance piece after load and after
  selection.
- Preserve current behavior when the schedule context has zero or one candidate
  piece.
- Add automated test coverage for selector rendering and submit blocking.

## Non-goals
- Adding new staff/admin tooling for performance-piece management.
- Changing unrelated slot ranking, lookup authentication, or concert-series
  assignment behavior.
- Reworking the broader performance-piece self-service API beyond what the
  schedule flow minimally needs.

## Use cases / user stories
- A performer with multiple winning classes in `Eastside` sees one merged
  schedule page and must choose one piece before submitting preferences.
- A performer with exactly one candidate piece can still schedule without any
  extra selection step.
- A performer with no candidate pieces does not encounter a new blocking step.

## Current behavior
- Notes:
  - `src/routes/schedule/+page.server.ts` loads piece-selection state from a
    single primary `performance_id`.
  - `src/routes/schedule/+page.svelte` already has a radio selector, but it is
    driven by the current page data for one performance context.
  - The merged lookup context for same performer + concert series + year is
    anchored by a primary performance in `src/lib/server/db.ts`.
- Key files:
  - `src/routes/schedule/+page.server.ts`
  - `src/routes/schedule/+page.svelte`
  - `src/lib/server/db.ts`
  - `src/lib/server/performerLookup.ts`
  - `src/test/api/schedule-page.test.ts`

## Proposed behavior
- Behavior changes:
  - `/schedule` loads the candidate-piece set for the merged scheduling
    context, not only the currently selected primary performance row.
  - When that merged context has more than one candidate piece, the page shows
    a radio selector near the top and blocks schedule submission until one
    choice is selected.
  - After selection, the chosen piece is the one displayed on the schedule
    page.
- Edge cases:
  - Zero candidate pieces: no additional selection UI requirement.
  - One candidate piece: no additional manual selection requirement.
  - Multiple candidate pieces: exactly one selection is required before submit.

## Technical design
### Architecture / modules impacted
- `src/routes/schedule/+page.server.ts`
- `src/routes/schedule/+page.svelte`
- `src/lib/server/db.ts`
- `src/lib/server/performerLookup.ts` if lookup payload changes are required
- `src/test/api/schedule-page.test.ts`
- Additional nearest-fit schedule/db tests under `src/test/` if needed

### API changes (if any)
- No new external API is planned in Stage 2.
- Existing schedule-supporting selection endpoints under
  `src/routes/api/performance/pieces/` may be reused if the current flow still
  fits the locked goals.

### UI/UX changes (if any)
- Show a piece radio group near the top of the schedule page when the merged
  schedule context has multiple candidate pieces.
- Disable successful form submission until one option is chosen.

### Data model / schema changes (PostgreSQL)
- Migrations: unknown at Stage 2; no schema change is assumed.
- Backward compatibility: preserve existing zero-piece and single-piece
  schedule behavior.
- Rollback: revert schedule flow and supporting helper changes if made.

## Security & privacy
- No new PII should be exposed.
- Reuse existing same-origin and authorization behavior for any schedule-piece
  selection calls already in the app.

## Observability (logs/metrics)
- No new logging is required by the locked goals.
- If debugging is needed later, keep any added logs limited to schedule-piece
  resolution paths and do not emit personal data.

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
  - Add helper-level coverage only if new piece-resolution logic is extracted.
- Integration:
  - Cover merged schedule-context piece loading and submit blocking.
- E2E / UI (if applicable):
  - Cover radio selector rendering and required-selection behavior on
    `/schedule`.

## Acceptance criteria checklist
- [ ] The merged schedule context exposes multiple candidate pieces for the
      Eastside multi-class case.
- [ ] The schedule page renders a radio-button selector when that merged
      context has more than one candidate piece.
- [ ] The schedule form rejects submission until one piece is selected in that
      multi-piece context.
- [ ] After selection, the chosen piece is the one displayed on the schedule
      page.
- [ ] Zero-piece and single-piece contexts do not gain an unnecessary blocking
      step.
- [ ] Automated tests cover the required selector-and-blocking behavior.

## IN SCOPE
- `src/routes/schedule/+page.server.ts`
- `src/routes/schedule/+page.svelte`
- Minimal supporting helper changes in `src/lib/server/db.ts` and related
  schedule lookup code
- Matching tests under `src/test/`

## OUT OF SCOPE
- New staff/admin piece-management UX
- Unrelated schedule ranking logic changes
- Non-schedule program-generation changes unless required by the locked goals

## Goal Lock Assertion
- Locked goals source: `goals/radio-select-piece/goals.v2.md`
- Goal state: locked
- Reinterpretation or expansion is not permitted without a new establish-goals
  iteration and explicit approval.

## Ambiguity Check
- Result: passed
- Blocking ambiguity remaining: none
- Non-blocking assumptions carried forward:
  - The merged schedule context is performer + concert series + year.
  - Existing zero-piece and single-piece behavior remains unchanged unless
    needed to satisfy a locked goal.

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
  - Current execution starts in an existing worktree; no worktree create/switch
    is allowed in Stage 2.

## Existing-Worktree Safety Prep
- Helper: `./.codex/scripts/prepare-takeoff-worktree.sh radio-select-piece`
- Result: completed successfully
- Summary:
  - Repository: `/Users/eric/.codex/worktrees/488d/concertprogram`
  - Branch: `(detached HEAD)`
  - Uncommitted entries observed by helper: `5`
  - Reported unresolved merge conflicts: none

## Execution Posture Lock
- Simplicity bias: downstream stages must prefer the smallest coherent change
  set that satisfies the locked goals.
- Surgical-change rule: downstream stages may touch only files required for the
  locked schedule-piece behavior and matching tests.
- Fail-fast rule: downstream stages must stop on contradictory data, missing
  preconditions, or verification failures rather than masking them.

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
- Complexity: scored:L3 (multi-surface)
- Complexity scoring details: score=12; recommended-goals=6; guardrails-all-true=true; signals=/Users/eric/.codex/worktrees/488d/concertprogram/tasks/radio-select-piece/complexity-signals.json
- Active phases: 1..6
- No new scope introduced: required
