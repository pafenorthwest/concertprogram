# Final Phase — Hardening, Verification, and Closeout

> Stage 4 completion source of truth:
> mark items as complete with `[x]`, or leave unchecked with `EVALUATED: <decision + reason>`.

### Documentation updates
- [ ] `/doc` audit and updates EVALUATED: not-applicable; the fix is limited to
      an existing internal admin API route and no `/doc` artifact is impacted.
- [ ] YAML documentation contracts (`/doc/**/*.yaml`) EVALUATED:
      not-applicable; no public API contract or external schema changed.
- [ ] README updates EVALUATED: not-applicable; no user-facing workflow or
      setup instruction changed.
- [ ] ADRs (if any) EVALUATED: not-applicable; this is a localized bug repair
      with no durable architectural decision.
- [ ] Inline docs/comments EVALUATED: not-applicable; the route and DB changes
      remain readable without adding new inline commentary.

## Testing closeout
- [x] Missing cases to add: added `POST /api/program` reorder persistence
      coverage to `src/test/api/program-api.test.ts`.
- [x] Coverage gaps: targeted program API coverage now exercises the drag-save
      payload, persisted row ordering, and existing export/force-move behavior.

## Full verification
> Use the pinned commands in spec + `./codex/project-structure.md` + `./codex/codex-config.yaml`.
> Stage 4 requires explicit pass notation: `PASS`.

- [x] Lint: `npm run lint` PASS
- [x] Build: `npm run build` PASS
- [x] Tests: `npm run test` PASS (with the local app running via
      `npm run dev -- --host 127.0.0.1` for suites that call `localhost:8888`)

## Manual QA (if applicable)
- [ ] Steps EVALUATED: not-applicable; the task was verified through automated
      API and full-suite coverage.
- [ ] Expected EVALUATED: not-applicable; no manual-only behavior required
      validation.

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
- [ ] Feature flags EVALUATED: not-applicable; the repair restores the existing
      admin save path and is always-on.
- [ ] Backout plan EVALUATED: revert the `POST /api/program` route and related
      test/helper changes if the reorder persistence fix must be rolled back.

## Outstanding issues (if any)
For each issue include severity + repro + suggested fix.
- None.
