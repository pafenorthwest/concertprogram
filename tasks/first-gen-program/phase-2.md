# Phase 2 — Admin Controls And Verification

## Objective
Wire the admin program page to the export endpoints so the CSV control becomes
a button, the Word export is available only for a selected concert, and the
changed behavior is covered by automated tests and full verification.

## Code areas impacted
- `src/routes/admin/program/+page.svelte`
- Matching tests under `src/test/api/`
- `tasks/first-gen-program/final-phase.md`

## Work items
- [x] Replace the existing CSV link with a button labeled `CSV` while
      preserving the download behavior.
- [x] Add the `Program` button to the right of `CSV` and disable it for
      `All` and `Waitlist`.
- [x] Wire the selected concert values into the Word export request.
- [x] Add or update tests for the export route behavior and the admin control
      state.
- [x] Run pinned lint, build, and test commands and record the results in
      `final-phase.md`.

## Deliverables
- Updated admin program UI with the new button controls and disabled-state
  logic.
- Automated tests covering the export behavior and control state.
- Updated `final-phase.md` with verification results once Stage 4 runs.

## Gate (must pass before proceeding)
Phase 2 is complete only when the admin UI matches the locked button behavior
and the changed export path is covered by passing automated verification.
- [x] The admin page shows `CSV` and `Program` buttons in the required order.
- [x] `Program` is disabled for unsupported selections and enabled for a
      specific concert.
- [x] Matching focused tests exist for the changed behavior and pass.

## Verification steps
List exact commands and expected results.
- [x] Command: `npm run lint`
  - Expected: PASS after the UI and test changes are complete. Result: PASS.
- [x] Command: `DATABASE_URL='postgres://user:password@host:5432/db_name?sslmode=require' DB_SSL=true auth_code='test-code' npm run build`
  - Expected: PASS with the new export path and admin page changes. Result: PASS.
- [x] Command: `npm run test`
  - Expected: PASS including the updated program export coverage. Result: PASS.

## Risks and mitigations
- Risk: The admin page may need explicit browser-side download handling rather
  than plain anchors once query parameters and disabled states are introduced.
- Mitigation: Keep the UI wiring minimal and test the selected-concert request
  construction directly.
