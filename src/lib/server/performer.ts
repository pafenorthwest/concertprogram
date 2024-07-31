import type {Performer} from "$lib/server/common";
import {insertTable, deleteById} from "$lib/server/db";
import {createLottery} from "$lib/server/lottery";

/**
 * Inserts into Perform Table and Generate Lottery
 */
export async function createPerformer(performer: Performer): Promise<boolean> {
    // Insert into Performer
    const performerResult = await insertTable('performer', performer)
    if (performerResult.rowCount != null && performerResult.rowCount > 0) {

        if (await createLottery(performerResult.rows[0].id)) {
            return true;
        } else {
            // failed clean up performer row
            const rowCount = await deleteById("performer", performerResult.rows[0].id)
            return false
        }
    }
    return false;
}