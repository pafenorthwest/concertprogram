import {Composer} from "$lib/server/common";
import {insertTable} from "$lib/server/db";
import {json} from "@sveltejs/kit";

export async function POST({params, request}) {
    try {
        const {printed_name, full_name, years_active, alias} = await request.json();
        const composer: Composer = {
            id: null,
            printed_name: printed_name,
            full_name: full_name,
            years_active: years_active,
            alias: alias
        }

        if (!composer.printed_name || !composer.full_name || !composer.years_active) {
            return {status: 400, body: {message: 'Missing Field, Try Again'}}
        } else {
            const rowCount = await insertTable('composer', composer)
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