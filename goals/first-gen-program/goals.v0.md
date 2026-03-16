# Goals Extract

- Task name: first-gen-program
- Iteration: v0
- State: locked

## Goals (1-20, verifiable)

1. Replace the `Export to csv` text link on the admin program page with a `CSV` button that still downloads a CSV file.
2. Add a `Program` button to the right of the `CSV` button on the admin program page.
3. Implement a server-side Word document export path that returns a downloadable `.docx` file for the currently selected concert only.
4. Disable the `Program` button when the selected filter is `All` or `Waitlist`.
5. Populate each exported program entry with piece title, movement, contributor names/years, soloist instrument, performer name, age, and accompanist using the existing program data model.
6. Populate the concert-level Word export content so Eastside uses `38th {{ConcertName}} Artists Concert #{{NumInSeries}}` and Concerto uses `38th {{ConcertName}} Playoff Concert`, while still filling the concert time from the selected concert.
7. Preserve the template/example formatting behavior so the downloaded document matches the provided template structure rather than emitting plain text or a reformatted document.
8. Render multiple contributors for a piece as stacked lines in the composer column of the Word output.
9. Keep the implementation scoped to the admin program export behavior and the minimum supporting server/template code needed for CSV and DOCX downloads.
10. Add or update tests that verify the changed export behavior for the CSV control state and the DOCX generation logic.

## Non-goals (explicit exclusions)

- Reworking unrelated program ordering, filtering, or drag-and-drop behavior on the admin page
- Changing the underlying program-placement algorithm or broader concert scheduling logic

## Success criteria (objective checks)

> Tie each criterion to a goal number when possible.

- [G1] The admin page renders a `CSV` button instead of the existing `Export to csv` link, and activating it still triggers a CSV file download.
- [G2] The admin page renders a `Program` button immediately to the right of the `CSV` button.
- [G3][G4] The `Program` button is enabled only when a specific concert is selected and does not allow export for `All` or `Waitlist`.
- [G3][G5][G6][G7][G8] The Word export endpoint returns a `.docx` file for the selected concert whose content matches the provided template structure and includes the approved header text, concert time, entry values, and stacked contributor lines where applicable.
- [G9] No unrelated admin program behaviors or non-export flows are changed.
- [G10] Automated verification covers the changed export path and passes with the repository’s pinned verification commands.
