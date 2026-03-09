ALTER TABLE performance_pieces RENAME TO adjudicated_pieces;

ALTER INDEX performance_pieces_idx RENAME TO adjudicated_pieces_idx;

CREATE TABLE performance_pieces (
	performance_id INTEGER NOT NULL,
	musical_piece_id INTEGER NOT NULL,
	movement VARCHAR(255) NULL,
	is_performance_piece BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE UNIQUE INDEX performance_pieces_idx
	ON performance_pieces(performance_id, musical_piece_id);

CREATE UNIQUE INDEX performance_pieces_one_selected_idx
	ON performance_pieces(performance_id)
	WHERE is_performance_piece = true;

INSERT INTO performance_pieces (performance_id, musical_piece_id, movement)
SELECT DISTINCT ON (performance_id, musical_piece_id)
	performance_id,
	musical_piece_id,
	movement
FROM adjudicated_pieces
ORDER BY performance_id, musical_piece_id, is_merged ASC, movement DESC NULLS LAST;

WITH single_piece_performance AS (
	SELECT performance_id, MAX(musical_piece_id) AS musical_piece_id
	FROM performance_pieces
	GROUP BY performance_id
	HAVING COUNT(*) = 1
)
UPDATE performance_pieces AS pp
SET is_performance_piece = true
FROM single_piece_performance AS spp
WHERE pp.performance_id = spp.performance_id
	AND pp.musical_piece_id = spp.musical_piece_id;
