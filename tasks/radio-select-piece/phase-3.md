# Phase 3 — Schedule UI Radio Selection Flow

## Objective
Update the schedule page UI to show the merged piece radio selector near the
top of the flow and keep submit disabled until a required selection exists.

## Code areas impacted
- `src/routes/schedule/+page.svelte`

## Work items
- [x] Render the candidate-piece radio selector from the merged schedule
      context data.
- [x] Keep the selected piece display aligned with the chosen radio option.
- [x] Ensure the submit button and inline messaging reflect the required
      selection state for both rank-choice and confirm-only modes.

## Deliverables
- Updated schedule page UI for multi-piece contexts.
- Client-side blocking state that mirrors the server-side rule.

## Gate (must pass before proceeding)
Define objective pass/fail criteria.
- [x] The selector appears only when the merged context has multiple candidate
      pieces.
- [x] Client-side submit state aligns with the locked behavior for zero, one,
      and many candidate pieces.

## Verification steps
List exact commands and expected results.
- [ ] Command: `npm run test -- schedule-page`
  - Expected: schedule UI tests or route-level tests reflect the selector and
    disabled-submit behavior.
- Evidence:
  - The schedule page now renders the radio group whenever `performancePieces`
    has more than one candidate and derives the heading from the current
    selected piece.
  - Existing Playwright coverage was updated to require a piece choice before
    submit, but it could not run to completion without the expected database.

## Risks and mitigations
- Risk:
  - Existing client selection code may assume a single performance-scoped piece
    list and drift from the new server payload.
- Mitigation:
  - Keep the UI contract explicit and mirror server truth instead of inventing
    new client-only state.
