# Goals Extract

- Task name: clear-instructions-schedule
- Iteration: v0
- State: locked

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
