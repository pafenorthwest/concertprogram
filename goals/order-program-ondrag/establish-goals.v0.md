# establish-goals

## Status

- Iteration: v0
- State: locked
- Task name (proposed, kebab-case): order-program-ondrag

## Request restatement

- Investigate why dragging rows in the admin program page saves client-side order updates but the persistence call to `POST /api/program` returns `405`, then implement the minimal fix so reordered rows persist successfully.

## Context considered

- Repo/rules/skills consulted: `AGENTS.md`, `/.codex/project-structure.md`, `/.codex/codex-config.yaml`, `/Users/eric/.codex/skills/acac/SKILL.md`, `/Users/eric/.codex/skills/establish-goals/SKILL.md`
- Relevant files (if any): `src/routes/admin/program/+page.svelte`, `src/routes/api/program/+server.ts`, `src/routes/api/program/[id]/+server.ts`, `src/lib/server/program.ts`, `src/lib/server/db.ts`, `src/test/api/program-api.test.ts`, `src/test/db/program.test.ts`
- Constraints (sandbox, commands, policy): goals must lock before planning or code changes; verification commands are pinned to `npm run lint`, `npm run build`, and `npm run test`; keep changes surgical and within the admin program ordering persistence surface.

## Ambiguities

### Blocking (must resolve)

1. None.

### Non-blocking (can proceed with explicit assumptions)

1. The intended persistence contract for drag-and-drop ordering is `POST /api/program` with a JSON array of reordered program entries, because the admin page already sends that payload and the route currently lacks a `POST` handler.
2. Persisting row order only needs to update stored ordering for the affected program entries; no UI behavior changes beyond successful save handling are required unless the investigation proves otherwise.

## Questions for user

1. None.

## Assumptions (explicit; remove when confirmed)

1. Fixing the missing or incorrect server handler for `/api/program` is in scope.
2. Adding or updating automated tests for the API ordering persistence path is required because behavior changes on a server endpoint.

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

## Risks / tradeoffs

- The reorder payload appears to send the full in-memory program list, so the server fix must validate inputs carefully and avoid unintentionally rewriting unrelated rows or concert assignments.

## Next action

- Handoff: `prepare-takeoff` owns task scaffolding and `spec.md` readiness content.
