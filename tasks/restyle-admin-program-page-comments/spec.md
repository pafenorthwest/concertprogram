# Restyle Admin Program Page Comments

## Overview
Refresh the admin program page so it visually aligns with the admin review page
while preserving the existing program-management workflow. The main UI changes
are the table/control restyle, removal of the `Num in Series` column, and a
comment-button popover pattern in place of inline comment text.

## Goals
- Restyle the admin program page controls and table container so they match the
  admin review page's visual language for buttons, rounded surfaces, and
  comparable text treatment.
- Remove the `Num in Series` table header and body cells without breaking table
  rendering, filtering, or drag-and-drop ordering behavior.
- Replace inline comment text rendering in the program table with a distinct
  comment button for rows that have a comment.
- Show a visibly disabled comment button for rows without a comment and prevent
  disabled comment buttons from opening a popover.
- Add a dismissable popover on the admin program page that shows the full
  comment text for the selected row when an enabled comment button is activated.
- Keep implementation scope limited to the admin program page and only the
  minimum supporting verification and task artifacts needed to complete the
  lifecycle honestly.

## Non-goals
- No rework of ordering, filtering, export, or force-move behavior beyond
  styling adjustments needed to match the updated UI treatment.
- No backend/API, database, or comment data model changes.
- No admin review page behavior changes; it is a styling reference only.

## Use cases / user stories
- Admin opens the program page and sees controls and the program table styled
  consistently with the admin review page.
- Admin scans rows with comments and can identify comment availability from a
  dedicated button instead of truncated inline text.
- Admin opens a row comment in a dismissable popover, reads the full text, and
  closes it without leaving the page.
- Admin continues reordering rows and using existing move/export controls
  without regression from the UI refresh.

## Current behavior
- `src/routes/admin/program/+page.svelte` uses a plain table and unstyled
  control bar that does not match the review page treatment.
- The table currently renders a `Num in Series` column for every row.
- Comment text is rendered inline inside a scroll container when a comment
  exists, and rows without comments render an empty cell.
- No popover or focused comment interaction exists today.
- Key files:
  - `src/routes/admin/program/+page.svelte`
  - `src/routes/admin/review/+page.svelte`

## Proposed behavior
- Restyle the top controls, table container, buttons, and key text presentation
  on the program page to match the review page's established visual language.
- Remove the `Num in Series` column from the header and row markup.
- Replace inline comment text with a per-row comment button that is enabled only
  when comment text exists.
- Show a visibly disabled comment button for commentless rows and block popover
  activation from those controls.
- Add a dismissable, page-local popover that displays the full comment for the
  selected row.
- Edge cases:
  - Rows with `null` or empty comments must render the disabled comment button.
  - Only one comment popover should be active at a time.
  - Drag-and-drop row ordering must keep working after markup/styling changes.

## Technical design
### Architecture / modules impacted
- `src/routes/admin/program/+page.svelte` for all in-scope UI behavior and
  styling changes.
- `src/routes/admin/review/+page.svelte` as a reference surface only; no edits
  are planned there unless a minimal shared style extraction becomes strictly
  necessary.

### API changes (if any)
- None intended.

### UI/UX changes (if any)
- Rounded container/card treatment around the program table area.
- Review-page-style button presentation for export/program/comment controls.
- Clear enabled/disabled comment affordances and a dismissable full-comment
  popover.

### Data model / schema changes (PostgreSQL)
- Migrations: none.
- Backward compatibility: existing page data contract remains unchanged.
- Rollback: revert the program page UI changes; no schema rollback required.

## Security & privacy
- Keep the existing authentication gate unchanged.
- Do not expose any comment data beyond what the page already receives.

## Observability (logs/metrics)
- No new logging or metrics are required for this UI-only change.

## Verification Commands
> Pin the exact commands discovered for this repo (also update `./codex/project-structure.md` and `./codex/codex-config.yaml`).

- Lint:
  - `npm run lint`
- Build:
  - `npm run build`
- Test:
  - `npm run test`

## Test strategy
- Unit: add a focused component or route test only if the current test surface
  supports this page cheaply.
- Integration: rely on existing project test coverage plus full repo validation
  unless a small UI test is the minimal honest way to cover the popover/comment
  interaction.
- E2E / UI (if applicable): manual verification of comment button states and
  popover behavior on the program page if automated UI coverage is absent.

## Acceptance criteria checklist
- [ ] The program page adopts review-page-style rounded surfaces, control/button
      styling, and comparable text treatment.
- [ ] The `Num in Series` header and row cells are removed.
- [ ] Comment buttons show clear enabled and disabled states.
- [ ] Enabled comment buttons open a dismissable popover with the full comment.
- [ ] Disabled comment buttons do not open the popover.
- [ ] `npm run lint`, `npm run build`, and `npm run test` pass or blockers are
      documented truthfully.

## IN SCOPE
- `src/routes/admin/program/+page.svelte`
- `tasks/restyle-admin-program-page-comments/*`
- `goals/restyle-admin-program-page-comments/*`

## OUT OF SCOPE
- `src/routes/admin/review/+page.svelte` behavior or data flow changes.
- `src/routes/admin/program/+page.server.ts`
- `src/routes/api/program/*`
- Ordering, filtering, export, and force-move logic beyond keeping them working
  through the UI refresh.
- Backend/API or schema changes.

## Goal lock assertion
- Locked goals source: `goals/restyle-admin-program-page-comments/goals.v0.md`
- Goal changes, non-goal changes, and success-criteria changes are not allowed
  without restarting the lifecycle from `establish-goals`.

## Ambiguity check
- Result: passed.
- Remaining ambiguity: none blocking.

## Governing context
- Rules:
  - `./.codex/rules/expand-task-spec.rules`
  - `./.codex/rules/git-safe.rules`
- Skills:
  - `establish-goals`
  - `prepare-takeoff`
  - `prepare-phased-impl`
  - `implement`
- Sandbox:
  - workspace-write filesystem
  - restricted network

## Environment & tooling notes
- Repository root: `/Users/eric/side-projects/concertprogram`
- Current branch during Stage 2 prep: `main`
- Canonical verification commands confirmed from
  `./.codex/project-structure.md` and `./.codex/codex-config.yaml`.

## Execution posture lock
- Simplicity bias: keep the change inside the admin program page unless a
  minimal supporting test is clearly necessary.
- Surgical-change rule: preserve existing program workflows and adjust only the
  presentation/interaction needed for the restyle and comment popover.
- Fail-fast rule: keep UI state transitions explicit and avoid silently opening
  comment UI for rows that have no comment content.

## Change control
- Scope expansion is not allowed after Stage 2.
- Changes to goals, constraints, success criteria, verification commands, or
  scope require explicit relock through the lifecycle.
- Override authority: the user must approve any scope or contract change.

## Existing-worktree safety prep
- Command:
  `./.codex/scripts/prepare-takeoff-worktree.sh restyle-admin-program-page-comments`
- Result: completed without merge conflicts.
- Notes:
  - Running on protected branch `main`.
  - Uncommitted entries were present for `.codex/codex-config.yaml`,
    `goals/task-manifest.csv`, `goals/restyle-admin-program-page-comments/`, and
    `tasks/restyle-admin-program-page-comments/`.

## Stage verdict
- READY FOR PLANNING

## Implementation phase strategy
- Complexity: focused
- Complexity scoring details: score=8; recommended-goals=4; guardrails-all-true=true; signals=/Users/eric/side-projects/concertprogram/tasks/restyle-admin-program-page-comments/complexity-signals.json
- Active phases: 1..3
- No new scope introduced: required
