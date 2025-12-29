# Schedule Contract (Phase 0)

## Mode selection

* **confirm-only** when `slotCount === 1`.
* **rank-choice** when `slotCount >= 2`.

## Rank-choice invariants

* Partial rankings are allowed (some slots may be unranked).
* Exactly **one** slot must be ranked `1`.
* Ranks must be unique (no duplicate ranks).
* Rank values must be in the range `1..slotCount`.
* `slotCount` is capped at **10** slots.

## “Not available” semantics

* `notAvailable` is persisted per slot.
* `notAvailable` is **orthogonal** to ranking (a slot can be marked not available and left unranked, or ranked if allowed by future validation rules).
* The value is stored independently of the rank field in the row-per-slot table.

## Interfaces

Source of truth lives in `src/lib/types/schedule.ts`.

### Slot

Represents a specific performance slot for a series/year, ordered by `concert_number_in_series`.

### ScheduleChoice (domain)

Represents a performer’s schedule choices in a normalized, slot-centric shape.

### ScheduleViewModel

Union of a **confirm-only** shape (single slot) and **rank-choice** shape (2–10 slots).

### ScheduleSubmission

Normalized server input used for validation and persistence.

## Persistence (Phase 1 migration)

A new row-per-slot table stores one row per performer/series/year/slot.

See migration: `database/migrations/20250919_add_schedule_slot_choice.sql`.
