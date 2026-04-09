# Phase 1 — Root Cause Diagnosis

## Objective
Reconstruct the intended `first-gen-program` export flow, reproduce or narrow
the current failure, and identify the specific code-level cause that blocks
`.docx` generation.

## Code areas impacted
- `tasks/first-gen-program/spec.md`
- `goals/first-gen-program/goals.v1.md`
- `src/routes/admin/program/+page.svelte`
- `src/routes/api/program/+server.ts`
- `src/lib/server/programDocx.ts`
- `src/test/lib/programDocx.test.ts`

## Work items
- [x] Compare the locked `first-gen-program` behavior against the current
      export implementation.
- [x] Reproduce or narrow the failing path with targeted inspection or test
      execution.
- [x] Record the concrete regression cause in task artifacts for traceability.

## Deliverables
- A documented root cause tied to the current codebase:
  `first-gen-program` implemented DOCX generation by shelling out to external
  `unzip` and `zip` binaries in `src/lib/server/programDocx.ts`, which makes
  the export fail in runtimes that do not provide those binaries even though it
  passes locally.
- A bounded repair target for the export regression:
  replace shell ZIP handling with an in-process helper and add export-route
  coverage.

## Gate (must pass before proceeding)
Define objective pass/fail criteria.
- [ ] The broken export path is explained by a specific, reproducible, or
      directly inspectable code condition.

## Gate evidence
- [x] Targeted unit test: `npm run test -- src/test/lib/programDocx.test.ts`
      PASS
- [x] Root cause confirmed by source inspection:
      `src/lib/server/programDocx.ts` depended on external `zip` and `unzip`
      commands, and `src/test/lib/programDocx.test.ts` mirrored the same
      assumption instead of covering the API route.

## Verification steps
List exact commands and expected results.
- [ ] Command: `npm run test -- src/test/lib/programDocx.test.ts`
  - Expected: existing tests run and provide evidence about the DOCX builder
    path, including any failure tied to the regression.

## Risks and mitigations
- Risk: the failure may depend on environment tooling rather than app logic.
- Mitigation: compare the shipped code path, task contract, and test behavior
  before widening the suspected surface.
