import { json } from '@sveltejs/kit';
import { isAuthorized } from '$lib/server/apiAuth';
import { auth_code } from '$env/static/private';
import { Performance } from '$lib/server/import';

export async function POST({request, cookies}) {
	// Check Authorization
	const pafeAuth = cookies.get('pafe_auth');

	if (!request.headers.has('Authorization')) {
		return json({ result: 'error', reason: 'Unauthorized' }, { status: 401 });
	}

	if (pafeAuth != auth_code && !isAuthorized(request.headers.get('Authorization'))) {
		return json({ result: 'error', reason: 'Unauthorized' }, { status: 403 });
	}
	const { imported } = await request.json();

	if ( !imported.class_name ) {
		return json({ result: 'error', reason: 'Missing Field' }, { status: 400 });
	} else {
			const singlePerformance: Performance = new Performance()
			try {
				await singlePerformance.initialize(imported)
			} catch (e) {
				return json({ status: 'error', message: `${(e as Error).message}` }, { status: 500 });
			}
	}
}
