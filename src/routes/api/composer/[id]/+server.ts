import type { ComposerInterface } from '$lib/server/common';
import {deleteById, queryTable, updateById} from "$lib/server/db";
import {json} from "@sveltejs/kit";

export async function GET({params, request}) {
    try {
        const res = await queryTable('composer',params.id)
        if (res.rowCount != 1) {
            return json({status: 'error', message: 'Not Found'}, {status: 404});
        }
        return json(res.rows);
    } catch  {
        return json({status: 'error', message: 'Failed to process the request'}, {status: 500});
    }
}
export async function PUT({params, request}) {
    try {
        const {printed_name, full_name, years_active, alias} = await request.json();
        const composer: ComposerInterface = {
            id: params.id,
            printed_name: printed_name,
            full_name: full_name,
            years_active: years_active,
            alias: alias
        }

        if (!composer.printed_name || !composer.full_name || !composer.years_active) {
            return {status: 400, body: {message: 'Missing Field, Try Again'}}
        } else {
            const rowCount = await updateById('composer', composer)
            if (rowCount != null && rowCount > 0) {
                return json( {id: params.id}, {status: 200, body: {message: 'Update successful'}});
            } else {
                return json({id: params.id}, {status: 500, body: {message: 'Update failed'}});
            }
        }
    } catch {
        return json({status: 'error', message: 'Failed to process the request'}, {status: 500});
    }
}

export async function DELETE({params, request}){
    const rowCount = await deleteById('composer', params.id);

    if (rowCount != null && rowCount > 0) {
        return { status: 200, body: { message: 'Delete successful' } };
    } else {
        return { status: 500, body: { message: 'Delete failed' } };
    }
}