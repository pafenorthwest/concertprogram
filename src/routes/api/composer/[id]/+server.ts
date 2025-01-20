import type { ComposerInterface } from '$lib/server/common';
import {deleteById, queryTable, updateById} from "$lib/server/db";
import {json, error} from "@sveltejs/kit";
import { isAuthorized } from '$lib/server/apiAuth';
import { auth_code } from '$env/static/private';
import type { QueryResult } from 'pg';

export async function GET({params}) {

    let res: QueryResult
    try {
        const identifier = Number(params.id);
        res = await queryTable('composer',identifier)
    } catch (err)  {
        error(500, {result: "error", reason: `${(err as Error).message}`})
    }

    if (res == null || res.rowCount != 1) {
        error(404, {result: "error", reason: "Not Found"})
    } else {
        return json(res.rows);
    }
}

export async function PUT({params, request, cookies}) {
    // Check Authorization
    const pafeAuth = cookies.get('pafe_auth')

    if (!request.headers.has('Authorization')){
        return new Response('Unauthorized', { status: 401 });
    }

    if (pafeAuth != auth_code && !isAuthorized(request.headers.get('Authorization'))) {
        return new Response('Unauthorized', { status: 403 });
    }

    const {printed_name, full_name, years_active, alias} = await request.json();
    const identity: number = Number(params.id)
    const composer: ComposerInterface = {
        id: identity,
        printed_name: printed_name,
        full_name: full_name,
        years_active: years_active,
        alias: alias
    }

    if (!composer.printed_name || !composer.full_name || !composer.years_active) {
        error(400, {result: "error", reason: "missing fields"})
    } else {
        let rowCount: number | null = 0
        try {
            rowCount = await updateById('composer', composer)
        } catch (err) {
            error(500, {result: "error", reason: `${(err as Error).message}`})
        }
        if (rowCount != null && rowCount > 0) {
            return new Response('OK',{status: 200});
        } else {
            error(404, {result: "error", reason: "Not Found"})
        }
    }
}

export async function DELETE({params, request, cookies}){

    // Get the Authorization header
    const pafeAuth = cookies.get('pafe_auth')

    if (!request.headers.has('Authorization')){
        return new Response('Unauthorized', { status: 401 });
    }

    if (pafeAuth != auth_code && !isAuthorized(request.headers.get('Authorization'))) {
        return new Response('Unauthorized', { status: 403 });
    }

    let rowCount: number | null = 0
    try {
        const identity: number = Number(params.id)
        rowCount = await deleteById('composer',identity);
    } catch (err) {
        error(500, {result: "error", reason: `${(err as Error).message}`})
    }

    if (rowCount != null && rowCount > 0) {
        return new Response('Delete Successful', { status: 200 });
    } else {
        error(404, {result: "error", reason: "Not Found"})
    }
}