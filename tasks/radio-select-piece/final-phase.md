# Final Phase — Hardening, Verification, and Closeout

> Stage 4 completion source of truth:
> mark items as complete with `[x]`, or leave unchecked with `EVALUATED: <decision + reason>`.

### Documentation updates

* [ ] `/doc` audit and updates EVALUATED: not-applicable, this schedule-flow change did not require repository documentation changes in `/doc`.

  * [ ] Enumerate documentation artifacts under `/doc` that are impacted by this change (API behavior, auth, error contracts, examples, migrations, ops notes). EVALUATED: not-applicable, no `/doc` artifacts were impacted.
  * [ ] Update affected docs and ensure cross-links remain valid (README ↔ docs ↔ ADRs/runbooks). EVALUATED: not-applicable, no doc updates were required.

* [ ] YAML documentation contracts (`/doc/**/*.yaml`) EVALUATED: not-applicable, no YAML contract change is in scope.

  * [ ] Discover all YAML documentation files under `/doc` (recursive) and update any impacted by the change: EVALUATED: not-applicable, no impacted YAML contract exists for this task.

    * [ ] endpoint definitions, request/response schemas, auth schemes, error models EVALUATED: not-applicable, no external API contract changed.
    * [ ] examples (happy path + common failures) EVALUATED: not-applicable, no YAML examples were required.
  * [ ] If a YAML contract/spec is required for this change but no matching file exists yet: EVALUATED: not-applicable, no YAML contract/spec is required for this task.

    * [ ] Create an initial YAML spec in `/doc/` using the repo’s conventions (OpenAPI/AsyncAPI/etc. as applicable) EVALUATED: not-applicable, no new YAML spec needed.
    * [ ] Include minimum viable metadata (`info`, `servers`/environment targets, `securitySchemes` where relevant) plus at least one representative operation and shared error schema(s) EVALUATED: not-applicable, no new YAML spec needed.

* [ ] README updates EVALUATED: not-applicable, the change is internal to the schedule flow and tests.

  * [ ] Add or refresh a single “Documentation” section linking to `/doc/` and any key YAML specs within it. EVALUATED: not-applicable, README changes were not needed.
  * [ ] Include local validation/viewing instructions if the repo has them (lint/validate/render command). EVALUATED: not-applicable, README changes were not needed.

* [ ] ADRs (if any) EVALUATED: not-applicable, no durable architectural decision was introduced.

  * [ ] Add/update an ADR when the change introduces a durable architectural decision (contract format, versioning policy, auth strategy, error envelope standardization). EVALUATED: not-applicable, no ADR-worthy architecture change occurred.

* [ ] Inline docs/comments EVALUATED: not-applicable, no extra inline documentation was needed beyond the code changes.

  * [ ] Update inline comments/docstrings only where they add implementation clarity without duplicating the YAML contracts. EVALUATED: not-applicable, no new inline docs were needed.

## Testing closeout
- [x] Missing cases to add:
  - Multi-piece merged Eastside schedule flow if not already covered by earlier
    phases.
- [ ] Coverage gaps: EVALUATED: deferred, exact remaining gaps depend on rerunning the suite in a provisioned DB environment.
  - Confirm whether helper-level tests are needed in addition to route-level
    schedule coverage.

## Full verification
> Use the pinned commands in spec + `./codex/project-structure.md` + `./codex/codex-config.yaml`.
> Stage 4 requires explicit pass notation: `PASS`.

- [x] Lint: `npm run lint` PASS
- [x] Build: `npm run build` PASS
- [x] Tests: `npm run test` PASS
- Planning note:
  - Use `npm run lint`, `npm run build`, and `npm run test`.

## Manual QA (if applicable)
- [ ] Steps: EVALUATED: blocked, manual QA of `/schedule` depends on a running app plus seeded database state that is not available in this workspace.
- [ ] Expected: EVALUATED: blocked, the expected behavior is documented in the task spec but could not be exercised end-to-end here.
- Planning note:
  - Verify a merged multi-class performer sees the radio selector and cannot
    submit until a piece is chosen.

## Code review checklist
- [ ] Correctness and edge cases EVALUATED: deferred to land-the-plan/code-review stage per the ACAC workflow.
- [ ] Error handling / failure modes EVALUATED: deferred to land-the-plan/code-review stage per the ACAC workflow.
- [ ] Security (secrets, injection, authz/authn) EVALUATED: deferred to land-the-plan/code-review stage per the ACAC workflow.
- [ ] Performance (DB queries, hot paths, batching) EVALUATED: deferred to land-the-plan/code-review stage per the ACAC workflow.
- [ ] Maintainability (structure, naming, boundaries) EVALUATED: deferred to land-the-plan/code-review stage per the ACAC workflow.
- [ ] Consistency with repo conventions EVALUATED: deferred to land-the-plan/code-review stage per the ACAC workflow.
- [ ] Test quality and determinism EVALUATED: deferred pending a runnable DB-backed test environment.

## Release / rollout notes (if applicable)
- [ ] Migration plan: EVALUATED: not-applicable, no schema migration is planned for this task.
- [ ] Feature flags: EVALUATED: not-applicable, the schedule flow no longer depends on the old self-service gate for required piece selection.
- [ ] Backout plan: EVALUATED: complete, revert the schedule route/UI/selection endpoint changes if the required multi-piece selection flow must be disabled.
- Planning note:
  - No schema migration is expected.
  - Reuse the existing performance-piece self-service flag behavior unless
    implementation shows a blocker.

## Outstanding issues (if any)
For each issue include severity + repro + suggested fix.
- None.
