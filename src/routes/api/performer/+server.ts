import { type PerformerInterface, selectGrade, selectInstrument } from '$lib/server/common';
import {json} from "@sveltejs/kit";
import {createPerformer} from "$lib/server/performer";
import { isAuthorized } from '$lib/server/apiAuth';

export async function POST({params, request}) {

    // Get the Authorization header
    if (!isAuthorized(request.headers.get('Authorization'))) {
        return new Response('Unauthorized', { status: 401 });
    }

    const access_control_headers =  {
        'Access-Control-Allow-Origin': '*', // Allow all hosts
        'Access-Control-Allow-Methods': 'POST', // Specify allowed methods
    }

    try {
        let { full_name,
            grade,
            instrument,
            email,
            phone
        } = await request.json();

        instrument = selectInstrument(instrument)
        grade = selectGrade(grade)
        if (instrument == null || grade == null) {
            return {status: 400, body: {message: 'Bad Instrument or Grade Value'}}
        }

        const performer: PerformerInterface = {
            id: null,
            full_name: full_name,
            grade: grade,
            instrument: instrument,
            email: email,
            phone: phone
        }

        if ( !performer.full_name || !performer.instrument || !performer.grade ) {
            return {status: 400, body: {message: 'Missing Field, Try Again'}}
        } else {
            const new_id = await createPerformer(performer)
            if (new_id != null) {
                return json( {status: 200, body: {message: 'Update successful', id: `${new_id}`}, headers: access_control_headers});
            } else {
                return json({status: 500, body: {message: 'Update failed'}});
            }
        }
    } catch  {
        return json({status: 'error', message: 'Failed to process the request'}, {status: 500});
    }
}
