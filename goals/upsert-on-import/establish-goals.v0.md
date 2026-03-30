# establish-goals

## Status

- Iteration: v0
- State: locked
- Task name (proposed, kebab-case): upsert-on-import

## Request restatement

- Make `POST/PUT api/import` resilient when a malformed import leaves a partial `performance` row behind.
- When a later corrected import targets the same logical performance, reuse that existing row instead of failing on a duplicate performance insert.
- Add automated tests that prove the import path updates an existing performance record rather than creating a conflicting duplicate.

## Context considered

- Repo/rules/skills consulted: `AGENTS.md`, `/.codex/codex-config.yaml`, `/.codex/project-structure.md`, `acac` skill, `establish-goals` skill.
- Relevant files (if any): `src/lib/server/import.ts`, `src/routes/api/import/+server.ts`, `src/test/db/import.test.ts`.
- Constraints (sandbox, commands, policy): Must follow ACAC stage order; no source edits before goals lock; repo verification commands are `npm run lint`, `npm run build`, and `npm run test`.

## Ambiguities

### Blocking (must resolve)

1. None.

### Non-blocking (can proceed with explicit assumptions)

1. The existing logical identity for a performance remains the current lookup used by import: performer + class + concert series + year.
2. "Update" means the matched `performance` row is reused and its persisted fields are brought in line with the latest valid import payload where the import flow currently owns those fields.
3. The request is limited to making the performance portion of import idempotent enough to recover from partial failures; full transactional rollback of all import side effects is out of scope unless the code already supports it.

## Questions for user

1. None.

## Assumptions (explicit; remove when confirmed)

1. It is acceptable to keep the API response contract unchanged apart from the corrected duplicate-recovery behavior.
2. Extending the existing database-level import tests is sufficient unless API-level coverage is clearly required by the changed logic.

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

## Risks / tradeoffs

- Reusing an existing performance row without updating all import-owned columns could leave stale metadata, so tests need to assert the fields and mappings that matter for recovery.

## Next action

- Handoff: `prepare-takeoff` owns task scaffolding and `spec.md` readiness content.
