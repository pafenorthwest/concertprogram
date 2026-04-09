import { json } from '@sveltejs/kit';
import { isAuthorizedRequest } from '$lib/server/apiAuth';
import { year } from '$lib/server/common';
import { forceMoveProgramEntry } from '$lib/server/db';

function parsePositiveInteger(value: unknown): number | null {
	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed <= 0) {
		return null;
	}
	return parsed;
}

export async function PUT({ url, request, cookies, params }) {
	const pafeAuth = cookies.get('pafe_auth') || '';
	const origin = request.headers.get('origin');
	const appOrigin = `${url.protocol}//${url.host}`;

	if (origin !== appOrigin) {
		if (!isAuthorizedRequest(request.headers.get('Authorization'), pafeAuth)) {
			return json({ result: 'error', reason: 'Unauthorized' }, { status: 401 });
		}
	}

	const performanceId = parsePositiveInteger(params.id);
	if (performanceId == null) {
		return json({ status: 'error', reason: 'Invalid performance id' }, { status: 400 });
	}

	try {
		const { concertSeries, concertNum, performerId } = await request.json();
		const targetSeries = typeof concertSeries === 'string' ? concertSeries.trim() : '';
		const parsedPerformerId = parsePositiveInteger(performerId);
		const parsedConcertNum = parsePositiveInteger(concertNum);

		if (parsedPerformerId == null) {
			return json({ status: 'error', reason: 'Invalid performer id' }, { status: 400 });
		}
		if (targetSeries !== 'Eastside' && targetSeries !== 'Waitlist') {
			return json({ status: 'error', reason: 'Invalid concert series' }, { status: 400 });
		}
		if (parsedConcertNum == null) {
			return json({ status: 'error', reason: 'Invalid concert number' }, { status: 400 });
		}

		const moved = await forceMoveProgramEntry(
			performanceId,
			parsedPerformerId,
			targetSeries,
			parsedConcertNum,
			year()
		);
		if (!moved) {
			return json({ status: 'error', reason: 'Move failed' }, { status: 500 });
		}

		return json(
			{
				id: performanceId,
				performerId: parsedPerformerId,
				concertSeries: targetSeries,
				concertNum: parsedConcertNum,
				message: 'Move successful'
			},
			{ status: 200 }
		);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to process the request';
		if (message.includes('not found')) {
			return json({ status: 'error', reason: message }, { status: 404 });
		}
		return json({ status: 'error', reason: message }, { status: 500 });
	}
}
