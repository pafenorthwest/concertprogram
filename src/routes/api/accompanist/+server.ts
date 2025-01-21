import type { AccompanistInterface } from '$lib/server/common';
import { insertTable } from '$lib/server/db';
import { json } from '@sveltejs/kit';
import { isAuthorized } from '$lib/server/apiAuth';
import { auth_code } from '$env/static/private';
import type { QueryResult } from 'pg';

export async function POST({ request, cookies }) {
	// Get the Authorization header
	const pafeAuth = cookies.get('pafe_auth');

	if (!request.headers.has('Authorization')) {
		return json({ result: 'error', reason: 'Unauthorized' }, { status: 401 });
	}

	if (pafeAuth != auth_code && !isAuthorized(request.headers.get('Authorization'))) {
		return json({ result: 'error', reason: 'Unauthorized' }, { status: 403 });
	}

	const { full_name } = await request.json();
	const accompanist: AccompanistInterface = {
		id: null,
		full_name: full_name
	};

	if (!accompanist.full_name) {
		return json({ result: 'error', reason: 'Missing Fields' }, { status: 400 });
	} else {
		let result: QueryResult;
		try {
			result = await insertTable('accompanist', accompanist);
		} catch (error) {
			return json({ result: 'error', reason: `${(error as Error).message}` }, { status: 500 });
		}
		if (result.rowCount != null && result.rowCount > 0) {
			return json({ id: result.rows[0].id }, { status: 201 });
		} else {
			return json({ result: 'error', reason: 'Update Failed' }, { status: 500 });
		}
	}
}
