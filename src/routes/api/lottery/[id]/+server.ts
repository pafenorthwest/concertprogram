import {
    deletePerformerLottery,
    getPerformerLottery,
    updatePerformerLottery
} from "$lib/server/db";
import {json} from "@sveltejs/kit";
import {Lottery, pafe_series} from "$lib/server/common";
import {createLottery} from "$lib/server/lottery";

export async function GET({params, request}) {
    try {
        const res = await getPerformerLottery(params.id)
        if (res.rowCount != 1) {
            return json({status: 'error', message: 'Not Found'}, {status: 404});
        }
        return json(res.rows);
    } catch (error) {
        return json({status: 'error', message: 'Failed to process the request'}, {status: 500});
    }
}
export async function PUT({params, request}) {
    try {
        const {lottery, base36Lottery} = await request.json();
        const ticket: Lottery = {
            lottery: lottery,
            base36Lottery: base36Lottery
        }

        if (!ticket.lottery || !ticket.base36Lottery) {
            return {status: 400, body: {message: 'Missing Field, Try Again'}}
        } else {
            const results = await updatePerformerLottery(params.id, pafe_series(), ticket)
            if (results.rowCount != null && results.rowCount > 0) {
                return json( {id: params.id}, {status: 200, body: {message: 'Update successful'}});
            } else {
                return json({id: params.id}, {status: 500, body: {message: 'Update failed'}});
            }
        }
    } catch (error) {
        return json({status: 'error', message: 'Failed to process the request'}, {status: 500});
    }
}

export async function POST({params, request}) {
    try {
        if (await createLottery(params.id)) {
            return json({id: params.id}, {status: 200, body: {message: 'Update successful'}});
        } else {
            return json({id: params.id}, {status: 500, body: {message: 'Update failed'}});
        }
    } catch (error) {
        return json({status: 'error', message: 'Failed to process the request'}, {status: 500});
    }
}

export async function DELETE({params, request}) {
    try {
        const results = await deletePerformerLottery(params.id)
    } catch (error) {
        return json({status: 'error', message: 'Failed to process the request'}, {status: 500});
    }
}
