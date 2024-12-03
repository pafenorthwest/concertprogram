import type { AccompanistInterface } from '$lib/server/common';
import {insertTable} from "$lib/server/db";
import {json} from "@sveltejs/kit";
import { isAuthorized } from '$lib/server/apiAuth';
import { auth_code } from '$env/static/private';

export async function POST({request, cookies}) {

    // Get the Authorization header
    const pafeAuth = cookies.get('pafe_auth')
    if (pafeAuth != auth_code && !isAuthorized(request.headers.get('Authorization'))) {
        return new Response('Unauthorized', { status: 401 });
    }

    const access_control_headers =  {
        'Access-Control-Allow-Origin': '*', // Allow all hosts
        'Access-Control-Allow-Methods': 'POST', // Specify allowed methods
    }

    try {
        const { full_name } = await request.json();
        const accompanist: AccompanistInterface = {
            id: null,
            full_name: full_name
        }

        if ( !accompanist.full_name ) {
            return {status: 400, body: {message: 'Missing Field, Try Again'}}
        } else {
            const result = await insertTable('accompanist', accompanist)
            if (result.rowCount != null && result.rowCount > 0) {
                return json({status: 200, body: {message: 'Update successful', id: `${result.rows[0].id}`}, headers: access_control_headers});
            } else {
                return json({status: 500, body: {message: 'Update failed'}});
            }
        }
    } catch (error){
        return json(
          {status: 'error', message: `Failed to process the request ${(error as Error).message}`},
          {status: 500, headers: access_control_headers}
        );
    }
}