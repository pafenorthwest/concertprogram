import { type PerformerInterface, selectGrade, selectInstrument} from "$lib/server/common";
import {deleteById, queryTable, updateById} from "$lib/server/db";
import { error, fail, json } from '@sveltejs/kit';
import { isAuthorized } from '$lib/server/apiAuth';
import { auth_code } from '$env/static/private';
import type { QueryResult } from 'pg';

export async function GET({params, request}) {
    let res: QueryResult
    try {
        const identity: number = Number(params.id)
        res = await queryTable('performer',identity);
    } catch (err)  {
        return json({result: "error", reason: `${(err as Error).message}`}, {status: 500})
    }

    if (res == null || res.rowCount != 1) {
        return json({result: "error", reason: "Not Found"}, {status: 404})
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

    const { full_name, grade, instrument, email, phone } = await request.json();

    const gradeEnum = selectGrade(grade)
    const instrumentEnum = selectInstrument(instrument)

    if (gradeEnum == null || instrumentEnum == null) {
        return json({ result: 'error', reason: 'Bad Instrument or Grade Value' }, { status: 400 });
    }

    const identity: number = Number(params.id)
    const performer: PerformerInterface = {
        id: identity,
        full_name: full_name,
        grade: gradeEnum!,
        instrument: instrumentEnum!,
        email: email,
        phone: phone
    }

    if (!performer.full_name || !performer.instrument || !performer.grade) {
        return json({result: "error", reason: "Missing Fields"}, {status: 400})
    } else {
        let rowCount: number | null = 0
        try {
            rowCount = await updateById('performer', performer)
        } catch (err) {
            return json({ result: "error", reason: `${(err as Error).message}` }, { status: 500 })
        }
        if (rowCount != null && rowCount > 0) {
            return new Response('OK', { status: 200 });
        } else {
            return json({ result: "error", reason: "Not Found" }, { status: 404 })
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
        rowCount = await deleteById('performer', identity);
    } catch (err) {
        return json({result: "error", reason: `${(err as Error).message}`}, {status: 500})
    }

    if (rowCount != null && rowCount > 0) {
        return json({result: "success"}, {status: 200})
    } else {
        return json({result: "error", reason: "Not Found"}, {status: 404})
    }
}