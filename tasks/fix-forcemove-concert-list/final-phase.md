# Final Phase — Hardening, Verification, and Closeout

> Stage 4 completion source of truth:
> mark items as complete with `[x]`, or leave unchecked with `EVALUATED: <decision + reason>`.

## Planned implementation summary

- Phase 1: add the missing force-move endpoint for the existing admin page request contract.
- Phase 2: persist Eastside and waitlist placement changes with the smallest server-side write surface that preserves current program behavior.
- Phase 3: add regression tests and record full lint/build/test verification.

### Documentation updates

* [ ] `/doc` audit and updates EVALUATED: not-applicable; no `/doc` contract or user-facing documentation changed for this backend/admin fix.

  * [ ] Enumerate documentation artifacts under `/doc` that are impacted by this change (API behavior, auth, error contracts, examples, migrations, ops notes). EVALUATED: none impacted.
  * [ ] Update affected docs and ensure cross-links remain valid (README ↔ docs ↔ ADRs/runbooks). EVALUATED: no doc updates required.

* [ ] YAML documentation contracts (`/doc/**/*.yaml`) EVALUATED: not-applicable; this repo does not require a YAML contract update for the internal admin move route.

  * [ ] Discover all YAML documentation files under `/doc` (recursive) and update any impacted by the change: EVALUATED: none impacted.

    * [ ] endpoint definitions, request/response schemas, auth schemes, error models EVALUATED: none required.
    * [ ] examples (happy path + common failures) EVALUATED: none required.
  * [ ] If a YAML contract/spec is required for this change but no matching file exists yet: EVALUATED: not-applicable; no new YAML spec required.

    * [ ] Create an initial YAML spec in `/doc/` using the repo’s conventions (OpenAPI/AsyncAPI/etc. as applicable) EVALUATED: not-applicable.
    * [ ] Include minimum viable metadata (`info`, `servers`/environment targets, `securitySchemes` where relevant) plus at least one representative operation and shared error schema(s) EVALUATED: not-applicable.

* [ ] README updates EVALUATED: not-applicable; no contributor-facing workflow changed.

  * [ ] Add or refresh a single “Documentation” section linking to `/doc/` and any key YAML specs within it. EVALUATED: not-applicable.
  * [ ] Include local validation/viewing instructions if the repo has them (lint/validate/render command). EVALUATED: not-applicable.

* [ ] ADRs (if any) EVALUATED: not-applicable; no durable architectural decision was introduced.

  * [ ] Add/update an ADR when the change introduces a durable architectural decision (contract format, versioning policy, auth strategy, error envelope standardization). EVALUATED: not-applicable.

* [ ] Inline docs/comments EVALUATED: not-applicable; the changed code remained clear without adding new comments.

  * [ ] Update inline comments/docstrings only where they add implementation clarity without duplicating the YAML contracts. EVALUATED: not-applicable.

## Testing closeout
- [ ] Missing cases to add: EVALUATED: none required beyond Eastside and waitlist regression coverage added in this task.
- [ ] Coverage gaps: EVALUATED: none known for the requested force-move workflow.

## Full verification
> Use the pinned commands in spec + `./codex/project-structure.md` + `./codex/codex-config.yaml`.
> Stage 4 requires explicit pass notation: `PASS`.

- [x] Lint: `npm run lint` PASS
- [x] Build: `npm run build` PASS
- [x] Tests: `npm run test` PASS

## Manual QA (if applicable)
- [ ] Steps: EVALUATED: not-applicable; automated API, DB, and browser tests covered the requested workflow.
- [ ] Expected: EVALUATED: not-applicable.

## Code review checklist
- [x] Correctness and edge cases
- [x] Error handling / failure modes
- [x] Security (secrets, injection, authz/authn)
- [x] Performance (DB queries, hot paths, batching)
- [x] Maintainability (structure, naming, boundaries)
- [x] Consistency with repo conventions
- [x] Test quality and determinism

## Release / rollout notes (if applicable)
- [ ] Migration plan: EVALUATED: not-applicable; no schema change.
- [ ] Feature flags: EVALUATED: not-applicable.
- [ ] Backout plan: EVALUATED: revert the program move route/helper and associated regression tests.

## Outstanding issues (if any)
For each issue include severity + repro + suggested fix.
- None.
