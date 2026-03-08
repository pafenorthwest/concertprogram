# Phase 2 — Schedule Server Load And Submission Gating

## Objective
Implement the server-side schedule flow changes so `/schedule` exposes the
merged candidate-piece set and rejects form submission when multiple candidates
exist and no piece has been chosen.

## Code areas impacted
- `src/routes/schedule/+page.server.ts`
- `src/lib/server/db.ts`
- `src/lib/server/performerLookup.ts` if needed for merged context data

## Work items
- [x] Update schedule load data to include the merged candidate-piece list and
      current selection state.
- [x] Update server-side submission validation so ranked-choice and confirm-only
      posts fail when the merged context has multiple pieces and none is
      selected.
- [x] Preserve zero-piece and single-piece behavior.

## Deliverables
- Updated server-side schedule data contract for the page.
- Server-side enforcement of the required-selection rule.

## Gate (must pass before proceeding)
Define objective pass/fail criteria.
- [x] The load function returns the data the UI needs for merged multi-piece
      contexts.
- [x] The action rejects unselected multi-piece submissions without affecting
      simpler contexts.

## Verification steps
List exact commands and expected results.
- [ ] Command: `npm run test -- schedule-page`
  - Expected: targeted schedule tests pass or fail only on the server changes
    being introduced.
- Evidence:
  - The schedule load/action path now keys required selection solely off piece
    count and stored selected state, without the prior self-service gate.
  - Targeted route tests were attempted, but execution is blocked by the
    missing PostgreSQL database in this environment.

## Risks and mitigations
- Risk:
  - Submission validation may still be tied too tightly to a single
    `performance_id`.
- Mitigation:
  - Centralize the merged-context selection check in the minimal helper surface
    needed by the schedule action.
