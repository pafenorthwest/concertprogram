import type { PerformerInterface } from '$lib/server/common';
import { insertTable } from '$lib/server/db';

/**
 * Inserts into Perform Table and Generate Lottery
 */
export async function createPerformer(performer: PerformerInterface): Promise<number | null> {
	// Insert into Performer
	const performerResult = await insertTable('performer', performer);
	if (performerResult.rowCount != null && performerResult.rowCount > 0) {
		return performerResult.rows[0].id;
	}
	return null;
}
