import { type PerformanceInterface, selectInstrument } from '$lib/server/common';
import { deleteById, queryTable, updatePerformance } from '$lib/server/db';
import { json } from '@sveltejs/kit';
import { isAuthorized } from '$lib/server/apiAuth';
import { auth_code } from '$env/static/private';

export async function GET({ params }) {
	try {
		const res = await queryTable('performance', parseInt(params.id, 10));
		if (res.rowCount != 1) {
			return json({ status: 'error', message: 'Not Found' }, { status: 404 });
		}
		return json(res.rows);
	} catch {
		return json({ status: 'error', message: 'Failed to process the request' }, { status: 500 });
	}
}
export async function PUT({ params, request }) {
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
			return json({ id: params.id, message: 'Invalidate Instrument' }, { status: 400 });
		}

		let cleaned_pafe_series = year;
		if (cleaned_pafe_series == null) {
			cleaned_pafe_series = pafe_series();
		}

		const performance: PerformanceInterface = {
			id: parseInt(params.id, 10),
			performer_name: performer_name,
			class: class_name,
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
			const res = await updatePerformance(
				performance,
				performer_id,
				order,
				comment,
				warm_up_room_name,
				warm_up_room_start,
				warm_up_room_end
			);
			if (res.rowCount != null && res.rowCount > 0) {
				return json({ id: params.id, message: 'Update successful' }, { status: 200 });
			} else {
				return json({ id: params.id, message: 'Update failed' }, { status: 500 });
			}
		}
	} catch (error) {
		return json({ status: 'error', message: 'Failed to process the request' }, { status: 500 });
	}
}

export async function DELETE({ params, request, cookies }) {
	// Get the Authorization header
	const pafeAuth = cookies.get('pafe_auth') || '';
	if (pafeAuth != auth_code && !isAuthorized(request.headers.get('Authorization') || '')) {
		return new Response('Unauthorized', { status: 401 });
	}
	const rowCount = await deleteById('performance', parseInt(params.id, 10));

	if (rowCount != null && rowCount > 0) {
		return json({ message: 'Delete successful' }, { status: 200 });
	} else {
		return json({ message: 'Delete failed' }, { status: 500 });
	}
}
