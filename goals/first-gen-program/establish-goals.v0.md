# establish-goals

## Status

- Iteration: v0
- State: locked
- Task name (proposed, kebab-case): first-gen-program

## Request restatement

- Update the admin program page so the existing CSV export is presented as a `CSV` button instead of a text link.
- Add a `Program` button next to `CSV` that downloads a Word `.docx` program generated from the provided template and example documents.
- Populate the Word program from the program page data, including concert-level values and per-entry values, and preserve the layout behavior shown in the example document.

## Context considered

- Repo/rules/skills consulted: `AGENTS.md`, `/.codex/codex-config.yaml`, skill docs for `acac`, `establish-goals`, `prepare-takeoff`, and `prepare-phased-impl`
- Relevant files (if any): `src/routes/admin/program/+page.svelte`, `src/routes/admin/program/+page.server.ts`, `src/routes/api/program/+server.ts`, `src/lib/server/program.ts`, `/Users/eric/Downloads/Template PAFE Eastside Concerts.docx`, `/Users/eric/Downloads/PAFE Eastside Saturday 4pm Concerts 2025.docx`
- Constraints (sandbox, commands, policy): ACAC lifecycle ordering is mandatory; goal approval is required before downstream stages; no source-code modification is allowed before goals are locked

## Ambiguities

### Blocking (must resolve)

1. None.
2. None.

### Non-blocking (can proceed with explicit assumptions)

1. The Word document can be generated server-side by reusing the provided `.docx` as a package template and replacing placeholders while preserving existing styles and formatting.
2. When a musical piece has multiple contributors, the composer names and years should render as stacked lines in the right column for that piece.
3. The `Program` export applies only to the currently selected concert and should be disabled when the selector is `All` or `Waitlist`.
4. The series-specific header text should use `38th {{ConcertName}} Artists Concert #{{NumInSeries}}` for Eastside and `38th {{ConcertName}} Playoff Concert` for Concerto.

## Questions for user

1. Resolved: `Program` should export only the currently selected concert and should be disabled for `All` and `Waitlist`.
2. Resolved: Eastside should use `38th {{ConcertName}} Artists Concert #{{NumInSeries}}`; Concerto should use `38th {{ConcertName}} Playoff Concert`.

## Assumptions (explicit; remove when confirmed)

1. The current CSV download behavior can remain backed by `/api/program/`; only the control changes from a link to a button.
2. The entry-level placeholder mapping should use the actual template placeholders found in the DOCX (`MusicalPiece`, `Composer`, `YearsActive`, `Instrument`, `PerformerName`, `Age`, `Accompanist`) unless the template file itself is revised.
3. `ConcertName` is a logical export value derived from the selected concert series and inserted into the generated DOCX header text even though it is not a literal placeholder in the provided template file.

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

## Risks / tradeoffs

- Direct `.docx` generation without a dedicated library may require careful low-level XML manipulation to preserve formatting.
- If the final export scope includes non-Eastside concerts, the provided Eastside-specific template may need controlled generalization, which increases implementation surface.

## Next action

- Re-extract and validate the locked goals, then present them for user approval before entering `prepare-takeoff`.
