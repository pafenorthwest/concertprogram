import {Performer} from "$lib/server/common";
import {insertTable} from "$lib/server/db";
import {json} from "@sveltejs/kit";
import {createPerformer} from "$lib/server/performer";

export async function POST({params, request}) {
    try {
        const { full_name,
            instrument,
            email,
            phone
        } = await request.json();

        const performer: Performer = {
            id: null,
            full_name: full_name,
            instrument: instrument,
            email: email,
            phone: phone
        }

        if ( !performer.full_name || !performer.instrument ) {
            return {status: 400, body: {message: 'Missing Field, Try Again'}}
        } else {
            const success = await createPerformer(performer)
            if (success) {
                return json( {status: 200, body: {message: 'Update successful'}});
            } else {
                return json({status: 500, body: {message: 'Update failed'}});
            }
        }
    } catch (error) {
        return json({status: 'error', message: 'Failed to process the request'}, {status: 500});
    }
}