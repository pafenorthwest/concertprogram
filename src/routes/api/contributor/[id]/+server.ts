import type { ContributorInterface } from '$lib/server/common';
import { normalizeContributorRole } from '$lib/server/common';
import { deleteById, isContributorReferenced, queryTable, updateById } from '$lib/server/db';
import { json } from '@sveltejs/kit';
import { isAuthorizedRequest } from '$lib/server/apiAuth';
import type { QueryResult } from 'pg';

export async function GET({ params }) {
	let res: QueryResult;
	try {
		const identifier = Number(params.id);
		res = await queryTable('contributor', identifier);
	} catch (err) {
		return json({ result: 'error', reason: `${(err as Error).message}` }, { status: 500 });
	}

	if (res == null || res.rowCount != 1) {
		return json({ result: 'error', reason: 'Not Found' }, { status: 404 });
	}
	return json(res.rows);
}

export async function PUT({ url, params, request, cookies }) {
	// Check Authorization
	const pafeAuth = cookies.get('pafe_auth');
	const origin = request.headers.get('origin'); // The origin of the request (protocol + host + port)
	const appOrigin = `${url.protocol}//${url.host}`;

	// from local app no checks needed
	if (origin !== appOrigin) {
		if (!isAuthorizedRequest(request.headers.get('Authorization'), pafeAuth)) {
			return json({ result: 'error', reason: 'Unauthorized' }, { status: 401 });
		}
	}

	const { full_name, years_active, notes, role } = await request.json();
	const validRole = normalizeContributorRole(role);
	const identity: number = Number(params.id);
	const composer: ContributorInterface = {
		id: identity,
		full_name: full_name,
		years_active: years_active,
		role: validRole,
		notes: notes
	};

	if (!composer.full_name || !composer.years_active) {
		return json({ result: 'error', reason: 'Missing Fields' }, { status: 400 });
	} else {
		let rowCount: number | null = 0;
		try {
			rowCount = await updateById('contributor', composer);
		} catch (err) {
			return json({ result: 'error', reason: `${(err as Error).message}` }, { status: 500 });
		}
		if (rowCount != null && rowCount > 0) {
			return new Response('OK', { status: 200 });
		} else {
			return json({ result: 'error', reason: 'Not Found' }, { status: 404 });
		}
	}
}

export async function DELETE({ params, request, cookies }) {
	// Get the Authorization header
	const pafeAuth = cookies.get('pafe_auth');

	if (!isAuthorizedRequest(request.headers.get('Authorization'), pafeAuth)) {
		return json({ result: 'error', reason: 'Unauthorized' }, { status: 401 });
	}

	let rowCount: number | null = 0;
	try {
		const identity: number = Number(params.id);
		if (await isContributorReferenced(identity)) {
			return json(
				{ result: 'error', reason: 'Contributor is referenced by a musical piece.' },
				{ status: 400 }
			);
		}
		rowCount = await deleteById('contributor', identity);
	} catch (err) {
		return json({ result: 'error', reason: `${(err as Error).message}` }, { status: 500 });
	}

	if (rowCount != null && rowCount > 0) {
		return json({ result: 'success' }, { status: 200 });
	} else {
		return json({ result: 'error', reason: 'Not Found' }, { status: 404 });
	}
}
