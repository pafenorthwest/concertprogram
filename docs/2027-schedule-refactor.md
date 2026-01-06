## Product specification: Adjudicated classes + winners concert scheduling (Eastside + Concerto as distinct series)

### Document status

Implementation-ready product spec reflecting your final clarifications:

- Eastside Concerts and Concerto Playoff are **distinct `concert_series` values**
- A performer may perform once per **series per year** (so potentially once in each)
- Eastside has **multiple events**; Concerto has **single event**
- Winners must **opt in** to participate; they can decline selectively
- Lottery codes are **pre-generated** (before registration), 6-digit integers
- Pieces are **pre-reviewed/flagged** before festival start
- WordPress posting occurs **per placement save** (immediate), so we must be idempotent and resilient

---

# 1) Summary

This update introduces a robust separation between:

1. **Adjudicated competition participation** (“adjudicated class entries”) where performers compete in classes and may submit multiple pieces/excerpts, and where placements (1st, 2nd, up to four honorable mentions) and special division awards are recorded.

2. **Winners concert participation and scheduling** (“concert performance”) where first-place winners can opt in to perform in a winners concert for a given concert series/year (Eastside or Concerto), must choose exactly one eligible piece/excerpt from their competition repertoire for that same series/year, and rank preferred performance times. Multiple first-place wins create multiple lottery codes, but all codes for a performer in the same concert series/year must resolve to a **single** winners-concert performance schedule.

---

# 2) Goals and non-goals

## Goals

- Model adjudicated classes as first-class entries, with canonical pieces reused across history.
- Record placements with hard constraints:
  - exactly one 1st, exactly one 2nd, up to four honorable mentions per class/series/year.

- Determine winners for Eastside and Concerto using the existing age/class rules.
- Support winners concert scheduling via **6-digit integer lottery codes**.
- Ensure multiple winner codes per performer map to **one** winners-concert performance per concert series/year.
- Require opt-in participation; allow winners to decline participation per series/year.
- Allow selection of exactly one concert piece/excerpt from eligible adjudicated pieces in that series/year.
- Support multiple Eastside events, single Concerto event.

## Non-goals

- Printouts/certificates overhaul (explicitly out of scope)
- Digital audit trail matching paper process (out of scope)
- Data migration/backfill (not required)

---

# 3) Key business rules

## 3.1 Class/series mapping

- Each class belongs to exactly one concert series.
- The first two letters of `class_name` indicate division/series (existing convention).

## 3.2 Placements

For each `(class_name, concert_series, year)`:

- Exactly one `FIRST`
- Exactly one `SECOND`
- `HONORABLE_MENTION` count ≤ 4
- No ties for FIRST

Placements are assigned **to the performer’s adjudicated class entry**, independent of piece/excerpt.

## 3.3 Winners eligibility algorithm

Eligibility is computed when placements are saved (or when results are prepared), based on:

- `class_name` prefix
- performer age
- `concert_series` (Eastside vs Concerto series values)
- year
- placement = FIRST

Outcome: a performer becomes _eligible_ for winners concert participation in:

- **Eastside** (multiple events), or
- **Concerto Playoff** (single event)

As clarified: Eastside and Concerto are distinct `concert_series` values.

## 3.4 Winners concert performance constraint

A performer may perform **once per concert_series per year**:

- Unique constraint: `(performer_id, concert_series, year)` on winners-concert performance records.

A performer can therefore perform once in Eastside and once in Concerto in the same year if eligible.

## 3.5 Lottery codes

- Lottery codes are **6-digit integers**.
- They are **generated prior to registration** “with the classes.”
- Lottery codes are assigned per _winning class_ (i.e., per first-place adjudicated class entry), but must resolve to a single winners-concert performance per performer per series/year.

## 3.6 Opt-in participation

- Winners must explicitly opt in (participation confirmed).
- A winner may decline participation for one series and still participate in the other.

## 3.7 Concert piece selection

- Winners concert piece must be chosen from **pieces/excerpts already used** in adjudicated entries for the **same concert_series + year**.
- Exactly one piece/excerpt is selected for the winners concert performance.

## 3.8 Piece permissibility

- Pieces are reviewed before competition; the system must support:
  - flagging pieces as “not permissible”
  - preventing selection (or warning) as part of entry creation
  - reporting to staff before festival start

(Recommended: block selection by default; allow admin override if needed.)

## 3.9 WordPress publishing

- Posting occurs **once per placement save** (immediate).
- Must be idempotent and resilient to retries (network failures, double-submits).

---

# 4) User journeys

## 4.1 Registrar: build adjudicated entries and pieces

1. Create adjudicated class entry for performer (class_name, age, division, series, year, accompanist).
2. Attach one or more pieces/excerpts.
3. If a piece is flagged “not permissible,” registrar sees warning/block.

## 4.2 Registrar: enter placements and publish immediately

1. Save placement for an adjudicated class entry.
2. System validates constraints (no extra FIRST/SECOND; max HM).
3. System posts updated results to WordPress (immediate).
4. If placement creates a FIRST:
   - system updates eligibility and ensures winners performance object exists (opt-in still pending)
   - system ensures a lottery code exists (or links the pre-generated code)

## 4.3 Winner: schedule via lottery code

1. Winner enters a **6-digit code** on the scheduling site.
2. System resolves code → performer + series + year.
3. If performer already has a winners concert performance record for that series/year:
   - show existing state (participation choice, chosen piece, existing preferences)

4. Winner chooses:
   - Participate (Yes/No)
   - If Yes:
     - choose an event (Eastside only; Concerto auto-select)
     - rank preferred performance times
     - select exactly one eligible piece/excerpt
     - confirm attendance

## 4.4 Multi-win mapping behavior

- If a performer wins multiple classes in the same series/year:
  - each class has its own lottery code
  - entering any code lands on the same winners performance schedule
  - no duplicate scheduling records are created

---

# 5) Data model

## 5.1 Performers (idempotent import key)

```sql
CREATE TABLE performer (
  id SERIAL PRIMARY KEY,
  external_id INTEGER UNIQUE NULL, -- idempotent import key
  full_name VARCHAR(255) NOT NULL,
  instrument instrument_list NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
```

## 5.2 Adjudicated class entries (replaces current “performance” semantics)

Your table, with necessary additions (notably `age`, and remove “duration default 0 NOT NULL” if you want unknown; I kept your pattern).

```sql
CREATE TABLE adjudicated_class_entry (
  id SERIAL PRIMARY KEY,
  performer_id INTEGER NOT NULL REFERENCES performer(id),
  class_name VARCHAR(255) NOT NULL,
  division VARCHAR(255) NOT NULL,
  concert_series VARCHAR(255) NOT NULL,
  year INTEGER NOT NULL,
  age INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  accompanist_id INTEGER NULL,
  instrument instrument_list NULL,
  comment VARCHAR(500) NULL
);

CREATE UNIQUE INDEX adjudicated_entry_unique
  ON adjudicated_class_entry(performer_id, class_name, concert_series, year);
```

## 5.3 Canonical pieces (historical reuse + permissibility)

```sql
CREATE TABLE musical_piece (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  composer VARCHAR(255) NOT NULL,
  imslp_url VARCHAR(500) NULL,
  is_permissible BOOLEAN NOT NULL DEFAULT true,
  review_status VARCHAR(32) NOT NULL DEFAULT 'UNREVIEWED', -- UNREVIEWED|APPROVED|FLAGGED
  review_notes VARCHAR(500) NULL
);

CREATE UNIQUE INDEX musical_piece_title_composer_uq
  ON musical_piece(lower(title), lower(composer));
```

## 5.4 Entry → pieces + excerpt

```sql
CREATE TABLE adjudicated_entry_piece (
  id SERIAL PRIMARY KEY,
  adjudicated_entry_id INTEGER NOT NULL REFERENCES adjudicated_class_entry(id) ON DELETE CASCADE,
  musical_piece_id INTEGER NOT NULL REFERENCES musical_piece(id),
  excerpt VARCHAR(500) NULL,
  duration_seconds INTEGER NULL
);

CREATE INDEX adjudicated_entry_piece_entry_idx
  ON adjudicated_entry_piece(adjudicated_entry_id);
```

## 5.5 Placements (with constraints)

```sql
CREATE TYPE placement_rank AS ENUM ('FIRST', 'SECOND', 'HONORABLE_MENTION');

CREATE TABLE placement (
  id SERIAL PRIMARY KEY,
  adjudicated_entry_id INTEGER NOT NULL REFERENCES adjudicated_class_entry(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  concert_series VARCHAR(255) NOT NULL,
  class_name VARCHAR(255) NOT NULL,
  rank placement_rank NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX placement_first_second_unique
  ON placement(year, concert_series, class_name, rank)
  WHERE rank IN ('FIRST','SECOND');
```

Honorable mention max=4 enforced in application logic (transactionally).

## 5.6 Special awards (per division)

```sql
CREATE TABLE special_award (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  division VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  performer_id INTEGER NOT NULL REFERENCES performer(id),
  class_name VARCHAR(255) NOT NULL,
  age INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE special_award_piece (
  id SERIAL PRIMARY KEY,
  special_award_id INTEGER NOT NULL REFERENCES special_award(id) ON DELETE CASCADE,
  musical_piece_id INTEGER NOT NULL REFERENCES musical_piece(id),
  excerpt VARCHAR(500) NULL
);
```

## 5.7 Winners concert events

Eastside has many; Concerto has one.

```sql
CREATE TABLE winners_concert_event (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  concert_series VARCHAR(255) NOT NULL, -- 'Eastside' or 'Concerto' series values
  name VARCHAR(255) NOT NULL,
  venue VARCHAR(255) NULL,
  start_time TIMESTAMP NOT NULL
);

CREATE INDEX winners_event_lookup
  ON winners_concert_event(year, concert_series, start_time);
```

## 5.8 Winners concert performance (one per performer per series/year)

```sql
CREATE TABLE winners_concert_performance (
  id SERIAL PRIMARY KEY,
  performer_id INTEGER NOT NULL REFERENCES performer(id),
  year INTEGER NOT NULL,
  concert_series VARCHAR(255) NOT NULL, -- Eastside vs Concerto series values
  participating BOOLEAN NOT NULL DEFAULT false,
  participation_decided_at TIMESTAMP NULL,
  selected_entry_piece_id INTEGER NULL REFERENCES adjudicated_entry_piece(id),
  attendance_confirmed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX winners_perf_unique
  ON winners_concert_performance(performer_id, year, concert_series);
```

## 5.9 Lottery codes (pre-generated 6-digit integers)

Key change: codes exist prior to placements; placements later “activate” them.

```sql
CREATE TABLE lottery_code (
  id SERIAL PRIMARY KEY,
  code INTEGER NOT NULL UNIQUE CHECK (code BETWEEN 100000 AND 999999),
  year INTEGER NOT NULL,
  concert_series VARCHAR(255) NOT NULL,
  class_name VARCHAR(255) NOT NULL,
  -- assigned once winner determined:
  performer_id INTEGER NULL REFERENCES performer(id),
  adjudicated_entry_id INTEGER NULL REFERENCES adjudicated_class_entry(id),
  winners_concert_performance_id INTEGER NULL REFERENCES winners_concert_performance(id),
  status VARCHAR(32) NOT NULL DEFAULT 'RESERVED', -- RESERVED|ASSIGNED|REVOKED
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX lottery_code_lookup
  ON lottery_code(year, concert_series, class_name);
```

**Important mapping requirement:** When a performer has multiple winning classes in the same series/year, each code must point to the _same_ `winners_concert_performance_id`.

## 5.10 Schedule assignment (ties to existing scheduling)

```sql
CREATE TABLE winners_concert_schedule_assignment (
  id SERIAL PRIMARY KEY,
  winners_concert_performance_id INTEGER NOT NULL UNIQUE
    REFERENCES winners_concert_performance(id),
  winners_concert_event_id INTEGER NOT NULL REFERENCES winners_concert_event(id),
  scheduled_start_time TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
```

Your existing “rank preferred times” table(s) should reference `winners_concert_performance_id`.

---

# 6) Core logic requirements

## 6.1 Placement save transaction (high-level)

On save of placement `P` for adjudicated entry `E`:

1. Validate placement constraints for `(E.class_name, E.concert_series, E.year)`:
   - FIRST/SECOND uniqueness
   - HM count ≤ 4

2. Persist placement.
3. **Post to WordPress** immediately (per requirement) with idempotency key.
4. If rank = FIRST:
   - Determine winners concert series eligibility (Eastside vs Concerto) using your rules.
   - Upsert winners_concert_performance `(performer_id, year, winners_series)`
   - Find the pre-generated lottery_code row for `(year, winners_series, class_name)` and assign:
     - performer_id
     - adjudicated_entry_id
     - winners_concert_performance_id
     - status = ASSIGNED

   - If performer already has an assigned winners_concert_performance_id for the same series/year:
     - ensure this lottery code points to that same performance

### Idempotency and concurrency

- Placement save must be safe against double-submit:
  - use DB uniqueness for FIRST/SECOND
  - WordPress post must include an idempotency key (see below)

- Mapping of codes must be transactionally consistent (serializable or use `SELECT ... FOR UPDATE` on winners_concert_performance + relevant lottery_code rows).

## 6.2 WordPress posting (per placement save)

Because you post on every placement save, implement:

- An `idempotency_key` per placement action (e.g., `placement:{placement_id}:{updated_at}` or a hash of canonical payload + placement id).
- A local `wordpress_publish_log` table to record:
  - idempotency_key
  - payload_hash
  - response status
  - timestamp

If a retry occurs, you re-send but prevent duplicate “logical publishes” on your side and allow WordPress to dedupe (if possible).

---

# 7) Scheduling experience details

## 7.1 Code entry

- Input is 6-digit integer.
- Lookup `lottery_code` by code.
- If `status != ASSIGNED`, show a friendly error:
  - “This code is not active yet” (RESERVED) or “Invalid” (no match).

## 7.2 Participation decision

- If performer declines:
  - set `participating=false`, `participation_decided_at=now()`
  - do not allow slot ranking or piece selection (or allow view-only)

- If performer opts in:
  - set `participating=true`
  - require:
    - event selection (Eastside only; Concerto preselected)
    - slot rankings
    - piece selection
    - attendance confirmation

## 7.3 Eligible piece list

Eligible options = all `adjudicated_entry_piece` where:

- performer matches
- year matches
- concert_series matches the winners series (Eastside or Concerto)

System must enforce:

- exactly one selection
- selection must belong to the eligible set

---

# 8) Reporting and admin tooling (in scope)

Even though printouts are out of scope, the following admin views are needed to operate:

- “Winners dashboard” per year/series:
  - list first-place winners, their codes, participation status, selected piece, scheduled slot (if assigned)

- “Pieces review dashboard”:
  - list flagged/unreviewed pieces by year/series/class usage (support pre-festival review)

---

# 9) Acceptance criteria

## A) Data integrity

- Cannot create two FIRST placements for same `(class_name, concert_series, year)`.
- Cannot create more than 4 HM placements for same `(class_name, concert_series, year)`.
- A performer has at most one `winners_concert_performance` per `(concert_series, year)`.

## B) Multi-win mapping

- If performer wins FIRST in two classes in Eastside 2026, they receive two codes.
- Entering either code shows the same winners performance record and the same scheduled slot (once assigned).

## C) Scheduling constraints

- Winner cannot confirm attendance without selecting exactly one eligible piece.
- Winner cannot select a piece outside eligible set.

## D) Lottery codes lifecycle

- Codes exist pre-registration as 6-digit integers tied to `(year, series, class_name)`.
- After FIRST placement is recorded, the code becomes ASSIGNED with performer linkage.

## E) WordPress posting

- Saving a placement triggers one logical post operation.
- Re-saving (edit) triggers another post, but retries do not create uncontrolled duplicates (idempotency log works).

---

# 10) Recommended delivery sequence (pragmatic)

1. **Schema + basic CRUD** for adjudicated entries, canonical pieces, entry-piece linking.
2. **Placement entry** with constraints + immediate WordPress post + publish log.
3. **Lottery code pre-generation** tooling (admin command / job) for a given year:
   - generate per class_name + series using 6-digit uniqueness

4. **Eligibility + code assignment** on FIRST placement save.
5. **Winners concert performance + scheduling integration**:
   - code lookup → resolve winners performance
   - participation decision
   - eligible piece selection
   - slot preferences and schedule assignment per winners performance

6. **Pieces review dashboard** (flagged/unreviewed) to support pre-festival review.
