import { json } from '@sveltejs/kit';
import { type PerformanceInterface, selectInstrument, year as pafeYear } from '$lib/server/common';
import { insertPerformance } from '$lib/server/db';
import { isAuthorized } from '$lib/server/apiAuth';
import { auth_code } from '$env/static/private';

export async function POST({ url, request, cookies }) {
	// Get the Authorization header
	const pafeAuth = cookies.get('pafe_auth');
	const origin = request.headers.get('origin'); // The origin of the request (protocol + host + port)
	const appOrigin = `${url.protocol}//${url.host}`;

	// from local app no checks needed
	if (origin !== appOrigin) {
		if (!request.headers.has('Authorization')) {
			return json({ result: 'error', reason: 'Unauthorized' }, { status: 401 });
		}

		if (pafeAuth != auth_code && !isAuthorized(request.headers.get('Authorization'))) {
			return json({ result: 'error', reason: 'Unauthorized' }, { status: 403 });
		}
	}

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
			chair_override,
			order,
			comment,
			warm_up_room_name,
			warm_up_room_start,
			warm_up_room_end
		} = await request.json();

		if (instrument == null) {
			return json({ status: 'error', reason: 'Invalid Instrument' }, { status: 400 });
		}

		const instrumentEnum = selectInstrument(instrument);
		const cleaned_pafe_series = year || pafeYear();
		const chairOverride = chair_override === true;
		const performance: PerformanceInterface = {
			id: null,
			class: class_name,
			performer_name: performer_name,
			duration: duration,
			chair_override: chairOverride,
			accompanist_id: accompanist_id,
			concert_series: concert_series,
			year: cleaned_pafe_series,
			instrument: instrumentEnum
		};

		if (!performer_name || !concert_series) {
			return json({ status: 'error', message: 'Missing Fields' }, { status: 400 });
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
				return json({ id: result.rows[0].id, message: 'Update successful' }, { status: 201 });
			} else {
				return json({ status: 'error', message: 'Update failed' }, { status: 500 });
			}
		}
	} catch {
		return json({ status: 'error', message: 'Failed to process the request' }, { status: 500 });
	}
}
