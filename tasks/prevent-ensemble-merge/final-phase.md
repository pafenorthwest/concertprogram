# Final Phase — Hardening, Verification, and Closeout

> Stage 4 completion source of truth:
> mark items as complete with `[x]`, or leave unchecked with `EVALUATED: <decision + reason>`.

### Documentation updates

- [ ] Documentation updates EVALUATED: not-applicable because this task changes
      merge logic and DB regression coverage only; no user-facing docs or API
      docs need updates.

## Testing closeout
- [x] Missing cases to add: the reported `WEP.8-13.A1` plus `WS.12-13.A1`
      ensemble-versus-solo regression is now covered in
      `src/test/db/lookupByCode-multi-class.test.ts`.
- [x] Coverage gaps: existing same-series non-ensemble merge coverage continues
      to live in `src/test/db/lookupByCode-multi-class.test.ts`; no new scoped
      gaps were identified for this change.

## Full verification
> Use the pinned commands in spec + `./codex/project-structure.md` + `./codex/codex-config.yaml`.
> Stage 4 requires explicit pass notation: `PASS`.

- [x] Lint: `npm run lint` PASS
- [x] Build: `set -a; source /Users/eric/side-projects/concertprogram/.env; set +a; npm run build` PASS
- [ ] Tests: `set -a; source /Users/eric/side-projects/concertprogram/.env; set +a; npm run test` EVALUATED:
      blocked by unrelated existing full-suite failures outside this task's
      scope, including `src/test/db/import.test.ts > refreshes selected
      performance pieces for single-performance reimports` and multiple API test
      suites timing out at 5s.

## Manual QA (if applicable)
- [ ] Manual QA EVALUATED: not-applicable because the scoped DB regression and
      repo verification commands are the relevant checks for this server-side
      change.

## Code review checklist
- [x] Correctness and edge cases
- [x] Error handling / failure modes
- [x] Security (secrets, injection, authz/authn)
- [x] Performance (DB queries, hot paths, batching)
- [x] Maintainability (structure, naming, boundaries)
- [x] Consistency with repo conventions
- [x] Test quality and determinism

## Release / rollout notes (if applicable)
- [ ] Release notes EVALUATED: not-applicable because this change is a server-side
      merge rule with no migration or rollout flag.

## Outstanding issues (if any)
- Severity: medium. Repro: `set -a; source /Users/eric/side-projects/concertprogram/.env; set +a; npm run test -- src/test/db/import.test.ts` fails the existing
  `refreshes selected performance pieces for single-performance reimports` case
  because the shared local `pafe` database returns an unrelated lookup result.
  Suggested fix: run the DB suite against an isolated test database or tighten
  test data uniqueness and cleanup so fixed lottery codes cannot collide with
  leftover local rows.
- Severity: medium. Repro: `set -a; source /Users/eric/side-projects/concertprogram/.env; set +a; npm run test` times out across multiple existing API suites,
  including `searchPerformer-api`, `review-authorization-api`, `program-api`,
  `performance-api`, `lottery-api`, `musicalpiece-api`, `import-api`, and
  `contributor-api`. Suggested fix: investigate the API test harness/runtime
  expectations in this environment before using the full suite as a landing
  gate.
