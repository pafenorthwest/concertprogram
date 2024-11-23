import { json } from '@sveltejs/kit';
import { type PerformanceInterface, selectInstrument } from '$lib/server/common';
import {insertPerformance} from "$lib/server/db";
import { isAuthorized } from '$lib/server/apiAuth';

export async function POST({ request }) {

    // Get the Authorization header
    if (!isAuthorized(request.headers.get('Authorization'))) {
        return new Response('Unauthorized', { status: 401 });
    }

    const access_control_headers =  {
        'Access-Control-Allow-Origin': '*', // Allow all hosts
        'Access-Control-Allow-Methods': 'POST', // Specify allowed methods
    }

    try {
        // the following fields are often not included
        // order, concert_time, warm_up_room_name, warm_up_room_start, warm_up_room_name
        const {
            performer_name,
            musical_piece,
            movements,
            duration,
            accompanist_id,
            concert_series,
            pafe_series,
            instrument,
            order,
            concert_time,
            warm_up_room_name,
            warm_up_room_start,
            warm_up_room_end
        } = await request.json();

        const instrumentEnum = selectInstrument(instrument)
        if (instrumentEnum == null) {
            return json({}, {status: 400, body: {message: 'Invalidate Instrument'}});
        }

        let cleaned_pafe_series = pafe_series
        if (cleaned_pafe_series == null) { cleaned_pafe_series = pafe_series() }

        const performance: PerformanceInterface = {
            id: null,
            performer_name: performer_name,
            musical_piece: musical_piece,
            movements: movements,
            duration: duration,
            accompanist_id: accompanist_id,
            concert_series: concert_series,
            pafe_series: cleaned_pafe_series,
            instrument: instrumentEnum
        }

        if (!performance.performer_name || !performance.musical_piece || !performance.concert_series) {
            return {status: 400, body: {message: 'Missing Field, Try Again'}}
        } else {
            // get performer id
            const performer_id = 1
            // get musical_peice id
            const musical_piece_id = 0
            const result = await insertPerformance(performance, performer_id, musical_piece_id,
                order, concert_time,
                warm_up_room_name, warm_up_room_start, warm_up_room_end)
            if (result.rowCount != null && result.rowCount > 0) {
                return json( {status: 200, body: {message: 'Update successful'}, headers: access_control_headers});
            } else {
                return json({status: 500, body: {message: 'Update failed'}});
            }
        }
    } catch {
        return json({status: 'error', message: 'Failed to process the request'});
    }
}

export const OPTIONS = async () => {
    // Handle preflight requests for CORS
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        }
    });
}
