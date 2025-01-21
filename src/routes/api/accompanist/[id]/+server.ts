import type { AccompanistInterface } from '$lib/server/common';
import {deleteById, queryTable, updateById} from "$lib/server/db";
import {json} from "@sveltejs/kit";
import { isAuthorized } from '$lib/server/apiAuth';
import { auth_code } from '$env/static/private';
import type { QueryResult } from 'pg';

export async function GET({params, request}) {
    let res: QueryResult
    try {
        const identifier = Number(params.id);
        res = await queryTable('accompanist',identifier);
    } catch(err)  {
        return json({result: "error", reason: `${(err as Error).message}`}, {status: 500})
    }

    if (res.rowCount != 1) {
        return json({status: 'error', message: 'Not Found'}, {status: 404});
    }
    return json(res.rows);

}
export async function PUT({params, request, cookies}) {
    // Check Authorization
    const pafeAuth = cookies.get('pafe_auth')

    if (!request.headers.has('Authorization')){
        return json({result: "error", reason: "Unauthorized"}, {status: 401})
    }

    if (pafeAuth != auth_code && !isAuthorized(request.headers.get('Authorization'))) {
        return json({result: "error", reason: "Unauthorized"}, {status: 403})
    }

    const { full_name } = await request.json();
    const identifier = Number(params.id);
    const accompanist: AccompanistInterface = {
        id: identifier,
        full_name: full_name
    }

    if ( !accompanist.full_name ) {
        return json({result: "error", reason: "Missing fields"}, {status: 400})
    } else {
        let rowCount: number | null = 0
        try {
            rowCount = await updateById('accompanist', accompanist)
        } catch (err) {
            return json({result: "error", reason: `${(err as Error).message}`}, {status: 500})
        }
        if (rowCount != null && rowCount > 0) {
            return new Response('OK',{status: 200});
        } else {
            return json({result: "error", reason: "Not Found"}, {status: 404})
        }
    }
}

export async function DELETE({params, request, cookies}) {

    // Get the Authorization header
    const pafeAuth = cookies.get('pafe_auth')

    if (!request.headers.has('Authorization')){
        return json({result: "error", reason: "Unauthorized"}, {status: 401})
    }

    if (pafeAuth != auth_code && !isAuthorized(request.headers.get('Authorization'))) {
        return json({result: "error", reason: "Unauthorized"}, {status: 403})
    }

    let rowCount: number | null = 0
    try {
        const identity: number = Number(params.id)
        rowCount = await deleteById('accompanist', identity);
    } catch (err) {
        return json({result: "error", reason: `${(err as Error).message}`}, {status: 500})
    }

    if (rowCount != null && rowCount > 0) {
        return json({result: "success"}, {status: 200})
    } else {
        return json({result: "error", reason: "Not Found"}, {status: 404})
    }
}