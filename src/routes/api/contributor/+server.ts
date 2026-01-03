import type { ContributorInterface } from '$lib/server/common';
import { normalizeContributorRole } from '$lib/server/common';
import { insertTable } from '$lib/server/db';
import { json } from '@sveltejs/kit';
import { isAuthorizedRequest } from '$lib/server/apiAuth';
import type { QueryResult } from 'pg';

export async function POST({ request, cookies }) {
	// Check Authorization
	const pafeAuth = cookies.get('pafe_auth');

	if (!isAuthorizedRequest(request.headers.get('Authorization'), pafeAuth)) {
		return json({ result: 'error', reason: 'Unauthorized' }, { status: 401 });
	}

	const { full_name, years_active, alias, role } = await request.json();
	const validRole = normalizeContributorRole(role);
	const composer: ContributorInterface = {
		id: null,
		full_name: full_name,
		years_active: years_active,
		role: validRole,
		notes: alias
	};

	if (!composer.full_name || !composer.years_active) {
		return json({ result: 'error', reason: 'Missing Field' }, { status: 400 });
	} else {
		let result: QueryResult;
		try {
			result = await insertTable('contributor', composer);
		} catch {
			return json({ result: 'error', reason: 'Failed to process the request' }, { status: 500 });
		}
		if (result.rowCount != null && result.rowCount > 0) {
			return json({ id: result.rows[0].id }, { status: 201 });
		} else {
			return json({ result: 'error', reason: 'Update Failed' }, { status: 500 });
		}
	}
}
