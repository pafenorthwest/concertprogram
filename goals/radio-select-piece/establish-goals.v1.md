# establish-goals

## Status

- Iteration: v1
- State: ready-for-confirmation
- Task name (proposed, kebab-case): radio-select-piece

## Request restatement

- Explain the current schedule-page message `Performance piece has not been selected by staff yet. Scheduling can proceed.` because its intent is unclear in the merged multi-class scheduling flow.
- Update the schedule flow in `src/routes/schedule/+page.server.ts` and `src/routes/schedule/+page.svelte` so that when the scheduling context contains multiple candidate performance pieces, the performer must choose exactly one piece before submitting schedule preferences.
- Cover the example where one performer has multiple winning classes in the same concert series (`Eastside`), and the schedule page should show a radio-button selector at the top before submission.

## Context considered

- Repo/rules/skills consulted:
  - `AGENTS.md`
  - `/Users/eric/.codex/skills/acac/SKILL.md`
  - `/Users/eric/.codex/skills/establish-goals/SKILL.md`
- Relevant files (if any):
  - `src/routes/schedule/+page.server.ts`
  - `src/routes/schedule/+page.svelte`
  - `src/lib/server/db.ts`
  - `src/lib/server/performerLookup.ts`
  - `tasks/performance-piece-selection-and-self-service/spec.md`
  - `tasks/merged-performance-lookup/spec.md`
- Constraints (sandbox, commands, policy):
  - No source-code edits before goals are locked.
  - Establish-goals artifacts must be created and validated with the approved `.codex/scripts/*` helpers.
  - Verification later must use pinned repo commands: `npm run lint`, `npm run build`, and `npm run test`.

## Ambiguities

### Blocking (must resolve)

1. None at this stage.

### Non-blocking (can proceed with explicit assumptions)

1. The quoted warning currently means: no `performance_pieces.is_performance_piece` row is selected for the schedule context, so the page falls back to displaying the first piece and does not block scheduling.
2. This task should replace that non-blocking fallback for schedule contexts that expose more than one candidate piece.
3. The requirement applies to the merged performer/concert-series/year schedule context, not only to a single `performance_id`, so same-series multi-class winners are handled in one place.
4. No new admin/staff management UI is in scope; the schedule page behavior and supporting server logic are the focus.

## Questions for user

1. Do these drafted goals capture the intended rule that any schedule context with more than one candidate piece must require a performer choice before submit?
2. Should the current staff-warning fallback be removed for that case, so scheduling is blocked until a radio option is chosen?

## Assumptions (explicit; remove when confirmed)

1. Keep the existing schedule flow scope limited to `src/routes/schedule/+page.server.ts`, `src/routes/schedule/+page.svelte`, and any minimal supporting server/data helpers needed to supply the correct merged piece list and persisted selection state.
2. Preserve existing behavior when the schedule context has zero or one candidate piece: no extra radio choice is required.
3. The chosen radio option should become the only displayed performance piece on the schedule page for that scheduling context.

## Goals (1-20, verifiable)

1. Document the current meaning of `Performance piece has not been selected by staff yet. Scheduling can proceed.` in the schedule flow, grounded in the existing server/UI behavior.
2. Update schedule-page load data so the scheduling context exposes the full candidate-piece set needed for same-performer, same-concert-series scheduling, including the Eastside multi-class case.
3. Render a radio-button performance-piece selector near the top of the schedule page whenever that scheduling context contains more than one candidate piece.
4. Require one radio option to be chosen before the performer can submit ranked or confirm-only schedule preferences.
5. Ensure the selected piece is the one shown as the performance piece on the schedule page after load and after a successful selection.
6. Preserve existing schedule behavior when there are zero or one candidate pieces, including not introducing an unnecessary selection step.
7. Add or update automated tests that prove the multi-piece scheduling context shows the selector and blocks submission until a piece is chosen.

## Non-goals (explicit exclusions)

- Adding new staff/admin tooling for performance-piece management.
- Changing unrelated schedule ranking, slot-validation, lookup authentication, or concert-series assignment behavior.

## Success criteria (objective checks)

> Tie each criterion to a goal number when possible.

- [G1] The final handoff explains that the current warning is a staff-managed fallback shown when no selected performance piece exists and scheduling is still allowed.
- [G2][G3] For a performer with multiple candidate pieces in one schedule context, the schedule page load data and rendered UI include a radio-button selector populated with those pieces.
- [G4] Submitting the schedule form without selecting a piece in that multi-piece context fails with a validation error and does not persist schedule choices.
- [G5] After a valid selection, the chosen piece is the one displayed on the schedule page.
- [G6] When only zero or one candidate piece exists, the schedule page does not require an extra manual selection to submit.
- [G7] Automated tests cover the required selector-and-blocking behavior.

## Risks / tradeoffs

- The current code is centered on a single primary `performance_id`; satisfying the merged same-series requirement may require careful helper changes so piece selection remains consistent without breaking duration/comment updates.

## Next action

- Present goals for approval. On approval, lock goals and proceed to `prepare-takeoff`.
