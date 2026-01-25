ALTER TABLE performance_pieces
	ADD COLUMN is_performance_piece BOOLEAN NOT NULL DEFAULT FALSE;

CREATE UNIQUE INDEX performance_pieces_one_selected_idx
	ON performance_pieces(performance_id)
	WHERE is_performance_piece = true;
