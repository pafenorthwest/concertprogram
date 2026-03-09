# Phase 1 — Clarify Schedule Page Instructions

## Objective
Rewrite the `/schedule` page copy so parents and teachers can follow the form
step by step, and add a local dismissible help affordance if it improves
clarity without altering the scheduling flow.

## Code areas impacted
- `src/routes/schedule/+page.svelte`

## Work items
- [x] Add a clear review section at the top that labels performer name,
      classes, performance piece, and lookup code.
- [x] Add step-by-step guidance covering piece selection, concert-time
      preferences, duration, comments, and the note that the page can be
      revisited later.
- [x] Add a dismissible help panel or overlay only if it fits within the
      current page and remains non-blocking.
- [x] Keep ranked-choice and confirm-only behavior unchanged.

## Deliverables
- Updated `/schedule` instructional copy and labels.
- Optional dismissible help UI implemented in-page if it improves clarity.

## Gate (must pass before proceeding)
Define objective pass/fail criteria.
- [x] The page copy clearly reflects the locked step-by-step guidance.
- [x] No new server/data flow or schedule-rule changes are introduced.

## Verification steps
List exact commands and expected results.
- [x] Command: `npm run test -- src/test/api/schedule-page.test.ts`
  - Expected: existing schedule page tests still pass or reveal only the
    expected copy/assertion updates needed for Phase 2.
  - Actual: passed after Phase 2 updated the route assertions and verification
    was rerun against the local dev server and PostgreSQL instance from `.env`.

## Risks and mitigations
- Risk: Extra explanatory copy makes the page visually noisy.
- Mitigation: Keep instructions grouped and concise, and use dismissible help
  only when it materially improves scanability.
