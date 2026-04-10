# Final Phase — Hardening, Verification, and Closeout

> Stage 4 completion source of truth:
> mark items as complete with `[x]`, or leave unchecked with `EVALUATED: <decision + reason>`.

### Documentation updates

- [x] `/doc` audit and updates
- [ ] Enumerate documentation artifacts under `/doc` that are impacted by this change (API behavior, auth, error contracts, examples, migrations, ops notes). EVALUATED: not-applicable; the task is limited to the admin program page UI and does not change documented APIs or operational behavior.
- [ ] Update affected docs and ensure cross-links remain valid (README ↔ docs ↔ ADRs/runbooks). EVALUATED: not-applicable; no doc surfaces were impacted by this page-only restyle.

- [ ] YAML documentation contracts (`/doc/**/*.yaml`) EVALUATED: not-applicable; no API or schema contracts changed.
- [ ] Discover all YAML documentation files under `/doc` (recursive) and update any impacted by the change: EVALUATED: not-applicable; the implementation does not affect YAML-backed contracts.
- [ ] endpoint definitions, request/response schemas, auth schemes, error models EVALUATED: not-applicable; unchanged.
- [ ] examples (happy path + common failures) EVALUATED: not-applicable; unchanged.
- [ ] If a YAML contract/spec is required for this change but no matching file exists yet: EVALUATED: not-applicable; no new contract/spec is required.
- [ ] Create an initial YAML spec in `/doc/` using the repo’s conventions (OpenAPI/AsyncAPI/etc. as applicable) EVALUATED: not-applicable; no YAML spec needed for this UI task.
- [ ] Include minimum viable metadata (`info`, `servers`/environment targets, `securitySchemes` where relevant) plus at least one representative operation and shared error schema(s) EVALUATED: not-applicable; no YAML spec needed for this UI task.

- [x] README updates
- [ ] Add or refresh a single “Documentation” section linking to `/doc/` and any key YAML specs within it. EVALUATED: not-applicable; README documentation navigation is unaffected by the program page restyle.
- [ ] Include local validation/viewing instructions if the repo has them (lint/validate/render command). EVALUATED: not-applicable; no documentation surface changed.

- [x] ADRs (if any)
- [ ] Add/update an ADR when the change introduces a durable architectural decision (contract format, versioning policy, auth strategy, error envelope standardization). EVALUATED: not-applicable; no durable architectural decision was introduced.

- [x] Inline docs/comments
- [ ] Update inline comments/docstrings only where they add implementation clarity without duplicating the YAML contracts. EVALUATED: not-applicable; the Svelte changes remained clear without new inline comments.

## Testing closeout
- [x] Missing cases to add: no cheap existing UI test surface was present for this page-specific popover flow.
- [x] Coverage gaps: comment button and popover behavior were verified through code review plus full repo validation; no page-focused automated test was added in this task.

## Full verification
> Use the pinned commands in spec + `./codex/project-structure.md` + `./codex/codex-config.yaml`.
> Stage 4 requires explicit pass notation: `PASS`.

- [x] Lint: `npm run lint` PASS
- [x] Build: `npm run build` PASS
- [x] Tests: `npm run test` PASS

## Manual QA (if applicable)
- [ ] Steps: open `/admin/program`, confirm review-style container and controls, verify `Num in Series` is absent, click an enabled comment button to open the popover, dismiss it, and confirm disabled comment buttons do nothing. EVALUATED: deferred; browser QA was not run in this terminal session.
- [ ] Expected: review-style presentation is visible, comment buttons show enabled/disabled states clearly, and the full comment popover only opens for rows with comments. EVALUATED: deferred; expectations recorded for follow-up browser QA.

## Code review checklist
- [x] Correctness and edge cases
- [x] Error handling / failure modes
- [x] Security (secrets, injection, authz/authn)
- [x] Performance (DB queries, hot paths, batching)
- [x] Maintainability (structure, naming, boundaries)
- [x] Consistency with repo conventions
- [x] Test quality and determinism

## Release / rollout notes (if applicable)
- [x] Migration plan: none (UI-only change).
- [x] Feature flags: none.
- [x] Backout plan: revert `src/routes/admin/program/+page.svelte`.

## Outstanding issues (if any)
For each issue include severity + repro + suggested fix.
- None.
