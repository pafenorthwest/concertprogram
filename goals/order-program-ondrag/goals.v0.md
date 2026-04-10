# Goals Extract

- Task name: order-program-ondrag
- Iteration: v0
- State: locked

## Goals (1-20, verifiable)

1. Identify the concrete reason `POST /api/program` returns `405` when the admin program page saves drag-and-drop ordering.
2. Implement a server-side fix so `POST /api/program` accepts the existing reorder payload from `src/routes/admin/program/+page.svelte` and persists the intended order.
3. Keep the fix scoped to program-order persistence and do not regress the existing CSV/DOCX export behavior on `GET /api/program` or the existing force-move behavior on `PUT /api/program/[id]`.
4. Add or update automated coverage that would fail before the fix and pass after it for the `/api/program` reorder persistence path.
5. Verify the changed behavior with the pinned repo verification commands or document a concrete blocker if any required command cannot run.

## Non-goals (explicit exclusions)

- Redesigning the drag-and-drop UI on `src/routes/admin/program/+page.svelte`.
- Changing unrelated program placement rules, lottery logic, or export formatting beyond what is required to restore reorder persistence.

## Success criteria (objective checks)

> Tie each criterion to a goal number when possible.

- [G1] The root cause of the `405` response is identified in the task artifacts and maps to a specific missing or incorrect server implementation.
- [G2] A `POST /api/program` request using the admin page’s reorder payload returns a non-`405` success response and updates persisted order data for the targeted program entries.
- [G3] Existing `GET /api/program` export behavior and `PUT /api/program/[id]` force-move behavior remain covered and passing.
- [G4] Automated tests cover the reorder persistence path and demonstrate the fix.
- [G5] `npm run lint`, `npm run build`, and `npm run test` are executed successfully, or any blocking failure is documented explicitly with command output context.
