import { pafe_series } from '$lib/server/common';
import { movePerformanceByChair, updateById } from '$lib/server/db';
import { fail, json } from '@sveltejs/kit';
import { isAuthorized } from '$lib/server/apiAuth';
import { getCachedTimeStamps } from '$lib/cache';
import { auth_code } from '$env/static/private';

export async function PUT({ params, request, cookies }) {
	// Get the Authorization header
	const pafeAuth = cookies.get('pafe_auth');
	if (pafeAuth != auth_code && !isAuthorized(request.headers.get('Authorization'))) {
		return new Response('Unauthorized', { status: 401 });
	}

	const access_control_headers = {
		'Access-Control-Allow-Origin': '*', // Allow all hosts
		'Access-Control-Allow-Methods': 'POST' // Specify allowed methods
	};

	try {
		const performance = await request.json();
		const id = Number(params.id);
		const concertNum = Number(performance.concertNum);

		if (performance.concertSeries.toLowerCase() === 'concerto') {
			fail(400, { error: 'Not allowed to force Concerto entries, please use /schedule instead' });
		}

		let concertStart = null;
		if (performance.concertSeries.toLowerCase() !== 'waitlist') {
			const concertStartTimes = getCachedTimeStamps();
			concertStart = concertStartTimes.data.find(
				(concert) => concert.concert_number_in_series === concertNum
			).normalizedStartTime;
		}

		if (!performance) {
			fail(400, { error: 'Missing Data, Try Again' });
		} else {
			const success = await movePerformanceByChair(
				id,
				performance.performerId,
				pafe_series(),
				performance.concertSeries,
				concertStart
			);
			if (success) {
				return json({
					status: 200,
					body: { message: 'Update successful' },
					headers: access_control_headers
				});
			} else {
				fail(500, { error: 'Update Failed' });
			}
		}
	} catch {
		fail(500, { error: 'Failed to process the request' });
	}
}
