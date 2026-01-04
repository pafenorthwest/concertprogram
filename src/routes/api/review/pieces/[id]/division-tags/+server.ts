import { json } from '@sveltejs/kit';
import { getReviewSession } from '$lib/server/apiAuth';
import { isValidDivisionTag, setPieceDivisionTags } from '$lib/server/review';

function parseId(value: string | undefined): number | null {
	if (!value) {
		return null;
	}
	const id = Number(value);
	return Number.isFinite(id) ? id : null;
}

export async function PUT({ params, request, cookies }) {
	const session = getReviewSession(cookies.get('pafe_auth'));
	if (!session) {
		return json({ status: 'error', reason: 'Unauthorized' }, { status: 401 });
	}

	const musicalPieceId = parseId(params.id);
	if (!musicalPieceId) {
		return json({ status: 'error', reason: 'Invalid musical piece id' }, { status: 400 });
	}

	const payload = await request.json();
	const tags = payload?.division_tags;
	if (!Array.isArray(tags)) {
		return json({ status: 'error', reason: 'Invalid division tags payload' }, { status: 400 });
	}

	const normalized: string[] = [];
	for (const tag of tags) {
		if (!isValidDivisionTag(tag)) {
			return json({ status: 'error', reason: 'Invalid division tag value' }, { status: 400 });
		}
		if (!normalized.includes(tag)) {
			normalized.push(tag);
		}
	}

	await setPieceDivisionTags(musicalPieceId, normalized);
	return json({ id: musicalPieceId }, { status: 200 });
}
