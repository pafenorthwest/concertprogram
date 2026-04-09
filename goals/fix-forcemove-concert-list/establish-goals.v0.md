# establish-goals

## Status

- Iteration: v0
- State: locked
- Task name (proposed, kebab-case): fix-forcemove-concert-list

## Request restatement

- Implement the missing force-move behavior for the admin program page so selecting a dropdown option moves the chosen program entry into the selected Eastside concert or the waitlist.
- Preserve the current Svelte page request shape, where the UI sends `PUT /api/program/{performanceId}` with `concertSeries`, `concertNum`, and `performerId`.

## Context considered

- Repo/rules/skills consulted:
  - `AGENTS.md`
  - `/Users/eric/.codex/skills/acac/SKILL.md`
  - `/Users/eric/.codex/skills/establish-goals/SKILL.md`
  - `./.codex/project-structure.md`
- Relevant files (if any):
  - `src/routes/admin/program/+page.svelte`
  - `src/routes/api/program/+server.ts`
  - `src/lib/server/db.ts`
  - `src/test/api/program-api.test.ts`
  - `src/test/db/program.test.ts`
- Constraints (sandbox, commands, policy):
  - No planning or source changes before goals are locked.
  - Verification must ultimately include `npm run lint`, `npm run build`, and `npm run test`.
  - Changes should stay limited to the existing program admin flow, API surface, and matching tests.

## Ambiguities

### Blocking (must resolve)

1. None at this stage.

### Non-blocking (can proceed with explicit assumptions)

1. The move target options on the admin page are intentionally limited to Eastside concerts `1-4` and the waitlist.
2. The backend may implement the move as a new nested program API route or another minimal change, as long as it honors the current UI request contract.

## Questions for user

1. None. The request is specific enough to draft reviewable goals.

## Assumptions (explicit; remove when confirmed)

1. A successful move should persist the selected destination so a page reload shows the entry in that Eastside concert or the waitlist.
2. The existing dropdown payload fields are the intended contract and should not require a front-end redesign.

## Goals (1-20, verifiable)

1. Add or complete the program API force-move path so `PUT /api/program/{performanceId}` accepts the current admin page payload and returns a non-error response for valid move requests.
2. Persist a selected move target so an entry can be reassigned to an Eastside concert number or to the waitlist through server-side program data updates.
3. Keep the implementation scoped to the existing admin program workflow without changing unrelated scheduling or export behavior.
4. Add regression coverage that proves a valid force-move request updates placement for an Eastside destination and for the waitlist destination.

## Non-goals (explicit exclusions)

- Redesigning the admin program page UI beyond the minimal request/response handling needed for force-move.
- Changing the broader program-building algorithm, ranking logic, or export formats unless strictly required to support the requested move behavior.

## Success criteria (objective checks)

> Tie each criterion to a goal number when possible.

- [G1] A request using the existing admin payload shape to `PUT /api/program/{performanceId}` succeeds instead of failing due to a missing or incomplete endpoint.
- [G2] After a successful move, persisted program data places the selected entry in the requested Eastside concert number or in the waitlist.
- [G3] Existing program export and unrelated admin program behaviors remain unchanged aside from the new move support.
- [G4] Automated tests cover at least one Eastside move case and one waitlist move case.

## Risks / tradeoffs

- The current data model appears split between concert series and concert-time preferences, so the smallest correct persistence change must avoid breaking the existing program build logic.

## Next action

- Goals approved and locked. `prepare-takeoff` owns task scaffolding and `spec.md` readiness content.
