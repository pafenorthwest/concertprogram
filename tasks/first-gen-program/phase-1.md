# Phase 1 — Server Export Path

## Objective
Add the server-side document export path and supporting helper logic needed to
generate a single-concert Word program that matches the approved Eastside and
Concerto header rules plus the entry formatting from the provided template.

## Code areas impacted
- `src/routes/api/program/+server.ts` or a minimal sibling route under
  `src/routes/api/program/`
- New helper code under `src/lib/server/`
- Checked-in template asset if required for deterministic generation

## Work items
- [x] Choose the narrowest export route shape that preserves the existing CSV
      behavior and supports a single-concert Word download.
- [x] Implement concert filtering and data shaping for the selected concert,
      including series-specific header text and concert time.
- [x] Implement DOCX generation that preserves the provided template layout,
      including stacked contributor lines and accompanist handling.
- [x] Ensure unsupported filter states fail fast instead of generating an
      invalid document.

## Deliverables
- A route or route extension that returns a downloadable `.docx` file for one
  selected concert.
- Supporting helper code that maps the existing program model into the
  template-backed export format.
- Deterministic template input stored in-repo if runtime generation requires
  it.

## Gate (must pass before proceeding)
Phase 1 is complete only when the server-side export path exists, handles the
selected-concert happy path, and rejects unsupported export requests cleanly.
- [ ] The export route returns a Word document response for a supported
- [x] The export route returns a Word document response for a supported
      single-concert request.
- [x] Eastside and Concerto header text are shaped according to the locked
      goals.
- [x] Invalid selections such as `All` or `Waitlist` are rejected or blocked
      before document generation.

## Verification steps
List exact commands and expected results.
- [x] Command: `npm run test -- src/test/lib/programExport.test.ts src/test/lib/programDocx.test.ts`
  - Expected: PASS. Result: PASS.
- [x] Command: manual helper inspection during implementation
  - Expected: Generated XML or extracted text contains the selected-concert
    header, piece, contributor, performer, age, and accompanist values.
    Result: confirmed via `unzip -p` assertions in `src/test/lib/programDocx.test.ts`.

## Risks and mitigations
- Risk: DOCX generation may depend on host ZIP tooling because the repo has
  no existing ZIP library.
- Mitigation: Keep the helper bounded, fail fast when tooling is unavailable,
  and verify the generated package structure in tests.
