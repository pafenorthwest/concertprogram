# establish-goals

## Status

- Iteration: v0
- State: locked
- Task name (proposed, kebab-case): clear-instructions-schedule

## Request restatement

- Review the `/schedule` page and rewrite its content so parents and teachers can complete the form without guessing.
- Add clear step-by-step instructions covering concert information, piece selection, concert-time preference selection, duration, comments, and the note that the page can be revisited later.
- Optionally add dismissible help UI on the schedule page if it can explain the steps without expanding scope beyond this page.

## Context considered

- Repo/rules/skills consulted: `AGENTS.md`, `$acac`, `$establish-goals`
- Relevant files (if any): `src/routes/schedule/+page.svelte`, `src/test/api/schedule-page.test.ts`
- Constraints (sandbox, commands, policy): Goal lock required before implementation; changes should stay surgical and page-local; behavior changes require verification coverage.

## Ambiguities

### Blocking (must resolve)

1. None.

### Non-blocking (can proceed with explicit assumptions)

1. "Dismissable help overlays" will be interpreted as a lightweight dismissible help panel or overlay on the schedule page, not a new multi-step workflow or routed tutorial.
2. The requested wording updates should preserve existing scheduling rules and submission flow unless a minimal UI adjustment is required to present the clearer instructions.

## Questions for user

1. None.

## Assumptions (explicit; remove when confirmed)

1. Confirmed by approval: the task can be completed within the existing `/schedule` page surface without backend or database changes unless implementation evidence proves otherwise.
2. Confirmed by approval: a dismissible help element is in scope if it remains optional, page-local, and testable.

## Goals (1-20, verifiable)

1. Update the schedule page copy so the top section clearly tells parents and teachers to review the concert information shown there, including performer name, class list, performance piece, and lookup code.
2. Add explicit step-by-step instructional text for piece selection, including that performers with multiple pieces must choose one piece and that a single eligible piece remains selected by default.
3. Add explicit step-by-step instructional text for concert-time selection, duration, comments, and the note that the page can be revisited later to make changes.
4. Preserve the existing schedule submission behavior for both ranked-choice and confirm-only modes while presenting the clearer instructions in the appropriate mode.
5. Add a dismissible help panel or overlay on the schedule page that summarizes the steps if it can be implemented within the existing page scope and without introducing a new workflow.
6. Add or update automated tests that verify the revised instructional content and any new dismissible help behavior on the schedule page.

## Non-goals (explicit exclusions)

- Changing schedule assignment rules, lookup authentication, persistence rules, or admin workflows.
- Redesigning unrelated pages or adding a multi-page onboarding/tutorial system.

## Success criteria (objective checks)

> Tie each criterion to a goal number when possible.

- [G1] The schedule page top content clearly labels the concert information parents/teachers should review, including performer name, classes, performance piece, and lookup code.
- [G2][G3] The page shows explicit instructional copy that explains how to choose a piece when multiple pieces exist, how to rank or mark unavailable concert times, that duration must not exceed 8 minutes, how to use comments, and that the page can be edited later.
- [G4] The revised copy appears in the correct schedule mode without breaking the existing ranked-choice or confirm-only submission flow.
- [G5] If the dismissible help UI is implemented, it can be opened/read and dismissed on the schedule page without blocking form completion.
- [G6] Automated tests cover the new instructional content and any added dismissible help behavior.

## Risks / tradeoffs

- More instructional text can make the page feel denser, so the final UI should improve clarity without burying the actionable fields.

## Next action

- Goals locked; proceed to `prepare-takeoff`.
