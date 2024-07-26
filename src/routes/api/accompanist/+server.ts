import {Accompanist} from "$lib/server/common";
import {insertTable} from "$lib/server/db";
import {json} from "@sveltejs/kit";

export async function POST({params, request}) {
    try {
        const { full_name } = await request.json();
        const accompanist: Accompanist = {
            id: null,
            full_name: full_name
        }

        if ( !accompanist.full_name ) {
            return {status: 400, body: {message: 'Missing Field, Try Again'}}
        } else {
            const rowCount = await insertTable('accompanist', accompanist)
            if (rowCount != null && rowCount > 0) {
                return json( {id: params.id}, {status: 200, body: {message: 'Update successful'}});
            } else {
                return json({id: params.id}, {status: 500, body: {message: 'Update failed'}});
            }
        }
    } catch (error) {
        return json({status: 'error', message: 'Failed to process the request'}, {status: 500});
    }
}