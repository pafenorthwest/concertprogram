import {generateLottery, Lottery, pafe_series} from "$lib/server/common";
import {insertPerformerLottery, ticketCollision} from "$lib/server/db";

export async function createLottery(performerId: number): Promise<boolean> {
    let ticket: Lottery = generateLottery()

    try {
        // table lookup for existing ticket
        const validateTicket = await ticketCollision(ticket.base34Lottery)
        if (validateTicket.rowCount == null || validateTicket.rowCount < 1) {
            // generate a new ticket in case of collision
            ticket = generateLottery()
        }
        const result = await insertPerformerLottery(
            performerId,
            pafe_series(),
            ticket
        )
        return result.rowCount != null || result.rowCount > 0;
    } catch (e) {
        return false
    }


}