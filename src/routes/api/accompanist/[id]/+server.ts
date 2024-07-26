import {Accompanist} from "$lib/server/common";
import {deleteById, queryTable, updateById} from "$lib/server/db";
import {json} from "@sveltejs/kit";

export async function GET({params, request}) {
    try {
        const res = await queryTable('composer',params.id)
        if (res.rowCount != 1) {
            return json({status: 'error', message: 'Not Found'}, {status: 404});
        }
        return json(res.rows);
    } catch (error) {
        return json({status: 'error', message: 'Failed to process the request'}, {status: 500});
    }
}
export async function PUT({params, request}) {
    try {
        const { full_name } = await request.json();
        const accompanist: Accompanist = {
            id: params.id,
            full_name: full_name
        }

        if ( !accompanist.full_name ) {
            return {status: 400, body: {message: 'Missing Field, Try Again'}}
        } else {
            const rowCount = await updateById('composer', accompanist)
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

export async function DELETE({params, request}){
    const rowCount = await deleteById('composer', params.id);

    if (rowCount != null && rowCount > 0) {
        return { status: 200, body: { message: 'Delete successful' } };
    } else {
        return { status: 500, body: { message: 'Delete failed' } };
    }
}