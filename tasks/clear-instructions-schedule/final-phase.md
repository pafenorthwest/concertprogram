# Final Phase — Hardening, Verification, and Closeout

> Stage 4 completion source of truth:
> mark items as complete with `[x]`, or leave unchecked with
> `EVALUATED: <decision + reason>`.

### Documentation updates
- [ ] `/docs` audit and updates EVALUATED: not-applicable because the task only
      clarified in-page schedule instructions and did not change documented
      APIs or data contracts.
- [ ] README updates EVALUATED: not-applicable because the user-facing schedule
      workflow in README did not materially change.
- [ ] Inline docs/comments EVALUATED: not-applicable because the new UI copy
      and helper state remain self-explanatory without extra comments.

## Testing closeout
- [x] Missing cases to add: none identified beyond the updated route coverage.
- [x] Coverage gaps: none identified for the locked page-local scope.

## Full verification
> Use the pinned commands in spec + `./codex/project-structure.md` +
> `./codex/codex-config.yaml`.
> Stage 4 requires explicit pass notation: `PASS`.

- [x] Lint: `npm run lint` PASS
- [x] Build: `npm run build` PASS
- [x] Tests: `npm run test` PASS

## Manual QA (if applicable)
- [ ] Steps EVALUATED: not-applicable because the updated `/schedule` flow was
      exercised by Playwright route tests against the local dev server.
- [ ] Expected EVALUATED: not-applicable for the same reason.

## Code review checklist
- [x] Correctness and edge cases
- [x] Error handling / failure modes
- [x] Security (secrets, injection, authz/authn)
- [x] Performance (DB queries, hot paths, batching)
- [x] Maintainability (structure, naming, boundaries)
- [x] Consistency with repo conventions
- [x] Test quality and determinism

## Release / rollout notes (if applicable)
- [ ] Migration plan EVALUATED: not-applicable because no schema or data
      migration is involved.
- [ ] Feature flags EVALUATED: not-applicable because the change is a direct
      page-copy/UI improvement.
- [x] Backout plan: revert the `/schedule` page copy/help changes and the
      matching test assertions.

## Outstanding issues (if any)
For each issue include severity + repro + suggested fix.
- Severity: low
- Repro: run `npm run build` with `.env` loaded.
- Suggested fix: address the existing SvelteKit/Svelte export deprecation
  warnings (`untrack`, `fork`, `settled`, and `csrf.checkOrigin`) separately
  from this page-copy task.
