ALTER TABLE concert_times
ADD COLUMN id BIGSERIAL PRIMARY KEY;

ALTER TABLE concert_times
ADD CONSTRAINT concert_times_unique
UNIQUE (concert_series, year, concert_number_in_series);

-- Re-key any existing schedule choices to point at the new concert_times primary key
UPDATE schedule_slot_choice s
SET slot_id = ct.id
FROM concert_times ct
WHERE ct.concert_series = s.concert_series
  AND ct.year = s.year
  AND ct.concert_number_in_series = s.slot_id;
