import { type PerformerInterface, selectGrade, selectInstrument} from "$lib/server/common";
import {deleteById, queryTable, updateById} from "$lib/server/db";
import { error, fail, json } from '@sveltejs/kit';
import { isAuthorized } from '$lib/server/apiAuth';
import { auth_code } from '$env/static/private';

export async function GET({params, request}) {
    try {
        const res = await queryTable('performer',params.id)
        if (res.rowCount != 1) {
            return json({status: 'error', message: 'Not Found'}, {status: 404});
        }
        return json(res.rows);
    } catch (error) {
        return json({status: 'error', message: 'Failed to process the request'}, {status: 500});
    }
}
export async function PUT({params, request, cookies}) {
    // Get the Authorization header
    const pafeAuth = cookies.get('pafe_auth')
    if (pafeAuth != auth_code && !isAuthorized(request.headers.get('Authorization'))) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        const {
            full_name,
            grade,
            instrument,
            email,
            phone
        } = await request.json();

        const gradeEnum = selectGrade(grade)
        const instrumentEnum = selectInstrument(instrument)

        if (gradeEnum == null || instrumentEnum == null) {
            return json({id: params.id}, {status: 400, body: {message: 'Invalidate Instrument or Grade'}});
        }

        const performer: PerformerInterface = {
            id: params.id,
            full_name: full_name,
            grade: gradeEnum!,
            instrument: instrumentEnum!,
            email: email,
            phone: phone
        }

        if (!performer.full_name || !performer.instrument || !performer.grade) {
            error(400, { message: 'Missing Fields' });
        } else {
            const rowCount = await updateById('performer', performer)
            if (rowCount != null && rowCount > 0) {
                return json( {id: params.id}, {status: 200, body: {message: 'Update successful'}});
            } else {
                fail(500, {error: 'DB Update Failed'})
            }
        }
    } catch (error) {
        fail(500, {error: `Failed to process the request ${(error as Error).message}`})
    }
}

export async function DELETE({params, request, cookies}){
    // Get the Authorization header
    const pafeAuth = cookies.get('pafe_auth')
    if (pafeAuth != auth_code && !isAuthorized(request.headers.get('Authorization'))) {
        return new Response('Unauthorized', { status: 401 });
    }

    const rowCount = await deleteById('performer', params.id);

    if (rowCount != null && rowCount > 0) {
        return json({ status: 200, body: { message: 'Delete successful' }});
    } else {
        return json({ status: 500, body: { message: 'Delete failed' } });
    }
}