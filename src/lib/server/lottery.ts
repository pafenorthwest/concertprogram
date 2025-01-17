import { generateLottery, type LotteryInterface, pafe_series } from '$lib/server/common';
import {insertPerformerLottery, ticketCollision} from "$lib/server/db";

export async function createLottery(performerId: number): Promise<boolean> {
    const maxAttempts = 10
    let ticket: LotteryInterface = generateLottery()

    try {
        let attempts = 0

        while (attempts < maxAttempts) {
            // table lookup for existing ticket
            const validateTicket = await ticketCollision(ticket.base34Lottery)
            if (validateTicket.rowCount == null || validateTicket.rowCount < 1) {
                // no existing rows no collision
                break;
            } else {
                // collision detected generate a new ticket
                ticket = generateLottery()
            }
            attempts++
        }
        if (attempts >= maxAttempts) {
            console.log('Failed to create lottery due to ticket collision')
            return false
        }

        const result = await insertPerformerLottery(
            performerId,
            pafe_series(),
            ticket
        )
        return (result.rowCount != null && result.rowCount > 0)
    } catch {
        return false
    }


}