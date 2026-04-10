# Phase 2 — Implement Program Order Persistence And Verify

## Objective
Add the missing collection `POST` handler, persist the reordered program
entries, and verify the fix without regressing export or force-move behavior.

## Code areas impacted
- `src/routes/api/program/+server.ts`
- `src/lib/server/db.ts` only if the existing order-update helper needs
  validation or hardening
- `src/test/api/program-api.test.ts`
- `tasks/order-program-ondrag/final-phase.md`

## Work items
- [x] Implement `POST /api/program` using the existing admin payload contract
      and explicit request validation.
- [x] Reuse or harden the existing DB order-update helper only as needed to
      persist the posted order safely.
- [x] Keep `GET /api/program` export behavior unchanged and preserve
      `PUT /api/program/[id]` force-move behavior.
- [x] Run targeted and full verification and record the results in
      `final-phase.md`.

## Deliverables
- A working `POST /api/program` route that persists reordered entries using a
  parameterized transactional DB helper.
- Passing regression coverage for reorder persistence plus existing program API
  behavior.
- Completed verification evidence recorded in `final-phase.md`.

## Gate (must pass before proceeding)
Define objective pass/fail criteria.
- [x] The reorder save path succeeds for the admin payload, persisted ordering
      is updated, and full verification is either passing or explicitly blocked
      with evidence. Observed: full verification passed.

## Verification steps
List exact commands and expected results.
- [x] Command: `npm run test -- src/test/api/program-api.test.ts`
  - Expected: program API tests pass with reorder persistence coverage.
    Observed: PASS.
- [x] Command: `npm run lint`
  - Expected: pass. Observed: PASS.
- [x] Command: `npm run build`
  - Expected: pass. Observed: PASS.
- [x] Command: `npm run test`
  - Expected: pass, or a concrete blocker is recorded in `final-phase.md`.
    Observed: PASS after starting the local app with
    `npm run dev -- --host 127.0.0.1` for suites that hit `localhost:8888`.

## Risks and mitigations
- Risk: the full posted program array may include entries outside the visible
  filtered concert, which could unintentionally rewrite unrelated ordering.
- Mitigation: validate each entry and persist only the explicit order fields the
  current contract requires, without broadening route behavior.
