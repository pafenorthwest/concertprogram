# Goals Extract

- Task name: fix-forcemove-concert-list
- Iteration: v0
- State: locked

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
