# Phase 2 — Performance Pieces API

## Objective
Implement the new `/api/performance/pieces` endpoints with feature-flag enforcement and validation.

## Code areas impacted
- `src/routes/api/performance/pieces/+server.ts`
- `src/lib/server/db.ts`
- `src/lib/server/featureFlags.ts`

## Work items
- [ ] Add `GET /api/performance/pieces` for listing pieces + selection state.
- [ ] Add mutation endpoints for associate, disassociate, select, and clear.
- [ ] Enforce same-origin/Authorization checks and feature-flag gating.
- [ ] Return clear error messages and status codes for invalid input.

## Deliverables
- New API route under `src/routes/api/performance/pieces/`
- Updated DB helpers used by the API

## Gate (must pass before proceeding)
- [ ] API endpoints respond with expected status codes.
- [ ] Lint passes after API changes.

## Verification steps
- [ ] Command: `npm run lint`
  - Expected: completes with no errors.

## Risks and mitigations
- Risk: Unauthorized clients can mutate performance pieces.
- Mitigation: Enforce origin checks plus feature-flag gating on all mutations.
