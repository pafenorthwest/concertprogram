import { json } from '@sveltejs/kit';
import { isAuthorizedRequest } from '$lib/server/apiAuth';
import { clearPerformancePieceSelection } from '$lib/server/db';

function parseNumber(value: string | null): number | null {
	if (!value) {
		return null;
	}
	const parsed = Number(value);
	return Number.isInteger(parsed) ? parsed : null;
}

function isSameOrigin(url: URL, request: Request): boolean {
	const origin = request.headers.get('origin');
	const appOrigin = `${url.protocol}//${url.host}`;
	return origin === appOrigin;
}

async function ensureAuthorized(url: URL, request: Request, pafeAuth: string | undefined) {
	if (isSameOrigin(url, request)) {
		return null;
	}
	if (!isAuthorizedRequest(request.headers.get('Authorization'), pafeAuth)) {
		return json({ result: 'error', reason: 'Unauthorized' }, { status: 401 });
	}
	return null;
}

export async function POST({ url, request, cookies }) {
	const authError = await ensureAuthorized(url, request, cookies.get('pafe_auth'));
	if (authError) {
		return authError;
	}

	const body = await request.json();
	const performanceId = parseNumber(body?.performance_id?.toString?.() ?? null);
	if (!performanceId) {
		return json({ status: 'error', reason: 'Invalid performance id' }, { status: 400 });
	}

	await clearPerformancePieceSelection(performanceId);
	return json({ status: 'ok' }, { status: 200 });
}
