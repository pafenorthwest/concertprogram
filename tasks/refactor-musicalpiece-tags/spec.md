# Refactor Musical Piece Tags

## Overview
Add Division and Category tag handling to the musicalpiece API and the admin
musical piece UI while honoring existing database constraints, including the
"Not Appropriate" trigger behavior.

## Goals
- Accept optional division/category tag updates in `src/routes/api/musicalpiece`
  (create + update).
- Deduplicate tags per musical piece and validate tag values against existing
  enums.
- Enforce the "Not Appropriate" category exclusivity with a 4xx error when mixed
  with other categories.
- Support tag removals on PUT via `rm_division_tags` and `rm_category_tags`.
- Update the admin UI to allow single-select category/division tags, with a note
  that multi-tag updates are API-only.
- Maintain backward compatibility for existing clients unless explicitly
  approved.

## Non-goals
- No changes to `src/routes/api/import`.
- No schema migrations or enum changes.
- No multi-tag UI editing beyond a single-select dropdown.
- No changes to review queue logic outside of shared helpers.

## Use cases / user stories
- API client can create a musical piece with one or more division tags and one
  or more category tags.
- API client can update tags for an existing musical piece with validation and
  deduplication.
- Admin user can select a single category and division tag for a musical piece
  via UI.
- Admin user understands multi-tag behavior is API-only and may overwrite
  existing tags.

## Current behavior
- Musical piece API (`src/routes/api/musicalpiece/+server.ts`,
  `src/routes/api/musicalpiece/[id]/+server.ts`) only inserts/updates the
  `musical_piece` table; tag tables are not updated.
- Admin UI (`src/routes/admin/musicalpiece/+page.svelte`,
  `src/routes/admin/musicalpiece/+page.server.ts`) lists musical pieces with no
  tag fields.
- Tag tables (`database/init.sql`) exist with enums `piece_category` and
  `division_tag` plus triggers enforcing "Not Appropriate".
- Tag helpers exist in `src/lib/server/review.ts` for validation and tag
  updates.

## Proposed behavior
- Musicalpiece POST/PUT accepts optional `division_tags` and `category_tags`
  fields.
  - Input accepts arrays of strings (deduped before insert/update).
  - If `category_tags` includes `'Not Appropriate'` with any other category,
    return 4xx and do not apply updates.
  - Invalid tag values return 4xx with a clear reason.
  - If tags are omitted, existing tags remain unchanged (PUT) or no tags are
    created (POST).
- Musicalpiece PUT accepts optional `rm_division_tags` and `rm_category_tags`
  fields.
  - Removal arrays are deduped and validated; invalid values return 4xx.
  - `rm_category_tags` cannot remove `'Not Appropriate'`; attempts return 4xx.
  - `rm_category_tags` and `rm_division_tags` cannot be combined with
    `division_tags` or `category_tags` in the same request.
  - Empty removal arrays are treated as no-ops.
- Admin UI shows dropdowns for a single Category and Division tag per piece.
  - A UI note explains multi-tag updates are API-only and saving from UI will
    replace tags with the selected single value.
  - When existing DB data contains multiple tags, the UI will display the first
    tag (sorted) and the note clarifies overwrite behavior.

## Technical design
### Architecture / modules impacted
- `src/routes/api/musicalpiece/+server.ts` (POST create)
- `src/routes/api/musicalpiece/[id]/+server.ts` (PUT update)
- `src/lib/server/review.ts` (reuse validation + setters)
- `src/routes/admin/musicalpiece/+page.server.ts` (load tags for UI)
- `src/routes/admin/musicalpiece/+page.svelte` (single-select controls + note)
- `src/test/api/musicalpiece-api.test.ts` (new API validation coverage)

### API changes (if any)
- Request body additions (optional):
  - `division_tags`: string[] (values in `division_tag` enum)
  - `category_tags`: string[] (values in `piece_category` enum)
  - `rm_division_tags`: string[] (values in `division_tag` enum, PUT only)
  - `rm_category_tags`: string[] (values in `piece_category` enum, PUT only)
- Responses unchanged except for new 4xx validation errors when tags are invalid
  or "Not Appropriate" is combined with other categories.
- Explicit permission required before finalizing these contract changes.

### UI/UX changes (if any)
- Add single-select dropdowns for Category and Division tags.
- Add a note: multi-tag updates are API-only; UI will replace tags with the
  chosen single selection.

### Data model / schema changes (PostgreSQL)
- Migrations: none.
- Backward compatibility: tag tables already exist; API updates use existing
  tables and triggers.
- Rollback: revert API/UI changes; no DB rollback needed.

## Security & privacy
- Keep existing auth checks on musicalpiece API.
- Validate tags against enum lists to prevent invalid values from reaching the
  database.

## Observability (logs/metrics)
- No new logging required; consider adding minimal error messages in 4xx
  responses for invalid tags.

## Verification Commands
> Pin the exact commands discovered for this repo (also update
> `./codex-commands.md`).

- Lint:
  - `npm run lint`
- Build:
  - `npm run build`
- Test:
  - `npm run test`

## Test strategy
- Unit: validation helpers for tags (if extracted).
- Integration: update `src/test/api/musicalpiece-api.test.ts` to cover tag
  insert/validation.
- E2E / UI: manual check in admin page for dropdowns and note.

## Acceptance criteria checklist
- [ ] POST `/api/musicalpiece` inserts division/category tag rows when provided
  and valid.
- [ ] PUT `/api/musicalpiece/[id]` replaces tags when provided; leaves tags
  untouched when omitted.
- [ ] PUT `/api/musicalpiece/[id]` removes tags when `rm_*` fields are provided
  and valid.
- [ ] Division tags are deduplicated; invalid values return 4xx.
- [ ] Category tags are deduplicated; invalid values return 4xx.
- [ ] Requests containing `category_tags` with `'Not Appropriate'` plus other
  categories return 4xx.
- [ ] Requests with `rm_*` fields combined with `division_tags` or
  `category_tags` return 4xx.
- [ ] Requests attempting to remove `'Not Appropriate'` return 4xx.
- [ ] Admin UI shows single-select dropdowns for Category and Division tags with
  a note about API-only multi-tag support.
- [ ] No changes to `src/routes/api/import`.
