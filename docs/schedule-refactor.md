# Schedule Flow Refactor Scope

## Goals

- Refactor schedule flow to reduce redundancy, improve testability, and encapsulate logic in server-side classes.
- Drive UI mode (confirm-only vs rank-choice) by slot count, not series name.
- Support rank-choice for up to 10 slots; allow partial rankings but require exactly one rank 1, no duplicate ranks.
- Treat “not available” as first-class persisted data.
- Introduce row-per-slot storage for schedule choices in a new table.
- Keep existing query params stable; form field names may change.

## Non-Goals

- Do not change performer lookup query params or URL structure.
- Do not remove caching or CORS behavior in hooks unless required.
- Do not implement client-only validation as the sole guard; server validation must remain authoritative.
- Do not rely on series name to pick mode.
- Legacy support is not a goal.
- Backwards compatibility is not a goal.

## Task List

### Design domain & storage

- Define new table schema (migration) for row-per-slot schedule choices: performer_id, concert_series, year, slot_id (concert_times ref), rank (nullable), not_available (bool), timestamps.
- Decide slot identifier mapping (e.g., from concert_times via cache) and ordering by concert_number_in_series.

### Implement repository layer

- Add ScheduleRepository for reading/writing schedules using the new table and performance duration/comment updates.
- Ensure methods handle partial ranks, enforce unique ranks, at least one rank 1, and persist not_available.

### Slot service

- Build SlotCatalog that loads slots for a series/year (from cache/DB), sorts by concert_number_in_series, and exposes slotCount plus display/normalized times.

### Lookup service

- Create PerformerLookup wrapping code/details search with sanitization and status mapping, preserving existing query params.

### Mapping & validation

- Add ScheduleMapper to translate repository rows to/from UI form model for both modes (confirm-only when slotCount === 1; rank-choice otherwise, up to 10 slots).
- Add ScheduleValidator enforcing: at least one rank 1, ranks unique, rank range 1..slotCount, allow partial ranks, allow not_available, confirm-only requires explicit confirmation.

### Refactor server load/action (+page.server.ts)

- In load: sanitize inputs, lookup performer, build schedule context from slots, fetch saved schedule, map to view model; return consistent status payloads.
- In actions.add: parse form (field names can change), validate via ScheduleValidator, persist via ScheduleRepository, redirect on success. Remove series-name branching; branch on slotCount.

### Update Svelte page (+page.svelte)

- Render dynamically from mode and slots; no hard-coded 4-slot UI. Generate rank selects (1..slotCount) and not-available checkboxes per slot. Allow partial ranks; keep/adjust minimal client feedback consistent with server rules.
- Maintain existing query params usage; update form field names to align with new server expectations.

### Common utilities

- Replace legacy helpers (parseRankChoice, hard-coded timestamp transforms) with generalized utilities for variable slot counts and display formatting.

### Tests

- Expand schedule-page.test.ts for confirm-only (any single-slot series) and rank-choice with 2, 4, 10 slots; cover partial ranks, duplicate-rank rejection, missing rank-1 rejection, not-available persistence, hydration of saved data.
- Add unit tests for ScheduleValidator, ScheduleMapper, SlotCatalog, ScheduleRepository behaviors.

### Docs & cleanup

- Update developernotes.md/README with new flow, schema, validation rules, and form field changes.
- Remove dead code/duplicate helpers once new path is in place.
