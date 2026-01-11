# Final Phase — Hardening, Verification, and Closeout

## Documentation updates
- [x] README updates: none expected.
- [x] ADRs (if any): none expected.
- [x] Inline docs/comments: add brief UI note or inline comment if multi-tag
  overwrite behavior needs clarification.

## Testing closeout
- [x] Missing cases to add: ensure invalid tag values and "Not Appropriate"
  exclusivity are covered.
- [x] Coverage gaps: UI behavior is manual-only (dropdown + note).

## Full verification
> Use the pinned commands in spec + `./codex-commands.md`.

- [x] Lint: `npm run lint`
- [x] Build: `npm run build`
- [x] Tests: `npm run test`

## Manual QA (if applicable)
- [x] Steps: open `/admin/musicalpiece`, verify dropdowns, save updates, observe
  note.
- [x] Expected: saves succeed and tags are reflected in subsequent loads.

## Code review checklist
- [x] Correctness and edge cases
- [x] Error handling / failure modes
- [x] Security (secrets, injection, authz/authn)
- [x] Performance (DB queries, hot paths, batching)
- [x] Maintainability (structure, naming, boundaries)
- [x] Consistency with repo conventions
- [x] Test quality and determinism

## Release / rollout notes (if applicable)
- [x] Migration plan: none.
- [x] Feature flags: none.
- [x] Backout plan: revert API/UI changes if needed.

## Outstanding issues (if any)
For each issue include severity + repro + suggested fix.
- Severity: low
- Repro: tag updates in POST/PUT are not wrapped in a single DB transaction.
- Suggested fix: optionally wrap musical_piece insert/update + tag updates in a single transaction to avoid partial writes.
