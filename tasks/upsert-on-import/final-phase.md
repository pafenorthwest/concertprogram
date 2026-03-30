# Final Phase — Hardening, Verification, and Closeout

> Stage 4 completion source of truth:
> mark items as complete with `[x]`, or leave unchecked with `EVALUATED: <decision + reason>`.

### Documentation updates
- [ ] `/doc` audit and updates EVALUATED: not-applicable; this task changes
      server-side import recovery behavior only and no `/doc` artifact was found
      to be impacted.
- [ ] YAML documentation contracts (`/doc/**/*.yaml`) EVALUATED:
      not-applicable; no public API contract changed.
- [ ] README updates EVALUATED: not-applicable; no user-facing workflow or setup
      changed.
- [ ] ADRs (if any) EVALUATED: not-applicable; the fix is a localized bug repair
      with no durable architectural decision.
- [ ] Inline docs/comments EVALUATED: deferred; the code change is
      self-explanatory and did not require new inline commentary.

## Testing closeout
- [x] Missing cases to add: added malformed-import recovery regression coverage
      to `src/test/db/import.test.ts`.
- [x] Coverage gaps: targeted DB coverage now exercises partial-failure retry and
      duplicate-row prevention for import.

## Full verification
> Use the pinned commands in spec + `./codex/project-structure.md` + `./codex/codex-config.yaml`.
> Stage 4 requires explicit pass notation: `PASS`.

- [x] Lint: `npm run lint` PASS
- [x] Build: `npm run build` PASS
- [ ] Tests: `npm run test` EVALUATED: blocked by unrelated timeout in
      `src/test/api/schedule-page.test.ts`, with the current rerun failing:
      `Valid Concerto page`, `rejects duplicate rankings`, and
      `rejects submissions missing rank 1`, while the dev service is already
      running.

## Manual QA (if applicable)
- [ ] Steps EVALUATED: not-applicable; no manual-only UI change was introduced
      for this task.
- [ ] Expected EVALUATED: not-applicable; verification relied on automated DB
      and repo commands.

## Code review checklist
- [x] Correctness and edge cases
- [x] Error handling / failure modes
- [x] Security (secrets, injection, authz/authn)
- [x] Performance (DB queries, hot paths, batching)
- [x] Maintainability (structure, naming, boundaries)
- [x] Consistency with repo conventions
- [x] Test quality and determinism

## Release / rollout notes (if applicable)
- [ ] Migration plan EVALUATED: not-applicable; no schema change.
- [ ] Feature flags EVALUATED: not-applicable; fix is always-on import behavior.
- [ ] Backout plan EVALUATED: revert the import query change and regression test
      if the fix must be rolled back.

## Outstanding issues (if any)
- Severity: medium. Repro: start the app with `npm run dev -- --host 127.0.0.1`
  and run `npm run test`; the suite times out in
  `src/test/api/schedule-page.test.ts > Valid Eastside page > Valid Concerto page`,
  `src/test/api/schedule-page.test.ts > Rank-choice variants > rejects duplicate rankings`,
  and `src/test/api/schedule-page.test.ts > Rank-choice variants > rejects submissions missing rank 1`.
  Suggested fix: stabilize the schedule-page test timing or raise its timeout
  after confirming the underlying page interaction behavior.
