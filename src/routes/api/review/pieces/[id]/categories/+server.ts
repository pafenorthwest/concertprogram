import { json } from '@sveltejs/kit';
import { isAuthorizedRequest } from '$lib/server/apiAuth';
import { isValidPieceCategory, setPieceCategories } from '$lib/server/review';

function parseId(value: string | undefined): number | null {
	if (!value) {
		return null;
	}
	const id = Number(value);
	return Number.isFinite(id) ? id : null;
}

export async function PUT({ params, request, cookies }) {
	const pafeAuth = cookies.get('pafe_auth');
	if (!isAuthorizedRequest(request.headers.get('Authorization'), pafeAuth)) {
		return json({ status: 'error', reason: 'Unauthorized' }, { status: 401 });
	}

	const musicalPieceId = parseId(params.id);
	if (!musicalPieceId) {
		return json({ status: 'error', reason: 'Invalid musical piece id' }, { status: 400 });
	}

	const payload = await request.json();
	const categories = payload?.categories;
	if (!Array.isArray(categories)) {
		return json({ status: 'error', reason: 'Invalid categories payload' }, { status: 400 });
	}

	const normalized: string[] = [];
	for (const category of categories) {
		if (!isValidPieceCategory(category)) {
			return json({ status: 'error', reason: 'Invalid category value' }, { status: 400 });
		}
		if (!normalized.includes(category)) {
			normalized.push(category);
		}
	}

	await setPieceCategories(musicalPieceId, normalized);
	return json({ id: musicalPieceId }, { status: 200 });
}
