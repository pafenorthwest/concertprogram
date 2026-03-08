import { json } from '@sveltejs/kit';
import { isAuthorizedRequest } from '$lib/server/apiAuth';
import {
	addPerformancePieceAssociation,
	fetchPerformancePieces,
	getPerformancePieceSelectionSummary,
	removePerformancePieceAssociation
} from '$lib/server/db';

function parseNumber(value: string | null): number | null {
	if (!value) {
		return null;
	}
	const parsed = Number(value);
	return Number.isInteger(parsed) ? parsed : null;
}

function parseNullableString(value: unknown): string | null {
	if (value == null) {
		return null;
	}
	const trimmed = String(value).trim();
	return trimmed.length > 0 ? trimmed : null;
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

export async function GET({ url, request, cookies }) {
	const authError = await ensureAuthorized(url, request, cookies.get('pafe_auth'));
	if (authError) {
		return authError;
	}

	const performanceId = parseNumber(url.searchParams.get('performance_id'));
	if (!performanceId) {
		return json({ status: 'error', reason: 'Invalid performance id' }, { status: 400 });
	}

	const piecesResult = await fetchPerformancePieces(performanceId);
	const selection = await getPerformancePieceSelectionSummary(performanceId);

	const pieces = piecesResult.rows.map((row) => ({
		performance_id: row.performance_id,
		musical_piece_id: row.musical_piece_id,
		printed_name: row.printed_name,
		movement: row.movement,
		is_performance_piece: row.is_performance_piece === true,
		composer_name: row.composer_name
	}));

	return json(
		{
			performance_id: performanceId,
			pieces,
			total_pieces: selection.total,
			selected_piece_id: selection.selected_piece_id
		},
		{ status: 200 }
	);
}

export async function POST({ url, request, cookies }) {
	const authError = await ensureAuthorized(url, request, cookies.get('pafe_auth'));
	if (authError) {
		return authError;
	}

	const body = await request.json();
	const performanceId = parseNumber(body?.performance_id?.toString?.() ?? null);
	const musicalPieceId = parseNumber(body?.musical_piece_id?.toString?.() ?? null);
	const movement = parseNullableString(body?.movement);

	if (!performanceId || !musicalPieceId) {
		return json(
			{ status: 'error', reason: 'Invalid performance or musical piece id' },
			{ status: 400 }
		);
	}

	await addPerformancePieceAssociation(performanceId, musicalPieceId, movement);
	return json({ status: 'ok' }, { status: 200 });
}

export async function DELETE({ url, request, cookies }) {
	const authError = await ensureAuthorized(url, request, cookies.get('pafe_auth'));
	if (authError) {
		return authError;
	}

	const body = await request.json();
	const performanceId = parseNumber(body?.performance_id?.toString?.() ?? null);
	const musicalPieceId = parseNumber(body?.musical_piece_id?.toString?.() ?? null);

	if (!performanceId || !musicalPieceId) {
		return json(
			{ status: 'error', reason: 'Invalid performance or musical piece id' },
			{ status: 400 }
		);
	}

	await removePerformancePieceAssociation(performanceId, musicalPieceId);
	return json({ status: 'ok' }, { status: 200 });
}
