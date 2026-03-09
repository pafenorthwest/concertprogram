# Goals Extract

- Task name: radio-select-piece
- Iteration: v2
- State: locked

## Goals (1-20, verifiable)

1. Update schedule-page load data so the scheduling context exposes the full candidate-piece set needed for same-performer, same-concert-series scheduling, including the Eastside multi-class case.
2. Render a radio-button performance-piece selector near the top of the schedule page whenever that scheduling context contains more than one candidate piece.
3. Require one radio option to be chosen before the performer can submit ranked or confirm-only schedule preferences.
4. Ensure the selected piece is the one shown as the performance piece on the schedule page after load and after a successful selection.
5. Preserve existing schedule behavior when there are zero or one candidate pieces, including not introducing an unnecessary selection step.
6. Add or update automated tests that prove the multi-piece scheduling context shows the selector and blocks submission until a piece is chosen.

## Non-goals (explicit exclusions)

- Adding new staff/admin tooling for performance-piece management.
- Changing unrelated schedule ranking, slot-validation, lookup authentication, or concert-series assignment behavior.

## Success criteria (objective checks)

> Tie each criterion to a goal number when possible.

- [G1][G2] For a performer with multiple candidate pieces in one schedule context, the schedule page load data and rendered UI include a radio-button selector populated with those pieces.
- [G3] Submitting the schedule form without selecting a piece in that multi-piece context fails with a validation error and does not persist schedule choices.
- [G4] After a valid selection, the chosen piece is the one displayed on the schedule page.
- [G5] When only zero or one candidate piece exists, the schedule page does not require an extra manual selection to submit.
- [G6] Automated tests cover the required selector-and-blocking behavior.
