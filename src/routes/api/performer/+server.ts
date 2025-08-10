import { type PerformerInterface, calcEpochAge, selectInstrument } from '$lib/server/common';
import { json } from '@sveltejs/kit';
import { createPerformer } from '$lib/server/performer';
import { isAuthorized } from '$lib/server/apiAuth';
import { auth_code } from '$env/static/private';

export async function POST({ request, cookies }) {
	// Check Authorization
	const pafeAuth = cookies.get('pafe_auth');

	if (!request.headers.has('Authorization')) {
		return json({ result: 'error', reason: 'Unauthorized' }, { status: 401 });
	}

	if (pafeAuth != auth_code && !isAuthorized(request.headers.get('Authorization'))) {
		return json({ result: 'error', reason: 'Unauthorized' }, { status: 403 });
	}

	// eslint-disable-next-line prefer-const
	let { full_name, age, instrument, email, phone } = await request.json();

	if (instrument == null || age == null) {
		return json({ result: 'error', reason: 'Bad Instrument or Age Value' }, { status: 400 });
	}
	instrument = selectInstrument(instrument);
	const birthYear = calcEpochAge(parseInt(age, 10));

	const performer: PerformerInterface = {
		id: null,
		full_name: full_name,
		epoch: birthYear,
		instrument: instrument,
		email: email,
		phone: phone
	};

	if (!performer.full_name || !performer.instrument || !performer.epoch) {
		return json({ result: 'error', reason: 'Missing Field' }, { status: 400 });
	} else {
		let newId: number | null = 0;
		try {
			newId = await createPerformer(performer);
		} catch (err) {
			return json({ status: 'error', message: `${(err as Error).message}` }, { status: 500 });
		}
		if (newId != null && newId > 0) {
			return json({ id: newId }, { status: 201 });
		} else {
			return json({ result: 'error', reason: 'Update Failed' }, { status: 500 });
		}
	}
}
