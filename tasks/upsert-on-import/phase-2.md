# Phase 2 — Implement Performance Upsert Recovery

## Objective
Update the import workflow so an existing matching `performance` row is reused
as the update path and corrected re-imports rebuild the selected pieces without
creating a duplicate performance entry.

## Code areas impacted
- `src/lib/server/import.ts`
- `src/lib/server/db.ts` only if an explicit performance update helper is
  needed

## Work items
- [x] Adjust the performance-processing path to treat an existing matching
      performance as an upsert/update target.
- [x] Refresh any import-owned performance fields that must stay aligned with
      the corrected payload when the existing row is reused.
- [x] Preserve the existing insert path for genuinely new performances.
- [x] Keep the change localized to the import flow and avoid unrelated matching
      or schema changes.

## Deliverables
- Import logic that allows corrected re-imports to succeed when the prior failed
  import only left the matching `performance` row behind.
- Any required helper updates kept within the scoped server-side modules.
- Evidence: `searchPerformanceByPerformerAndClass()` now queries the
  `performance` row directly instead of requiring `adjudicated_pieces` to exist
  first.

## Gate (must pass before proceeding)
Define objective pass/fail criteria.
- [x] The targeted recovery test passes and confirms a single logical
      performance row after the corrected import.
- [x] Existing single-performance refresh behavior remains intact.

## Verification steps
List exact commands and expected results.
- [x] Command: `npm run test -- src/test/db/import.test.ts`
  - Expected: the import DB suite passes, including the new malformed-import
    recovery assertions.

## Risks and mitigations
- Risk: reusing the row without updating the relevant fields can leave stale
  accompanist or series metadata.
- Mitigation: verify which fields the import flow owns and update only those
  required to keep the existing row consistent with the corrected payload.
