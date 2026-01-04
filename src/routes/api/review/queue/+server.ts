import { json } from '@sveltejs/kit';
import { getSessionFromCookie, isAuthorizedRequest } from '$lib/server/apiAuth';
import { fetchReviewQueue, getAuthorizedUserId, isValidDivisionTag } from '$lib/server/review';

export async function GET({ url, request, cookies }) {
	const pafeAuth = cookies.get('pafe_auth');
	if (!isAuthorizedRequest(request.headers.get('Authorization'), pafeAuth)) {
		return json({ status: 'error', reason: 'Unauthorized' }, { status: 401 });
	}

	const session = getSessionFromCookie(pafeAuth);
	if (!session) {
		return json({ status: 'error', reason: 'Reviewer not found' }, { status: 403 });
	}

	const division = url.searchParams.get('division');
	if (!isValidDivisionTag(division)) {
		return json({ status: 'error', reason: 'Invalid division tag' }, { status: 400 });
	}

	const reviewerId = await getAuthorizedUserId(session.email);
	if (!reviewerId) {
		return json({ status: 'error', reason: 'Reviewer not found' }, { status: 403 });
	}

	const items = await fetchReviewQueue(reviewerId, division);
	return json({ items }, { status: 200 });
}
