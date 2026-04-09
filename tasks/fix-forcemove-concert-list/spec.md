# Fix Force-Move Concert List

## Overview

Add the missing backend support for the admin program page force-move dropdown so staff can reassign a program entry to a specific Eastside concert or the waitlist. The locked request is limited to the existing program workflow and its matching regression coverage.

## Goals

1. Add or complete the program API force-move path so `PUT /api/program/{performanceId}` accepts the current admin page payload and returns a non-error response for valid move requests.
2. Persist a selected move target so an entry can be reassigned to an Eastside concert number or to the waitlist through server-side program data updates.
3. Keep the implementation scoped to the existing admin program workflow without changing unrelated scheduling or export behavior.
4. Add regression coverage that proves a valid force-move request updates placement for an Eastside destination and for the waitlist destination.

## Non-goals

- Redesigning the admin program page UI beyond the minimal request/response handling needed for force-move.
- Changing the broader program-building algorithm, ranking logic, or export formats unless strictly required to support the requested move behavior.

## Use cases / user stories

- As an admin user on the program page, I can move a listed entry into Eastside concert `#1-#4` using the existing dropdown.
- As an admin user on the program page, I can move a listed entry to the waitlist using the existing dropdown.
- As a maintainer, I have automated coverage proving both move targets persist correctly.

## Current behavior
- Notes:
  - The admin page already calls `PUT /api/program/{performanceId}` from `forceMove`.
  - The program API currently exposes only `GET` in `src/routes/api/program/+server.ts`.
  - `src/lib/server/db.ts` contains existing program-order and concert-series update helpers, but nothing yet exposed through the force-move API contract.
- Key files:
  - `src/routes/admin/program/+page.svelte`
  - `src/routes/api/program/+server.ts`
  - `src/lib/server/db.ts`
  - `src/test/api/program-api.test.ts`
  - `src/test/db/program.test.ts`

## Proposed behavior
- Behavior changes:
  - Add a program API route that accepts the existing force-move request shape and persists the selected destination.
  - Update the server-side program persistence logic so Eastside concert numbers and the waitlist placement are saved in a way the rebuilt program reflects after reload.
  - Add automated regression tests for one Eastside move and one waitlist move.
- Edge cases:
  - Invalid or incomplete force-move payloads should fail explicitly.
  - Waitlist handling must not require a valid Eastside concert slot selection.

## Technical design
### Architecture / modules impacted
- `src/routes/api/program/` for the move endpoint
- `src/lib/server/db.ts` for the persistence helper used by the endpoint
- `src/test/api/` and/or `src/test/db/` for regression coverage

### API changes (if any)

- Add `PUT /api/program/{performanceId}` for admin force-move requests using `{ concertSeries, concertNum, performerId }`.

### UI/UX changes (if any)

- No intentional UI redesign. The current dropdown request contract remains the source of truth.

### Data model / schema changes (PostgreSQL)
- Migrations:
  - None expected.
- Backward compatibility:
  - Existing `GET /api/program` behavior remains unchanged.
- Rollback:
  - Revert the endpoint/helper changes if the move behavior proves unsafe.

## Security & privacy

- Keep the change within the existing admin program surface; do not widen public access or expose new data.

## Observability (logs/metrics)

- Use explicit server errors for invalid force-move payloads or failed persistence.

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
  - Add focused coverage for any new server-side move helper logic if it is extracted into a pure helper.
- Integration:
  - Add or update program API and/or program persistence tests covering Eastside and waitlist moves.
- E2E / UI (if applicable):
  - None planned.

## Acceptance criteria checklist
- [ ] `PUT /api/program/{performanceId}` accepts the current admin payload shape and succeeds for valid requests.
- [ ] Moving to an Eastside concert persists and is reflected after rebuilding program data.
- [ ] Moving to the waitlist persists and is reflected after rebuilding program data.
- [ ] Regression tests cover Eastside and waitlist move behavior.

## IN SCOPE
- `src/routes/api/program/` endpoint changes needed for force-move support
- Minimal server-side program persistence updates required to store the selected destination
- Test updates required to verify Eastside and waitlist moves
- Task artifact updates required by the lifecycle

## OUT OF SCOPE
- Admin program page redesign beyond using the existing request contract
- General scheduling algorithm rewrites unrelated to force-move persistence
- Program export changes
- Database schema changes unless later proven strictly necessary

## Goal Lock Assertion

- Locked goals source: `goals/fix-forcemove-concert-list/goals.v0.md`
- Locked state confirmed: no reinterpretation or expansion is permitted downstream.

## Ambiguity Check

- Result: passed
- Remaining ambiguity: none blocking Stage 2.

## Governing Context

- Rules:
  - `.codex/rules/expand-task-spec.rules`
  - `.codex/rules/git-safe.rules`
- Skills:
  - `acac`
  - `establish-goals`
  - `prepare-takeoff`
  - `prepare-phased-impl`
  - `implement`
  - `land-the-plan`
- Sandbox:
  - `workspace-write`
  - network restricted

## Execution Posture Lock

- Simplicity bias locked for downstream stages.
- Surgical-change discipline locked for downstream stages.
- Fail-fast error handling locked for downstream stages.

## Change Control

- Goal, constraint, and scope changes are not allowed after lock without explicit user approval and lifecycle re-entry as required.

## Readiness Verdict

- READY FOR PLANNING

## Implementation phase strategy
- Complexity: scored:L2 (focused)
- Complexity scoring details: score=8; recommended-goals=4; guardrails-all-true=true; signals=/Users/eric/pafenorthwest/concertprogram/tasks/fix-forcemove-concert-list/complexity-signals.json
- Active phases: 1..3
- No new scope introduced: required
