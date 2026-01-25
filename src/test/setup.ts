import { beforeAll } from 'vitest';
import { pool } from '$lib/server/db';

beforeAll(async () => {
	const client = await pool.connect();
	try {
		await client.query(
			`ALTER TABLE performance_pieces
       ADD COLUMN IF NOT EXISTS is_performance_piece BOOLEAN NOT NULL DEFAULT FALSE`
		);
	} finally {
		client.release();
	}
});
