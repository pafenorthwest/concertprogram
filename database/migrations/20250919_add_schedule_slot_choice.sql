CREATE TABLE schedule_slot_choice (
    performer_id INTEGER NOT NULL,
    concert_series VARCHAR(255) NOT NULL,
    year INTEGER NOT NULL,
    slot_id INTEGER NOT NULL,
    rank INTEGER NULL,
    not_available BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX schedule_slot_choice_unique_idx
    ON schedule_slot_choice(performer_id, concert_series, year, slot_id);

CREATE INDEX schedule_slot_choice_lookup_idx
    ON schedule_slot_choice(performer_id, concert_series, year);
