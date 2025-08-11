import type { MusicalPieceInterface } from '$lib/server/common';
import { insertTable } from '$lib/server/db';
import { json } from '@sveltejs/kit';
import { isAuthorized } from '$lib/server/apiAuth';
import { auth_code } from '$env/static/private';

export async function POST({ url, request, cookies }) {
	// Check Authorization
	const pafeAuth = cookies.get('pafe_auth');
	const origin = request.headers.get('origin'); // The origin of the request (protocol + host + port)
	const appOrigin = `${url.protocol}//${url.host}`;

	// from local app no checks needed
	if (origin !== appOrigin) {
		if (!request.headers.has('Authorization')) {
			return json({ result: 'error', reason: 'Unauthorized' }, { status: 401 });
		}

		if (pafeAuth != auth_code && !isAuthorized(request.headers.get('Authorization'))) {
			return json({ result: 'error', reason: 'Unauthorized' }, { status: 403 });
		}
	}

	try {
		const {
			printed_name,
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
		};

		if (!printed_name || !first_composer_id) {
			return json({ status: 'error', reason: 'Missing Fields' }, { status: 400 });
		} else {
			const result = await insertTable('musical_piece', musicalPiece);
			if (result.rowCount != null && result.rowCount > 0) {
				return json({ id: result.rows[0].id, message: 'Update successful' }, { status: 201 });
			} else {
				return json({ status: 'error', reason: 'Insert Failed' }, { status: 500 });
			}
		}
	} catch {
		return json({ status: 'error', message: 'Failed to process the request' }, { status: 500 });
	}
}
