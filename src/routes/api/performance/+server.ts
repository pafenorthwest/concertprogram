import { json } from '@sveltejs/kit';
import { type PerformanceInterface, selectInstrument } from '$lib/server/common';
import { insertPerformance } from '$lib/server/db';
import { isAuthorized } from '$lib/server/apiAuth';
import { auth_code } from '$env/static/private';

export async function POST({ request, cookies }) {
	// Get the Authorization header
	const pafeAuth = cookies.get('pafe_auth');
	if ((pafeAuth || '') != auth_code && !isAuthorized(request.headers.get('Authorization') || '')) {
		return new Response('Unauthorized', { status: 401 });
	}

	const access_control_headers = {
		'Access-Control-Allow-Origin': '*', // Allow all hosts
		'Access-Control-Allow-Methods': 'POST' // Specify allowed methods
	};

	try {
		// the following fields are often not included
		// order, warm_up_room_name, warm_up_room_start, warm_up_room_name
		const {
			performer_name,
			class_name,
			duration,
			accompanist_id,
			concert_series,
			year,
			instrument,
			order,
			comment,
			warm_up_room_name,
			warm_up_room_start,
			warm_up_room_end
		} = await request.json();

		const instrumentEnum = selectInstrument(instrument);
		if (instrumentEnum == null) {
			return json({ message: 'Invalidate Instrument' }, { status: 400 });
		}

		let cleaned_pafe_series = year;
		if (cleaned_pafe_series == null) {
			cleaned_pafe_series = pafe_series();
		}

		const performance: PerformanceInterface = {
			id: null,
			class: class_name,
			performer_name: performer_name,
			duration: duration,
			accompanist_id: accompanist_id,
			concert_series: concert_series,
			year: cleaned_pafe_series,
			instrument: instrumentEnum
		};

		if (!performance.performer_name || !performance.concert_series) {
			return json({ message: 'Missing Field, Try Again' }, { status: 400 });
		} else {
			// get performer id
			const performer_id = 1;
			const result = await insertPerformance(
				performance,
				performer_id,
				order,
				comment,
				warm_up_room_name,
				warm_up_room_start,
				warm_up_room_end
			);
			if (result.rowCount != null && result.rowCount > 0) {
				return json({
					status: 200,
					message: 'Update successful',
					headers: access_control_headers
				});
			} else {
				return json({ message: 'Update failed' }, { status: 500 });
			}
		}
	} catch {
		return json({ status: 'error', message: 'Failed to process the request' }, { status: 500 });
	}
}
