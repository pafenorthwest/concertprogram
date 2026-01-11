# Phase 2 — API Tag Updates + Validation

## Objective
Update musicalpiece POST/PUT to accept optional tag arrays, validate them, and
write to tag tables.

## Code areas impacted
- `src/routes/api/musicalpiece/+server.ts`
- `src/routes/api/musicalpiece/[id]/+server.ts`
- `src/lib/server/review.ts`
- `src/test/api/musicalpiece-api.test.ts`

## Work items
- [ ] Parse `division_tags` and `category_tags` from request bodies.
- [ ] Validate tags against enum lists; dedupe values before insert/update.
- [ ] Enforce "Not Appropriate" exclusivity with 4xx error on mixed category
  requests.
- [ ] Support `rm_division_tags` and `rm_category_tags` on PUT with validation
  and exclusivity rules.
- [ ] Insert/update tag tables alongside musical_piece create/update.
- [ ] Add API test coverage for valid tags, invalid tags, and exclusivity
  errors.

## Deliverables
- API endpoints accept optional tag arrays and write to tag tables.
- Updated tests covering tag validation and exclusivity rules.

## Gate (must pass before proceeding)
- [ ] API requests with valid tags succeed and persist tags.
- [ ] Invalid tags or mixed "Not Appropriate" category requests return 4xx
  without partial updates.

## Verification steps
- [ ] Command: `npm run test`
  - Expected: musicalpiece API tests pass.

## Risks and mitigations
- Risk: Partial updates if tag insert fails after musical_piece update.
- Mitigation: Validate upfront and consider transaction scope for tag writes.
