import { type PerformerInterface, selectGrade, selectInstrument} from "$lib/server/common";
import {deleteById, queryTable, updateById} from "$lib/server/db";
import {json} from "@sveltejs/kit";

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
export async function PUT({params, request}) {
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
            return {status: 400, body: {message: 'Missing Field, Try Again'}}
        } else {
            const rowCount = await updateById('performer', performer)
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
    const rowCount = await deleteById('performer', params.id);

    if (rowCount != null && rowCount > 0) {
        return { status: 200, body: { message: 'Delete successful' } };
    } else {
        return { status: 500, body: { message: 'Delete failed' } };
    }
}