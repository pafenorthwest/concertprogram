# Final Phase — Hardening, Verification, and Closeout

> Stage 4 completion source of truth:
> mark items as complete with `[x]`, or leave unchecked with `EVALUATED: <decision + reason>`.

### Documentation updates

- [ ] `/doc` audit and updates EVALUATED: not-applicable; this change only affects tests and a local DOCX XML helper.
- [ ] YAML documentation contracts (`/doc/**/*.yaml`) EVALUATED: not-applicable; no API or schema contract changed.
- [ ] README updates EVALUATED: not-applicable; no user-facing workflow or repo command changed.
- [ ] ADRs (if any) EVALUATED: not-applicable; no durable architecture decision changed.
- [ ] Inline docs/comments EVALUATED: deferred; the touched code remained clear without new comments.

## Testing closeout

- [x] Missing cases to add: updated the DOCX export test for the new performer-line text and rewrote the stale Eastside overflow test to use deterministic rank-1 blockers.
- [x] Coverage gaps: targeted coverage now matches the reviewed behavior for the two failing cases; no additional gaps were identified in-scope.

## Full verification

> Use the pinned commands in spec + `./codex/project-structure.md` + `./codex/codex-config.yaml`.
> Stage 4 requires explicit pass notation: `PASS`.

- [x] Lint: `npm run lint` PASS
- [x] Build: `npm run build` PASS
- [ ] Tests: `npm run test` EVALUATED: blocked by an existing timeout in `src/test/api/schedule-page.test.ts` (`Valid Concerto page`, 30s timeout). Targeted verification for the touched surfaces passed with `npm test -- --run src/test/db/program.test.ts src/test/lib/programDocx.test.ts`.

## Manual QA (if applicable)

- [ ] Steps: EVALUATED: not-applicable; no manual UI workflow was changed.
- [ ] Expected: EVALUATED: not-applicable; no manual QA was required for this scope.

## Code review checklist

- [x] Correctness and edge cases
- [x] Error handling / failure modes
- [x] Security (secrets, injection, authz/authn)
- [x] Performance (DB queries, hot paths, batching)
- [x] Maintainability (structure, naming, boundaries)
- [x] Consistency with repo conventions
- [x] Test quality and determinism

## Release / rollout notes (if applicable)

- [ ] Migration plan: EVALUATED: not-applicable; no migration.
- [ ] Feature flags: EVALUATED: not-applicable; no flag-controlled behavior.
- [ ] Backout plan: EVALUATED: straightforward revert of the touched test and DOCX helper files.

## Outstanding issues (if any)

- Severity: medium
- Repro: `npm test -- --run src/test/api/schedule-page.test.ts`
- Suggested fix: investigate why `src/test/api/schedule-page.test.ts` test `Valid Concerto page` exceeds the 30s timeout; this blocker is outside the touched files for this task.
