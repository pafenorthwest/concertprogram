# First Gen Program

## Overview
Add program export controls to the admin program page by replacing the current
CSV link with a `CSV` button and adding a `Program` button that generates a
single-concert Word document from the provided template structure. The Word
export is limited to the currently selected concert and is unavailable for
`All` and `Waitlist`.

## Goals
- A button labeled `CSV` replaces the current text link and still downloads
  CSV.
- Add a `Program` button to the right of the `CSV` button on the admin
  program page.
- Implement a server-side Word document export path that returns a
  downloadable `.docx` file for the currently selected concert only.
- Disable the `Program` button when the selected filter is `All` or
  `Waitlist`.
- Populate each exported program entry with piece title, movement,
  contributor names/years, soloist instrument, performer name, age, and
  accompanist using the existing program data model.
- Populate the concert-level Word export content so Eastside uses
  `38th {{ConcertName}} Artists Concert #{{NumInSeries}}` and Concerto uses
  `38th {{ConcertName}} Playoff Concert`, while still filling the concert
  time from the selected concert.
- Preserve the template/example formatting behavior so the downloaded
  document matches the provided template structure rather than emitting plain
  text or a reformatted document.
- Render multiple contributors for a piece as stacked lines in the composer
  column of the Word output.
- Keep the implementation scoped to the admin program export behavior and the
  minimum supporting server/template code needed for CSV and DOCX downloads.
- Add or update tests that verify the changed export behavior for the CSV
  control state and the DOCX generation logic.

## Non-goals
- Reworking unrelated program ordering, filtering, or drag-and-drop behavior
  on the admin page.
- Changing the underlying program-placement algorithm or broader concert
  scheduling logic.

## Use cases / user stories
- An authenticated admin can click a clearly labeled `CSV` button instead of
  using a raw export link.
- An authenticated admin viewing a specific Eastside or Concerto concert can
  download a formatted Word program for that single concert.
- An authenticated admin looking at `All` or `Waitlist` can see that Word
  export is intentionally unavailable for those views.

## Current behavior
- Notes:
  - `src/routes/admin/program/+page.svelte` renders the concert selector and
    exposes CSV export as a plain anchor to `/api/program/`.
  - `src/routes/api/program/+server.ts` generates only CSV output for the
    full program dataset.
  - The repo does not yet contain a Word export helper or template-backed
    document generation path.
- Key files:
  - `src/routes/admin/program/+page.svelte`
  - `src/routes/admin/program/+page.server.ts`
  - `src/routes/api/program/+server.ts`
  - `src/lib/server/program.ts`

## Proposed behavior
- Behavior changes:
  - The admin program page shows `CSV` and `Program` buttons in the top bar.
  - `CSV` still downloads the existing CSV export.
  - `Program` downloads a `.docx` file for the currently selected concert.
  - `Program` is disabled for `All` and `Waitlist`.
  - The generated Word document preserves the provided template layout and
    fills the approved concert-level and entry-level values.
- Edge cases:
  - `Program` must not attempt export when no specific concert is selected.
  - Multi-contributor works must render contributors as stacked lines in the
    composer column.
  - Concert header text differs by series: Eastside vs Concerto.

## Technical design
### Architecture / modules impacted
- `src/routes/admin/program/+page.svelte`
- `src/routes/api/program/+server.ts` or a narrowly-scoped sibling export
  route under `src/routes/api/program/`
- New supporting Word-export logic under `src/lib/server/`
- A checked-in copy of the Word template in a task-appropriate repository
  location if required for deterministic generation
- Matching automated tests under `src/test/api/`

### API changes (if any)
- Extend program export handling to support a Word-document response for a
  single selected concert.
- Preserve the existing CSV endpoint behavior.

### UI/UX changes (if any)
- Replace the current text export link with a `CSV` button.
- Add a `Program` button beside it.
- Disable `Program` when the selector points to `All` or `Waitlist`.

### Data model / schema changes (PostgreSQL)
- Migrations: none expected.
- Backward compatibility: existing program data retrieval and CSV export stay
  intact.
- Rollback: revert the export controls and Word generation path.

## Security & privacy
- Keep export behavior within the existing authenticated admin route.
- Do not broaden program data exposure beyond the existing admin export
  surface.

## Observability (logs/metrics)
- No new metrics are required.
- Server-side export failures should surface as explicit request failures
  rather than silent partial output.

## Verification Commands
> Pin the exact commands discovered for this repo (also update
> `./codex/project-structure.md` and `./codex/codex-config.yaml`).

- Lint:
  - `npm run lint`
- Build:
  - `npm run build`
- Test:
  - `npm run test`

## Test strategy
- Unit:
  - Add coverage for any extracted Word export helper logic.
- Integration:
  - Verify the program export route returns the expected content type and
    downloadable output for supported requests.
- E2E / UI (if applicable):
  - Verify the admin program page renders the `CSV` button, the `Program`
    button, and the disabled state for unsupported selections.

## Acceptance criteria checklist
- [ ] The admin page shows a button labeled `CSV` instead of the existing
      text export link.
- [ ] The admin page shows a `Program` button immediately to the right of the
      `CSV` button.
- [ ] The `Program` button is disabled for `All` and `Waitlist`.
- [ ] The Word export returns a `.docx` file only for a specific selected
      concert.
- [ ] The generated document preserves the approved template layout and
      series-specific header text.
- [ ] Entry data includes piece, movement, stacked contributors, soloist
      instrument, performer, age, and accompanist.
- [ ] Automated verification covers the changed export behavior.

## IN SCOPE
- `src/routes/admin/program/+page.svelte`
- Program export route code under `src/routes/api/program/`
- Minimal supporting server code for Word generation under `src/lib/server/`
- Minimal checked-in template asset if required for deterministic export
- Matching program export tests under `src/test/api/`
- Task artifacts under `tasks/first-gen-program/`

## OUT OF SCOPE
- Program ordering and drag-and-drop behavior
- Concert placement logic in `src/lib/server/program.ts` beyond the minimum
  read-only shaping needed for export
- Database schema changes or migrations
- Non-admin routes and unrelated export features

## Goal Lock Assertion
- Locked goals source: `goals/first-gen-program/goals.v1.md`
- Goal state: locked
- Reinterpretation or expansion is not permitted without a new
  establish-goals iteration and explicit approval.

## Ambiguity Check
- Result: passed
- Blocking ambiguity remaining: none
- Non-blocking assumptions carried forward:
  - `ConcertName` is a logical export value derived from the selected concert
    series even though it is not a literal placeholder in the source DOCX.
  - The Word document can be generated by preserving the provided DOCX
    package structure and replacing placeholders or equivalent header/body
    content in place.

## Governing Context
- Rules files:
  - `.codex/rules/expand-task-spec.rules`
  - `.codex/rules/git-safe.rules`
  - `AGENTS.md`
- Skills used:
  - `acac`
  - `establish-goals`
  - `prepare-takeoff`
- Sandbox / environment notes:
  - Filesystem sandbox: workspace-write
  - Network access: restricted
  - Current execution starts in an existing worktree with detached `HEAD`.

## Existing-Worktree Safety Prep
- Helper: `./.codex/scripts/prepare-takeoff-worktree.sh first-gen-program`
- Result: completed successfully
- Summary:
  - Repository: `/Users/eric/.codex/worktrees/38c1/concertprogram`
  - Branch: `(detached HEAD)`
  - Uncommitted entries observed by helper: `5`
  - Reported unresolved merge conflicts: none

## Execution Posture Lock
- Simplicity bias: downstream stages must prefer the smallest coherent admin
  page, export route, and helper changes that satisfy the locked goals.
- Surgical-change rule: downstream stages may touch only the export UI,
  minimal export server logic, supporting tests, and task artifacts unless
  narrower supporting evidence requires another in-scope file.
- Fail-fast rule: downstream stages must stop on template-shaping errors,
  unsupported filter states, or verification failures.

## Change Control
- Goals, constraints, success criteria, and verification classes are frozen.
- Any scope change requires a new establish-goals iteration plus explicit
  user approval before planning or implementation continues.
- Verification may not be weakened, bypassed, or silently redefined.

## Drift Hard-Gate
- Enforce the Stage 2 drift policy from `AGENTS.md`.
- Stop immediately on unauthorized scope expansion, verification weakening,
  or progress-budget overrun.

## Readiness Verdict
- `READY FOR PLANNING`

## Implementation phase strategy
- Complexity: scored:L2 (focused)
- Complexity scoring details: score=8; recommended-goals=4; guardrails-all-true=true; signals=/Users/eric/.codex/worktrees/38c1/concertprogram/tasks/first-gen-program/complexity-signals.json
- Active phases: 1..2
- No new scope introduced: required
