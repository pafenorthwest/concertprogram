# establish-goals

## Status

- Iteration: v0
- State: locked
- Task name (proposed, kebab-case): repair-program-button

## Request restatement

- Review the `first-gen-program` implementation that added the admin `Program`
  export button, determine why that button now fails to generate a document,
  and repair the regression with the minimum code and test changes required.

## Context considered

- Repo/rules/skills consulted:
  - `AGENTS.md`
  - `/Users/eric/.codex/skills/acac/SKILL.md`
  - `/Users/eric/.codex/skills/establish-goals/SKILL.md`
  - `.codex/goals/establish-goals.template.md`
  - `.codex/goals/establish-goals.checklist.md`
- Relevant files (if any):
  - `tasks/first-gen-program/spec.md`
  - `tasks/first-gen-program/audit-log.md`
  - `goals/first-gen-program/goals.v1.md`
  - `src/routes/admin/program/+page.server.ts`
  - `src/routes/admin/program/+page.svelte`
  - `src/routes/api/program/+server.ts`
  - `src/lib/server/programDocx.ts`
  - `src/test/lib/programDocx.test.ts`
  - `src/test/lib/programExport.test.ts`
- Constraints (sandbox, commands, policy):
  - Goal lock required before planning or code changes.
  - Work must stay narrowly scoped to the admin program export regression and
    required verification coverage.
  - Verification must preserve the repo command classes `lint`, `build`, and
    `test`.

## Ambiguities

### Blocking (must resolve)

1. None at this stage.

### Non-blocking (can proceed with explicit assumptions)

1. The requested outcome includes fixing the regression, not only explaining
   it, because the task name is `repair-program-button`.
2. The failing behavior is within the `first-gen-program` export flow and can
   be reproduced or reasoned about from the current codebase plus verification
   commands.

## Questions for user

1. None.

## Assumptions (explicit; remove when confirmed)

1. The correct scope is to investigate the shipped `Program` export path added
   by `first-gen-program`, identify the concrete regression cause, and make the
   smallest repair that restores document generation.
2. Existing admin page behavior outside the export control and export route is
   out of scope unless directly required to fix the regression.

## Goals (1-20, verifiable)

1. Reconstruct the intended `Program` export behavior from the locked
   `first-gen-program` task artifacts and current code so the regression is
   diagnosed against the original contract.
2. Determine the concrete root cause that prevents the admin `Program` button
   flow from generating a `.docx` document and document that cause in the task
   artifacts.
3. Repair the export path so selecting a supported concert from the admin
   program page once again returns a downloadable `.docx` document.
4. Keep the fix scoped to the admin program export surface and only the minimum
   supporting server/helper/test files required by the repair.
5. Add or update automated coverage that would fail on the identified
   regression and pass once the repair is in place.

## Non-goals (explicit exclusions)

- Reworking unrelated admin program ordering, filtering, drag-and-drop, or
  force-move behavior.
- Expanding the Word export feature beyond the behavior already approved in
  `first-gen-program`.

## Success criteria (objective checks)

> Tie each criterion to a goal number when possible.

- [G1] The current implementation and `first-gen-program` artifacts are
  reviewed closely enough to state the intended export behavior and compare it
  to the broken path.
- [G2] A specific failing condition in the present codebase is identified and
  recorded as the reason the `Program` button no longer generates a document.
- [G3][G4] A supported admin program selection produces a successful `.docx`
  response again without broadening the affected file surface beyond what the
  repair requires.
- [G5] Automated coverage exercises the repaired path or its root-cause guard
  and passes under the repository verification commands.

## Risks / tradeoffs

- The failure may depend on environment differences between local development
  and the original `first-gen-program` work, so reproducing it may require both
  code inspection and targeted verification.

## Next action

- Ready to lock
