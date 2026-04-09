# Phase 1 — Add Force-Move Endpoint

## Objective

Implement the missing program API path used by the admin page and validate the incoming move payload explicitly.

## Code areas impacted
- `src/routes/api/program/+server.ts` or a nested `src/routes/api/program/[performanceId]/+server.ts` route
- `src/lib/server/db.ts`

## Work items
- [x] Confirm the current admin page request contract from `src/routes/admin/program/+page.svelte`.
- [x] Add the minimal `PUT /api/program/{performanceId}` server route needed for force-move.
- [x] Validate required request fields and fail fast for invalid move payloads.

## Deliverables
- A reachable program force-move endpoint that accepts valid requests and returns explicit errors for invalid requests.

## Gate (must pass before proceeding)
The backend route exists, matches the current admin page payload shape, and rejects invalid requests explicitly.
- [x] Endpoint contract implemented.
- [x] Invalid request handling implemented.

## Verification steps
- [x] Command: `npm run test -- src/test/api/program-api.test.ts`
  - Expected: valid move requests succeed and invalid requests fail clearly

## Risks and mitigations
- Risk: implementing the route against the wrong path shape would leave the existing page broken.
- Mitigation: keep the route contract aligned to the current `fetch('/api/program/${performanceId}')` call.
