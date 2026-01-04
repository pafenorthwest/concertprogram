import { json } from '@sveltejs/kit';
import { getSessionFromCookie, isAuthorizedRequest } from '$lib/server/apiAuth';
import { getAuthorizedUserId, markReviewComplete } from '$lib/server/review';

function parseId(value: string | undefined): number | null {
	if (!value) {
		return null;
	}
	const id = Number(value);
	return Number.isFinite(id) ? id : null;
}

export async function POST({ params, request, cookies }) {
	const pafeAuth = cookies.get('pafe_auth');
	if (!isAuthorizedRequest(request.headers.get('Authorization'), pafeAuth)) {
		return json({ status: 'error', reason: 'Unauthorized' }, { status: 401 });
	}

	const session = getSessionFromCookie(pafeAuth);
	if (!session) {
		return json({ status: 'error', reason: 'Reviewer not found' }, { status: 403 });
	}

	const musicalPieceId = parseId(params.id);
	if (!musicalPieceId) {
		return json({ status: 'error', reason: 'Invalid musical piece id' }, { status: 400 });
	}

	const reviewerId = await getAuthorizedUserId(session.email);
	if (!reviewerId) {
		return json({ status: 'error', reason: 'Reviewer not found' }, { status: 403 });
	}

	await markReviewComplete(musicalPieceId, reviewerId);
	return json({ id: musicalPieceId }, { status: 200 });
}
