# Phase 2 — Minimal Export Repair

## Objective
Implement the smallest coherent fix for the broken admin DOCX export path and
add regression coverage for the identified cause.

## Code areas impacted
- `src/routes/admin/program/+page.svelte`
- `src/routes/api/program/+server.ts`
- `src/lib/server/programDocx.ts`
- `src/test/api/program-api.test.ts`
- `src/test/lib/programDocx.test.ts`

## Work items
- [x] Apply the minimum repair in the broken export path.
- [x] Add or update targeted tests that fail on the identified regression.
- [x] Keep the touched surface within the locked export scope.

## Deliverables
- Restored `.docx` generation for supported admin program selections by
  replacing shell ZIP operations with the internal helper at
  `src/lib/server/zip.ts`.
- Targeted automated coverage for the repaired failure path in
  `src/test/lib/programDocx.test.ts` and `src/test/api/program-api.test.ts`.

## Gate (must pass before proceeding)
Define objective pass/fail criteria.
- [ ] A supported export request succeeds again and targeted regression coverage
      passes.

## Gate evidence
- [x] Targeted regression suite:
      `npm run test -- src/test/lib/programDocx.test.ts src/test/api/program-api.test.ts`
      PASS
- [x] Touched runtime surface remained within scope:
      `src/lib/server/programDocx.ts`, `src/lib/server/zip.ts`,
      `src/test/lib/programDocx.test.ts`, and
      `src/test/api/program-api.test.ts`

## Verification steps
List exact commands and expected results.
- [ ] Command: `npm run test -- src/test/lib/programDocx.test.ts src/test/api/program-api.test.ts`
  - Expected: targeted program export tests pass and cover the repaired path.

## Risks and mitigations
- Risk: a local fix could restore one path while weakening unsupported-state
  handling.
- Mitigation: keep unsupported concert selection behavior explicit in the route
  and tests.
