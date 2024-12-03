import { pafe_series } from '$lib/server/common';
import { updateById } from '$lib/server/db';
import { fail, json } from '@sveltejs/kit';
import type { OrderedPerformanceInterface } from '$lib/server/program';
import { isAuthorized } from '$lib/server/apiAuth';
import { getCachedTimeStamps } from '$lib/cache';
import { auth_code } from '$env/static/private';

export async function PUT({params, request, cookies}) {
	// Get the Authorization header
	const pafeAuth = cookies.get('pafe_auth')
	if (pafeAuth != auth_code && !isAuthorized(request.headers.get('Authorization'))) {
		return new Response('Unauthorized', { status: 401 });
	}

	const access_control_headers = {
		'Access-Control-Allow-Origin': '*', // Allow all hosts
		'Access-Control-Allow-Methods': 'POST' // Specify allowed methods
	};

	try {
		const performance: OrderedPerformanceInterface = await request.json();

		if (performance.concertSeries.toLowerCase() === 'concerto') {
			fail(400, {error: 'Not allowed to force Concerto entries, please use /schedule instead'})
		}

		let concertStart = null
		if (performance.concertSeries.toLowerCase() !== 'waitlist') {
			const concertStartTimes = getCachedTimeStamps()
			concertStart = concertStartTimes.find(concert => concert.concert_number_in_series === performance.concertSeries).start_time
		}

		if (!performance ) {
			fail(400, {error: 'Missing Data, Try Again'})
		} else {
			const rowCount = await movePerformanceByChair(params.id, pafe_series(), performance.concertSeries, concertStart);
			if (rowCount != null && rowCount > 0) {
				return json({status: 200, body: {message: 'Update successful'}, headers: access_control_headers});
			} else {
				fail(500, {error: 'Update Failed'})
			}
		}
	} catch  {
		fail(500, {error: 'Failed to process the request'})
	}
}