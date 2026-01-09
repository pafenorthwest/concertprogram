-- Prod behavior overlay: functions + triggers
BEGIN;
SET search_path = public, pg_catalog;

-- Drop triggers (safe/idempotent)
DROP TRIGGER IF EXISTS musical_piece_category_enforce_not_appropriate ON public.musical_piece_category_map;
DROP TRIGGER IF EXISTS musical_piece_category_sync_not_appropriate_delete ON public.musical_piece_category_map;
DROP TRIGGER IF EXISTS musical_piece_sync_not_appropriate_flag ON public.musical_piece;

-- Functions
CREATE OR REPLACE FUNCTION public.enforce_not_appropriate_category() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.category = 'Not Appropriate' THEN
        DELETE FROM musical_piece_category_map
        WHERE musical_piece_id = NEW.musical_piece_id
          AND category <> 'Not Appropriate';

        UPDATE musical_piece
        SET is_not_appropriate = TRUE
        WHERE id = NEW.musical_piece_id;
    ELSE
        IF EXISTS (
            SELECT 1 FROM musical_piece
            WHERE id = NEW.musical_piece_id
              AND is_not_appropriate = TRUE
        ) THEN
            UPDATE musical_piece
            SET is_not_appropriate = FALSE
            WHERE id = NEW.musical_piece_id;

            DELETE FROM musical_piece_category_map
            WHERE musical_piece_id = NEW.musical_piece_id
              AND category = 'Not Appropriate';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_not_appropriate_category_on_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF OLD.category = 'Not Appropriate' THEN
        UPDATE musical_piece
        SET is_not_appropriate = FALSE
        WHERE id = OLD.musical_piece_id;
    END IF;

    RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_not_appropriate_flag() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.is_not_appropriate = TRUE THEN
        DELETE FROM musical_piece_category_map
        WHERE musical_piece_id = NEW.id
          AND category <> 'Not Appropriate';

        IF NOT EXISTS (
            SELECT 1 FROM musical_piece_category_map
            WHERE musical_piece_id = NEW.id
              AND category = 'Not Appropriate'
        ) THEN
            INSERT INTO musical_piece_category_map (musical_piece_id, category)
            VALUES (NEW.id, 'Not Appropriate');
        END IF;
    ELSE
        DELETE FROM musical_piece_category_map
        WHERE musical_piece_id = NEW.id
          AND category = 'Not Appropriate';
    END IF;

    RETURN NEW;
END;
$$;


-- Triggers
CREATE TRIGGER musical_piece_category_enforce_not_appropriate AFTER INSERT OR UPDATE ON public.musical_piece_category_map FOR EACH ROW EXECUTE FUNCTION public.enforce_not_appropriate_category();

CREATE TRIGGER musical_piece_category_sync_not_appropriate_delete AFTER DELETE ON public.musical_piece_category_map FOR EACH ROW EXECUTE FUNCTION public.sync_not_appropriate_category_on_delete();

CREATE TRIGGER musical_piece_sync_not_appropriate_flag AFTER UPDATE OF is_not_appropriate ON public.musical_piece FOR EACH ROW EXECUTE FUNCTION public.sync_not_appropriate_flag();

COMMIT;
