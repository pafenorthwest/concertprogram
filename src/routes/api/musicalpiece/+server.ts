import {MusicalPieceInterface} from "$lib/server/common";
import {insertTable} from "$lib/server/db";
import {json} from "@sveltejs/kit";

export async function POST({params, request}) {
    try {
        const { printed_name,
            first_composer_id,
            all_movements,
            second_composer_id,
            third_composer_id
        } = await request.json();

        const musicalPiece: MusicalPieceInterface = {
            id: null,
            printed_name: printed_name,
            first_composer_id: first_composer_id,
            all_movements: all_movements,
            second_composer_id: second_composer_id,
            third_composer_id: third_composer_id
        }

        if ( !musicalPiece.printed_name || !musicalPiece.first_composer_id ) {
            return {status: 400, body: {message: 'Missing Field, Try Again'}}
        } else {
            const result = await insertTable('musical_piece', musicalPiece)
            if (result.rowCount != null && result.rowCount > 0) {
                return json({status: 200, body: {message: 'Update successful'}});
            } else {
                return json({status: 500, body: {message: 'Update failed'}});
            }
        }
    } catch (error) {
        return json({status: 'error', message: 'Failed to process the request'}, {status: 500});
    }
}