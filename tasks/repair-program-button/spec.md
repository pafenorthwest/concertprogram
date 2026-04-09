# Repair Program Button

## Overview
Investigate the regression in the admin `Program` export flow introduced by
`first-gen-program`, identify why the button no longer generates a document,
and restore `.docx` generation with the smallest scoped fix and verification
updates required.

## Goals
- Reconstruct the intended `Program` export behavior from the locked
  `first-gen-program` task artifacts and current code so the regression is
  diagnosed against the original contract.
- Determine the concrete root cause that prevents the admin `Program` button
  flow from generating a `.docx` document and document that cause in the task
  artifacts.
- Repair the export path so selecting a supported concert from the admin
  program page once again returns a downloadable `.docx` document.
- Keep the fix scoped to the admin program export surface and only the minimum
  supporting server/helper/test files required by the repair.
- Add or update automated coverage that would fail on the identified
  regression and pass once the repair is in place.

## Non-goals
- Reworking unrelated admin program ordering, filtering, drag-and-drop, or
  force-move behavior.
- Expanding the Word export feature beyond the behavior already approved in
  `first-gen-program`.

## Use cases / user stories
- An authenticated admin can generate a Word program for a supported concert
  from the admin program page again.
- A maintainer can point to a specific code-level cause for the regression
  rather than treating the failure as a generic export outage.
- Automated coverage catches the repaired failure mode if it regresses again.

## Current behavior
- Notes:
  - `first-gen-program` added a `Program` button in the admin page and a
    `format=docx` path on `/api/program/`.
  - The current codebase still contains the button, URL builder, export route,
    and DOCX helper, so the issue is a regression inside the existing flow.
  - The likely failure surface is limited to the admin program export page,
    `/api/program/` DOCX handling, and `src/lib/server/programDocx.ts`.
- Key files:
  - `tasks/first-gen-program/spec.md`
  - `goals/first-gen-program/goals.v1.md`
  - `src/routes/admin/program/+page.svelte`
  - `src/routes/admin/program/+page.server.ts`
  - `src/routes/api/program/+server.ts`
  - `src/lib/server/programDocx.ts`
  - `src/test/lib/programDocx.test.ts`
  - `src/test/lib/programExport.test.ts`

## Proposed behavior
- Behavior changes:
  - The task will identify and document the specific reason the export stopped
    generating a document.
  - The repair will restore successful `.docx` generation for a supported
    selected concert from the admin program flow.
  - Tests will cover the repaired failure path.
- Edge cases:
  - `All` and `Waitlist` remain unsupported for DOCX export.
  - Unsupported or missing concert selections should still fail explicitly
    rather than producing a partial document.

## Technical design
### Architecture / modules impacted
- `src/routes/admin/program/+page.svelte`
- `src/routes/api/program/+server.ts`
- `src/lib/server/programDocx.ts`
- `src/test/lib/programDocx.test.ts`
- `src/test/api/program-api.test.ts`
- `tasks/repair-program-button/`

### API changes (if any)
- No intended API expansion.
- Preserve the current CSV export behavior and restore the existing DOCX export
  contract.

### UI/UX changes (if any)
- No intended UI redesign beyond any minimal client-side fix needed to make the
  existing `Program` button work again.

### Data model / schema changes (PostgreSQL)
- Migrations: none expected.
- Backward compatibility: preserve current program data and export parameters.
- Rollback: revert the minimal regression fix if needed.

## Security & privacy
- Keep export behavior within the existing admin-authenticated flow.
- Do not broaden data exposure or bypass current route protections.

## Observability (logs/metrics)
- Failures should remain explicit request failures with actionable error output.
- No new metrics are required.

## Verification Commands
> Pin the exact commands discovered for this repo (also update `./codex/project-structure.md` and `./codex/codex-config.yaml`).

- Lint:
  - `npm run lint`
- Build:
  - `npm run build`
- Test:
  - `npm run test`

## Test strategy
- Unit:
  - Add or update focused tests for the DOCX builder or export helper covering
    the repaired failure path.
- Integration:
  - Verify the `/api/program/` export route returns the expected response for
    supported DOCX requests.
- E2E / UI (if applicable):
  - Not required unless the root cause is in client-side button behavior.

## Acceptance criteria checklist
- [ ] The intended `first-gen-program` export behavior is reconstructed and
      compared to the broken implementation.
- [ ] A specific root cause is identified and documented.
- [ ] The admin export flow returns a downloadable `.docx` file again for a
      supported concert selection.
- [ ] The fix stays within the admin program export surface and minimum
      supporting files.
- [ ] Automated coverage catches the repaired regression path.

## IN SCOPE
- `src/routes/admin/program/+page.svelte`
- `src/routes/api/program/+server.ts`
- `src/lib/server/programDocx.ts`
- Program export tests under `src/test/api/` and `src/test/lib/`
- Task artifacts under `tasks/repair-program-button/`

## OUT OF SCOPE
- Program ordering and drag-and-drop logic
- Force-move behavior
- Broader concert scheduling or placement logic
- Database schema changes or migrations
- New export features beyond restoring the approved DOCX behavior

## Goal Lock Assertion
- Locked goals source: `goals/repair-program-button/goals.v0.md`
- Goal state: locked
- Reinterpretation or expansion is not permitted without a new
  establish-goals iteration and explicit approval.

## Ambiguity Check
- Result: passed
- Blocking ambiguity remaining: none
- Non-blocking assumptions carried forward:
  - The task includes both root-cause analysis and repair.
  - The regression can be diagnosed from the current codebase and repository
    verification tooling.

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
  - Current execution is on branch `main`.

## Existing-Worktree Safety Prep
- Helper: `./.codex/scripts/prepare-takeoff-worktree.sh repair-program-button`
- Result: completed with warning
- Summary:
  - Repository: `/Users/eric/pafenorthwest/concertprogram`
  - Branch: `main`
  - Uncommitted entries observed by helper: `4`
  - Reported unresolved merge conflicts: none
  - Warning: running Stage 2 prep from protected branch `main`

## Execution Posture Lock
- Simplicity bias: downstream stages must prefer the smallest coherent repair
  for the broken program export flow.
- Surgical-change rule: downstream stages may touch only the admin export page,
  export route, minimal supporting DOCX/helper code, matching tests, and task
  artifacts unless narrower evidence requires fewer files.
- Fail-fast rule: downstream stages must stop on unsupported export states,
  document-generation failures, or verification failures.

## Change Control
- Goals, constraints, success criteria, and verification classes are frozen.
- Any scope change requires a new establish-goals iteration plus explicit user
  approval before planning or implementation continues.
- Verification may not be weakened, bypassed, or silently redefined.

## Drift Hard-Gate
- Enforce the Stage 2 drift policy from `AGENTS.md`.
- Stop immediately on unauthorized scope expansion, verification weakening, or
  progress-budget overrun.

## Readiness Verdict
- `READY FOR PLANNING`

## Implementation phase strategy
- Complexity: scored:L2 (focused)
- Complexity scoring details: score=8; recommended-goals=4; guardrails-all-true=true; signals=/Users/eric/pafenorthwest/concertprogram/tasks/repair-program-button/complexity-signals.json
- Active phases: 1..3
- No new scope introduced: required
