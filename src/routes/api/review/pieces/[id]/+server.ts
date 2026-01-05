import { json } from '@sveltejs/kit';
import { getReviewSession } from '$lib/server/apiAuth';
import { updateMusicalPieceReviewMetadata } from '$lib/server/review';

function parseId(value: string | undefined): number | null {
	if (!value) {
		return null;
	}
	const id = Number(value);
	return Number.isFinite(id) ? id : null;
}

export async function PATCH({ params, request, cookies }) {
	const session = getReviewSession(request.headers.get('Authorization'), cookies.get('pafe_auth'));
	if (!session) {
		return json({ status: 'error', reason: 'Unauthorized' }, { status: 401 });
	}

	const musicalPieceId = parseId(params.id);
	if (!musicalPieceId) {
		return json({ status: 'error', reason: 'Invalid musical piece id' }, { status: 400 });
	}

	const payload = await request.json();
	if (!payload || typeof payload !== 'object') {
		return json({ status: 'error', reason: 'Invalid payload' }, { status: 400 });
	}

	if (payload.printed_name !== undefined && typeof payload.printed_name !== 'string') {
		return json({ status: 'error', reason: 'Invalid printed name' }, { status: 400 });
	}

	const updated = await updateMusicalPieceReviewMetadata(musicalPieceId, payload);
	if (updated === 0) {
		return json({ status: 'error', reason: 'No updates applied' }, { status: 400 });
	}

	return json({ id: musicalPieceId }, { status: 200 });
}
