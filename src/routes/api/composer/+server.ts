import type { ComposerInterface } from '$lib/server/common';
import {insertTable} from "$lib/server/db";
import {json} from "@sveltejs/kit";
import { isAuthorized } from '$lib/server/apiAuth';

export async function POST({params, request}) {
    if (!isAuthorized(request.headers.get('Authorization'))) {
        return new Response('Unauthorized', { status: 401 });
    }

    const access_control_headers =  {
        'Access-Control-Allow-Origin': '*', // Allow all hosts
        'Access-Control-Allow-Methods': 'POST', // Specify allowed methods
    }

    try {
        const {printed_name, full_name, years_active, alias} = await request.json();
        const composer: ComposerInterface = {
            id: null,
            printed_name: printed_name,
            full_name: full_name,
            years_active: years_active,
            alias: alias
        }

        if (!composer.printed_name || !composer.full_name || !composer.years_active) {
            return json({status: 400, body: {message: 'Missing Field, Try Again'}})
        } else {
            const result = await insertTable('composer', composer)
            if (result.rowCount != null && result.rowCount > 0) {
                return json( {status: 200, body: {message: 'Update successful'}, headers: access_control_headers});
            } else {
                return json( {status: 500, body: {message: 'Update failed'}});
            }
        }
    } catch  {
        return json({status: 'error', message: 'Failed to process the request'}, {status: 500});
    }
}