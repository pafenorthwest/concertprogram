import {PerformerInterface, selectGrade, selectInstrument} from "$lib/server/common";
import {json} from "@sveltejs/kit";
import {createPerformer} from "$lib/server/performer";

export async function POST({params, request}) {
    try {
        let { full_name,
            grade,
            instrument,
            email,
            phone
        } = await request.json();

        instrument = selectInstrument(instrument)
        grade = selectGrade(grade)
        if (instrument == null || grade == null) {
            return {status: 400, body: {message: 'Bad Instrument or Grade Value'}}
        }

        const performer: PerformerInterface = {
            id: null,
            full_name: full_name,
            grade: grade,
            instrument: instrument,
            email: email,
            phone: phone
        }

        if ( !performer.full_name || !performer.instrument || !performer.grade ) {
            return {status: 400, body: {message: 'Missing Field, Try Again'}}
        } else {
            const new_id = await createPerformer(performer)
            if (new_id != null) {
                return json( {status: 200, body: {message: 'Update successful'}});
            } else {
                return json({status: 500, body: {message: 'Update failed'}});
            }
        }
    } catch (error) {
        return json({status: 'error', message: 'Failed to process the request'}, {status: 500});
    }
}