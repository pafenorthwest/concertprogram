# establish-goals

## Status

- Iteration: v0
- State: locked
- Task name (proposed, kebab-case): apostrophy-bug-comments

## Request restatement

- Attempt to reproduce the schedule-page comment submission failure when the entered text contains one or more apostrophes.
- If the failure is confirmed, fix the schedule comment handling by escaping the submitted text before it reaches the current persistence path.
- Add automated coverage that proves the reproduced apostrophe case is handled without a server-side failure.

## Context considered

- Repo/rules/skills consulted: `AGENTS.md`, `/.codex/codex-config.yaml`, `/.codex/project-structure.md`, `acac` skill, `establish-goals` skill.
- Relevant files (if any): `src/routes/schedule/+page.server.ts`, `src/lib/server/db.ts`, `src/test/api/schedule-page.test.ts`.
- Constraints (sandbox, commands, policy): Must follow ACAC stage order; no source edits before goals lock; repo verification commands are `npm run lint`, `npm run build`, and `npm run test`.

## Ambiguities

### Blocking (must resolve)

1. None.

### Non-blocking (can proceed with explicit assumptions)

1. The issue scope is limited to the schedule page's `comment` field and the existing server-side persistence path used by schedule submission.
2. "HTML escaping the text" is interpreted as applying the requested escaping/sanitization at the point needed to prevent apostrophes from breaking server-side schedule comment persistence, without broadening the task into a general input-sanitization redesign.
3. Extending the existing schedule-page automated tests is preferred unless reproduction shows a narrower server/data-layer test is the better fit.

## Questions for user

1. None.

## Assumptions (explicit; remove when confirmed)

1. Based on the current SQL string concatenation in `src/lib/server/db.ts`, an apostrophe-containing comment is expected to be reproducible as the reported server-side failure.
2. The fix should preserve the user's visible comment text semantics rather than stripping apostrophes from stored comments.

## Goals (1-20, verifiable)

1. Verify whether submitting a schedule-page comment containing one or more apostrophes reproduces a server-side failure in the current implementation.
2. If the apostrophe failure is verified, update the schedule comment persistence path so schedule submission succeeds when the comment includes apostrophes.
3. Keep the fix scoped to the schedule comment submission flow and avoid unrelated changes to scheduling behavior.
4. Add automated test coverage that exercises the apostrophe comment case through the affected schedule submission path and verifies the failure is prevented.
5. Preserve existing schedule comment behavior for non-apostrophe text while allowing apostrophe-containing comments to persist successfully.

## Non-goals (explicit exclusions)

- Redesigning the full database layer to use parameterized queries everywhere.
- Changing unrelated schedule form behavior, validation rules, or admin/program comment rendering beyond what is required for this bug.

## Success criteria (objective checks)

> Tie each criterion to a goal number when possible.

- [G1] Reproduction evidence shows whether the current schedule submission path fails when the comment contains apostrophes.
- [G2] When the issue is reproduced, the implementation prevents that server-side failure for apostrophe-containing schedule comments.
- [G3] The code change stays within the schedule submission path and its directly affected tests/task artifacts.
- [G4] Automated coverage includes a schedule comment containing an apostrophe and verifies successful handling.
- [G5] Existing plain-text comment submission behavior remains covered and passes.

## Risks / tradeoffs

- Escaping at the wrong layer could store altered comment text unexpectedly or mask a broader SQL-construction problem, so tests need to assert the persisted behavior of the schedule comment path.

## Next action

- Handoff: `prepare-takeoff` owns task scaffolding and `spec.md` readiness content.
