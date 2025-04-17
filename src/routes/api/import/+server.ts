import { json } from '@sveltejs/kit';
import { isAuthorized } from '$lib/server/apiAuth';
import { auth_code } from '$env/static/private';
import { Performance } from '$lib/server/import';
import type { ImportPerformanceInterface } from '$lib/server/common';

export async function PUT({request, cookies}) {
	// Check Authorization
	const pafeAuth = cookies.get('pafe_auth');

	if (!request.headers.has('Authorization')) {
		return json({ result: 'error', reason: 'Unauthorized' }, { status: 401 });
	}

	if (pafeAuth != auth_code && !isAuthorized(request.headers.get('Authorization'))) {
		return json({ result: 'error', reason: 'Unauthorized' }, { status: 403 });
	}

	const text = await request.text()
	const imported: ImportPerformanceInterface = JSON.parse(text);

	if ( !imported.class_name ) {
		return json({ result: 'error', reason: 'Missing Field' }, { status: 400 });
	} else {
			const singlePerformance: Performance = new Performance()
			try {
				const importResults = await singlePerformance.initialize(imported)

				return json(
					{ result: 'success', performerId: importResults.performerId, performanceId: importResults.performanceId },
					{ status: importResults.new ? 201 : 200 }
				);
			} catch (e) {
				console.log((e as Error).message);
				return json({ result: 'error', reason: `${(e as Error).message}` }, { status: 500 });
			}
	}

}

export async function DELETE({request, cookies}) {
	// Check Authorization
	const pafeAuth = cookies.get('pafe_auth');

	if (!request.headers.has('Authorization')) {
		return json({ result: 'error', reason: 'Unauthorized' }, { status: 401 });
	}

	if (pafeAuth != auth_code && !isAuthorized(request.headers.get('Authorization'))) {
		return json({ result: 'error', reason: 'Unauthorized' }, { status: 403 });
	}

	const imported = await request.json();

	if ( !imported.class_name ) {
		return json({ result: 'error', reason: 'Missing Field' }, { status: 400 });
	} else {
		const singlePerformance: Performance = new Performance()
		try {

			const age = parseInt(imported.age, 10)

			const results = await singlePerformance.deleteByLookup(
				imported.class_name,
				imported.performer_name,
				age,
				imported.concert_series,
				imported.instrument
			)

			// Not Found Error
			if ( results.result === 'error' ) {
				return json({ result: 'error', reason: results.reason }, { status: 404 });
			}

			return json(
				{ result: results.result, performerId: results.performerId, performanceId: results.performerId },
				{ status: 200 }
			);
		} catch (e) {
			return json({ result: 'error', reason: `${(e as Error).message}` }, { status: 500 });
		}
	}

}
