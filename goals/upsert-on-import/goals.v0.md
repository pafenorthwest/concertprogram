# Goals Extract

- Task name: upsert-on-import
- Iteration: v0
- State: locked

## Goals (1-20, verifiable)

1. Import processing must treat an already-existing matching `performance` row as an update path instead of attempting a second insert that fails on duplicate data.
2. A corrected re-import after a malformed import must succeed when the only conflicting prior side effect is the existing matching `performance` row.
3. When import follows the update path for an existing performance, the performance's associated selected pieces must reflect the corrected payload after the import completes.
4. Add automated tests that reproduce the partial-failure-then-recovery flow and verify that the corrected import succeeds without creating duplicate performance rows.
5. Preserve existing import behavior for new performances: new logical performances should still insert successfully and report as new imports.

## Non-goals (explicit exclusions)

- Reworking performer matching, contributor matching, or musical-piece deduplication beyond what is required for performance upsert behavior.
- Converting the full import flow into a transaction or implementing global rollback for all partially-created records.

## Success criteria (objective checks)

> Tie each criterion to a goal number when possible.

- [G1] The import implementation reuses an existing matching `performance` record instead of attempting a duplicate insert on re-import.
- [G2] A test that first leaves behind a matching performance record through a malformed import scenario can then run a corrected import successfully against the same logical performance.
- [G3] Automated coverage verifies that the corrected import leaves the selected performance pieces matching the corrected payload for the reused performance row.
- [G4] Automated coverage verifies the logical performance remains single-row after recovery rather than duplicating the performance entry.
- [G5] Existing new-import behavior remains covered and passes without regression.
