BEGIN;

DELETE FROM musical_piece_division_tag
WHERE division_tag = 'Ensembles';

CREATE TYPE division_tag_new AS ENUM (
    'Violin Viola',
    'Cello Bass',
    'Piano',
    'Woodwinds'
);

ALTER TABLE musical_piece_division_tag
    ALTER COLUMN division_tag TYPE division_tag_new
    USING (
        CASE division_tag
            WHEN 'High-Strings' THEN 'Violin Viola'::division_tag_new
            WHEN 'Low-Strings' THEN 'Cello Bass'::division_tag_new
            ELSE division_tag::text::division_tag_new
        END
    );

DROP TYPE division_tag;
ALTER TYPE division_tag_new RENAME TO division_tag;

COMMIT;
