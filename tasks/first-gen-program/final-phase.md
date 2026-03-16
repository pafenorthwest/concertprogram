# Final Phase — Hardening, Verification, and Closeout

> Stage 4 completion source of truth:
> mark items as complete with `[x]`, or leave unchecked with `EVALUATED: <decision + reason>`.

### Documentation updates
- [ ] `/doc` audit and updates EVALUATED: not-applicable; this change adds no
      new user-facing documentation contract under `/doc`.
- [ ] YAML documentation contracts (`/doc/**/*.yaml`) EVALUATED:
      not-applicable; no YAML API documentation exists for this route surface
      today and the change does not introduce a new public contract.
- [ ] README updates EVALUATED: not-applicable; the change is admin-local and
      does not alter project bootstrap or developer workflow.
- [ ] ADRs (if any) EVALUATED: not-applicable; the implementation does not
      introduce a durable architectural decision beyond task-local export code.
- [ ] Inline docs/comments EVALUATED: deferred; code stayed small enough that
      additional inline comments were not necessary.

## Testing closeout
- [x] Missing cases to add:
  - Added helper coverage for selector parsing and Word export URL behavior in
    `src/test/lib/programExport.test.ts`.
  - Added DOCX package coverage in `src/test/lib/programDocx.test.ts`.
- [ ] Coverage gaps: EVALUATED: none identified after the pinned full suite and
      focused export tests passed.

## Full verification
> Use the pinned commands in spec + `./codex/project-structure.md` + `./codex/codex-config.yaml`.
> Stage 4 requires explicit pass notation: `PASS`.

- [x] Lint: `npm run lint` PASS
- [x] Build: `npm run build` PASS
- [x] Tests: `npm run test` PASS

## Manual QA (if applicable)
- [ ] Steps: EVALUATED: deferred; no browser session was available in this
      environment.
- [ ] Expected: EVALUATED: deferred; automated focused verification covered the
      new selector logic and generated DOCX contents.

## Code review checklist
- [x] Correctness and edge cases
- [x] Error handling / failure modes
- [x] Security (secrets, injection, authz/authn)
- [x] Performance (DB queries, hot paths, batching)
- [x] Maintainability (structure, naming, boundaries)
- [x] Consistency with repo conventions
- [x] Test quality and determinism

## Release / rollout notes (if applicable)
- [ ] Migration plan: EVALUATED: not-applicable; no schema or data migration is
      involved.
- [ ] Feature flags: EVALUATED: not-applicable; the admin export change ships
      directly.
- [ ] Backout plan: EVALUATED: revert the admin export button wiring, the
      DOCX helper, the template asset, and the matching focused tests.

## Outstanding issues (if any)
- None.
