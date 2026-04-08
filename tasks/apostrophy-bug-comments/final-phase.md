# Final Phase — Hardening, Verification, and Closeout

> Stage 4 completion source of truth:
> mark items as complete with `[x]`, or leave unchecked with `EVALUATED: <decision + reason>`.

### Documentation updates

- [ ] `/doc` audit and updates EVALUATED: not applicable; the fix is limited to
      one server-side comment persistence path and does not change documented
      API or user workflow behavior.
- [ ] YAML documentation contracts (`/doc/**/*.yaml`) EVALUATED: not
      applicable; no endpoint contract or schema changed.
- [ ] README updates EVALUATED: not applicable; no contributor-facing workflow
      or setup instructions changed.
- [ ] ADRs (if any) EVALUATED: not applicable; the change is a localized query
      safety fix, not a durable architectural decision.
- [ ] Inline docs/comments EVALUATED: not needed; the parameterized query is
      self-explanatory in the updated helper.

## Testing closeout
- [x] Missing cases to add: added schedule submission coverage for apostrophe
      comments in `src/test/db/lookupByCode-multi-class.test.ts`.
- [ ] Coverage gaps: EVALUATED: none identified for the affected schedule
      comment path beyond the unrelated repo-wide failures listed below.

## Full verification
> Use the pinned commands in spec + `./codex/project-structure.md` + `./codex/codex-config.yaml`.
> Stage 4 requires explicit pass notation: `PASS`.

- [x] Lint: `npm run lint` PASS
- [x] Build: `npm run build` PASS
- [ ] Tests: `npm run test` EVALUATED: blocked by unrelated existing failures in
      `src/test/db/import.test.ts` (`refreshes selected performance pieces for
      single-performance reimports`) and `src/test/api/schedule-page.test.ts`
      (`Valid Concerto page` timed out at 30000ms); targeted task verification
      passed with `npm run test -- src/test/db/lookupByCode-multi-class.test.ts`
      and `npm run test -- src/test/db/lookupByCode-multi-class.test.ts -t "accepts apostrophes in schedule comments during submission"`.

## Manual QA (if applicable)
- [ ] Steps: EVALUATED: not run separately; the server-action regression test
      covered reproduction and persisted comment behavior.
- [ ] Expected: EVALUATED: schedule submission accepts apostrophe comments and
      lookup returns the unchanged apostrophe-containing value.

## Code review checklist
- [x] Correctness and edge cases
- [x] Error handling / failure modes
- [x] Security (secrets, injection, authz/authn)
- [x] Performance (DB queries, hot paths, batching)
- [x] Maintainability (structure, naming, boundaries)
- [x] Consistency with repo conventions
- [x] Test quality and determinism

## Release / rollout notes (if applicable)
- [ ] Migration plan: EVALUATED: not applicable; no schema change.
- [ ] Feature flags: EVALUATED: not applicable; no rollout toggle needed.
- [ ] Backout plan: EVALUATED: revert the localized
      `updateConcertPerformance` change and the apostrophe regression test.

## Outstanding issues (if any)
- Severity: medium. Repro: `npm run test` currently fails in
  `src/test/db/import.test.ts` because `refreshes selected performance pieces
  for single-performance reimports` expects `Updated Refresh Piece` but receives
  `Missing Rank Sonata`. Suggested fix: investigate the existing import refresh
  behavior separately; this task did not touch the import path.
- Severity: medium. Repro: `npm run test` currently fails in
  `src/test/api/schedule-page.test.ts` because `Valid Concerto page` times out
  after 30000ms. Suggested fix: investigate the existing Playwright concerto
  schedule flow or increase timeout only if the scenario is legitimately
  longer-running.
