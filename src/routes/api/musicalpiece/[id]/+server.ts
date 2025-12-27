import { type MusicalPieceInterface } from '$lib/server/common';
import { deleteById, queryTable, updateById } from '$lib/server/db';
import { json } from '@sveltejs/kit';
import { isAuthorized } from '$lib/server/apiAuth';
import { auth_code } from '$env/static/private';

export async function GET({ params }) {
	try {
		const res = await queryTable('musical_piece', params.id);
		if (res.rowCount != 1) {
			return json({ status: 'error', message: 'Not Found' }, { status: 404 });
		}
		return json(res.rows);
	} catch {
		return json({ status: 'error', message: 'Failed to process the request' }, { status: 500 });
	}
}
export async function PUT({ url, params, request, cookies }) {
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
			first_contributor_id,
			all_movements,
			second_contributor_id,
			third_contributor_id
		} = await request.json();
		const musicalPiece: MusicalPieceInterface = {
			id: params.id,
			printed_name: printed_name,
			first_contributor_id: first_contributor_id,
			all_movements: all_movements,
			second_contributor_id: second_contributor_id,
			third_contributor_id: third_contributor_id
		};
		if (!musicalPiece.printed_name || !musicalPiece.first_contributor_id) {
			return { status: 400, body: { message: 'Missing Field, Try Again' } };
		} else {
			const rowCount = await updateById('musical_piece', musicalPiece);
			if (rowCount != null && rowCount > 0) {
				return json({ id: params.id }, { status: 200, body: { message: 'Update successful' } });
			} else {
				return json({ status: 'error', reason: 'Missing Fields', id: params.id }, { status: 500 });
			}
		}
	} catch {
		return json({ status: 'error', message: 'Failed to process the request' }, { status: 500 });
	}
}

export async function DELETE({ url, params, request, cookies }) {
	// Get the Authorization header
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

	const rowCount = await deleteById('musical_piece', params.id);

	if (rowCount != null && rowCount > 0) {
		return json({ status: 200, body: { message: 'Delete successful' } });
	} else {
		return json({ status: 'error', reason: 'Delete failed' }, { status: 500 });
	}
}
