# Merged Performance Lookup

## Overview
Unify performer lookup and scheduling for multi-class wins within the same concert series + year. Any lookup code for a multi-win performer should resolve to a single scheduling context, showing all winning class names and merged repertoire, while presenting a single primary lookup code.

## Goals
- Resolve any valid lookup code to the same scheduling context for a performer within a concert series + year.
- Select a primary class code using the lowest `class_lottery.lottery` (numeric).
- Merge `adjudicated_pieces` across a multi-win performer’s classes during import, recomputed on every relevant import.
- Preserve existing behavior for single-win performers.
- Surface all winning class names on the schedule page.

## Non-goals
- Changing adjudication or placement logic.
- Merging across different concert series or years.
- Changing lookup authentication or exposing new PII.
- Reworking performance ordering or program generation beyond lookup behavior.

## Use cases / user stories
- Performer with multiple class wins can enter any lookup code and schedule once.
- Family member sees a single consolidated scheduling experience.
- Festival staff schedule the performer once while still seeing all winning classes.
- Admin can re-run imports safely; merges recompute idempotently.

## Current behavior
- Each class win creates a separate `performance` record.
- `lookupByCode` resolves a single performance/piece per lookup code.
- Schedule page shows one class’ lookup code and one class’ piece.
- Re-importing a performance clears and re-inserts only that class’ pieces.
- Key files:
  - `src/lib/server/db.ts` (lookupByCode, lookupByDetails)
  - `src/lib/server/import.ts` (Performance.initialize)
  - `src/lib/server/performerLookup.ts`
  - `src/routes/schedule/+page.server.ts`
  - `src/routes/schedule/+page.svelte`

## Proposed behavior
- Lookup by code/details resolves the performer + concert series + year, then returns:
  - Primary class code (lowest `class_lottery.lottery`).
  - Union of musical pieces across all performances in that series/year.
  - All winning class names for display.
  - Primary performance id for scheduling updates.
- Imports recompute piece unions for performer + series + year whenever a performance is inserted/updated.
- Behavior changes:
  - Lookup becomes performer/series/year-centric when multiple classes exist.
  - Schedule UI shows the class list and primary lookup code.
- Edge cases:
  - Single-win performers see the same behavior as today.
  - If class lottery data is missing, fall back to the lookup’s class as primary.
  - Duplicate musical pieces across classes are deduped in display.

## Technical design
### Architecture / modules impacted
- `src/lib/server/db.ts`
  - Add a unified lookup helper that aggregates class names and pieces.
  - Add a merge function to upsert `adjudicated_pieces` into the primary performance.
- `src/lib/server/import.ts`
  - Call the merge helper after each performance import/update.
- `src/lib/server/common.ts`
  - Extend `PerformerSearchResultsInterface` with primary code + class display fields.
- `src/lib/server/performerLookup.ts`
  - Pass through new fields in success mappings.
- `src/routes/schedule/+page.server.ts`
  - Include new fields in load data.
- `src/routes/schedule/+page.svelte`
  - Render class list and primary class code.
- Tests:
  - Extend `src/test/db/lookupByCode-multi-class.test.ts` for same-series multi-class.

### API changes (if any)
- No external API changes; internal lookup results include additional fields.

### UI/UX changes (if any)
- Schedule page shows:
  - Primary lookup code (lowest lottery).
  - All winning class names for the performer in that series/year.
  - Combined musical pieces (as a single display string).

### Data model / schema changes (PostgreSQL)
- No schema changes required.
- Merging is performed via `adjudicated_pieces` upserts into the primary performance.
- Backward compatibility: existing `performance` rows remain unchanged.
- Rollback: remove merge helper and restore lookup logic to class-only behavior.

## Build & Tooling
- Package manager: npm (lockfile: `package-lock.json`).

## Security & privacy
- No new PII.
- Lookup remains gated by code/details and existing sanitization.

## Observability (logs/metrics)
- Log when a multi-win merge occurs and which primary performance is chosen.
- Log lookup resolutions that use merged context (optional).

## Verification Commands
> Pin the exact commands discovered for this repo (also update `./codex-commands.md`).

- Lint:
  - `npm run lint`
- Build:
  - `npm run build`
- Test:
  - `npm run test`

## Test strategy
- Unit:
  - Primary class selection by lowest `class_lottery.lottery`.
  - Merge helper upserts without duplicates.
- Integration:
  - Import → merge → lookup with multiple classes in same series/year.
- E2E / UI (if applicable):
  - Schedule page displays primary code and class list.

## Acceptance criteria checklist
- [ ] Any lookup code for a performer resolves to the same scheduling context within a concert series/year.
- [ ] Primary class code is the lowest `class_lottery.lottery`.
- [ ] `adjudicated_pieces` unions are recomputed on relevant imports.
- [ ] Single-win performers experience no change.
- [ ] Schedule page shows all winning class names and primary class code.
