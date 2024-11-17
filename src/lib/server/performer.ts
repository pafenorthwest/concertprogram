import type {PerformerInterface} from "$lib/server/common";
import {insertTable, deleteById} from "$lib/server/db";
import {createLottery} from "$lib/server/lottery";

/**
 * Inserts into Perform Table and Generate Lottery
 */
export async function createPerformer(performer: PerformerInterface): Promise<number|null> {
    // Insert into Performer
    const performerResult = await insertTable('performer', performer)
    if (performerResult.rowCount != null && performerResult.rowCount > 0) {

        if (await createLottery(performerResult.rows[0].id)) {
            return performerResult.rows[0].id;
        } else {
            // failed clean up performer row
            const rowCount = await deleteById("performer", performerResult.rows[0].id)
            return null
        }
    }
    return null;
}