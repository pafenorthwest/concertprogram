import { deleteClassLottery, getClassLottery, updateClassLottery } from '$lib/server/db';
import { json } from '@sveltejs/kit';
import { createLottery } from '$lib/server/lottery';
import { auth_code } from '$env/static/private';
import { isAuthorized } from '$lib/server/apiAuth';

export async function GET({ params }) {
	try {
		const res = await getClassLottery(params.class_name);
		if (res.rowCount != 1) {
			return json({ status: 'error', message: 'Not Found' }, { status: 404 });
		}
		return json(res.rows);
	} catch {
		return json({ status: 'error', message: 'Failed to process the request' }, { status: 500 });
	}
}
export async function PUT({ url, cookies, params, request }) {
	// Check Authorization
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
		const { lottery } = await request.json();
		const class_name = params.class_name;

		if (!class_name || !lottery) {
			return json({ status: 'error', reason: 'Missing Fields' }, { status: 400 });
		} else {
			const results = await updateClassLottery(class_name, lottery);
			if (results.rowCount != null && results.rowCount > 0) {
				return json(
					{ id: params.class_name },
					{ status: 200, body: { message: 'Update successful' } }
				);
			} else {
				return json({ id: params.class_name }, { status: 500, body: { message: 'Update failed' } });
			}
		}
	} catch {
		return json({ status: 'error', message: 'Failed to process the request' }, { status: 500 });
	}
}

export async function POST({ url, cookies, params, request }) {
	// Check Authorization
	const pafeAuth = cookies.get('pafe_auth');
	const origin = request.headers.get('origin'); // The origin of the request (protocol + host + port)
	const appOrigin = `${url.protocol}//${url.host}`;

	// from local app no checks needed
	console.log(`origin ${origin} appOrigin ${appOrigin}`);
	if (origin !== appOrigin) {
		if (!request.headers.has('Authorization')) {
			return json({ result: 'error', reason: 'Unauthorized' }, { status: 401 });
		}

		if (pafeAuth != auth_code && !isAuthorized(request.headers.get('Authorization'))) {
			return json({ result: 'error', reason: 'Unauthorized' }, { status: 403 });
		}
	}

	try {
		const { lottery } = await request.json();
		const class_name = params.class_name;
		if (!class_name || !lottery) {
			return json({ status: 'error', reason: 'Missing Fields' }, { status: 400 });
		} else {
			if (await createLottery(class_name, lottery)) {
				return json(
					{ id: params.class_name },
					{ status: 201, body: { message: 'Update successful' } }
				);
			} else {
				return json({ id: params.class_name }, { status: 500, body: { message: 'Update failed' } });
			}
		}
	} catch {
		return json({ status: 'error', message: 'Failed to process the request' }, { status: 500 });
	}
}

export async function DELETE({ url, cookies, params, request }) {
	// Check Authorization
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
		await deleteClassLottery(params.class_name);
		return json({ id: params.class_name }, { status: 200, body: { message: 'Delete successful' } });
	} catch {
		return json({ status: 'error', message: 'Failed to process the request' }, { status: 500 });
	}
}
