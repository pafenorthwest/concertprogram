import type { AccompanistInterface } from '$lib/server/common';
import {deleteById, queryTable, updateById} from "$lib/server/db";
import {json} from "@sveltejs/kit";
import { isAuthorized } from '$lib/server/apiAuth';

export async function GET({params, request}) {
    try {
        const res = await queryTable('accompanist',params.id)
        if (res.rowCount != 1) {
            return json({status: 'error', message: 'Not Found'}, {status: 404});
        }
        return json(res.rows);
    } catch  {
        return json({status: 'error', message: 'Failed to process the request'}, {status: 500});
    }
}
export async function PUT({params, request}) {
    // Get the Authorization header
    if (!isAuthorized(request.headers.get('Authorization'))) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        const { full_name } = await request.json();
        const accompanist: AccompanistInterface = {
            id: params.id,
            full_name: full_name
        }

        if ( !accompanist.full_name ) {
            return {status: 400, body: {message: 'Missing Field, Try Again'}}
        } else {
            const rowCount = await updateById('accompanist', accompanist)
            if (rowCount != null && rowCount > 0) {
                return json( {id: params.id}, {status: 200, body: {message: 'Update successful'}});
            } else {
                return json({id: params.id}, {status: 500, body: {message: 'Update failed'}});
            }
        }
    } catch  {
        return json({status: 'error', message: 'Failed to process the request'}, {status: 500});
    }
}

export async function DELETE({params, request}){
    // Get the Authorization header
    if (!isAuthorized(request.headers.get('Authorization'))) {
        return new Response('Unauthorized', { status: 401 });
    }

    const rowCount = await deleteById('accompanist', params.id);

    if (rowCount != null && rowCount > 0) {
        return json({ status: 200, body: { message: 'Delete successful' }});
    } else {
        return json({ status: 500, body: { message: 'Delete failed' } });
    }
}