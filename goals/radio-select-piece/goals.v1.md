# Goals Extract

- Task name: radio-select-piece
- Iteration: v1
- State: ready-for-confirmation

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
