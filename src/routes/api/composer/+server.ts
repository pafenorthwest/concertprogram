import type { ComposerInterface } from '$lib/server/common';
import {insertTable} from "$lib/server/db";
import {json} from "@sveltejs/kit";
import { isAuthorized } from '$lib/server/apiAuth';
import { auth_code } from '$env/static/private';
import type { QueryResult } from 'pg';

export async function POST({request, cookies}) {
    // Check Authorization
    const pafeAuth = cookies.get('pafe_auth')

    if (!request.headers.has('Authorization')){
        return new Response('Unauthorized', { status: 401 });
    }

    if (pafeAuth != auth_code && !isAuthorized(request.headers.get('Authorization'))) {
        return new Response('Unauthorized', { status: 403 });
    }

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
        let result: QueryResult
        try {
            result = await insertTable('composer', composer)
        } catch  {
            return json({status: 'error', reason: 'Failed to process the request'}, {status: 500});
        }
        if (result.rowCount != null && result.rowCount > 0) {
            return json( {status: 200, body: {message: 'Update successful'}});
        } else {
            return json( {status: 500, body: {message: 'Update failed'}});
        }
    }


}