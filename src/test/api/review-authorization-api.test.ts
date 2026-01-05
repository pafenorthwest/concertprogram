import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { auth_code } from '$env/static/private';
import { env } from '$env/dynamic/private';
import { insertTable, pool } from '$lib/server/db';
import { encodeSession, SESSION_COOKIE_NAME, type AuthRole } from '$lib/server/session';
import type { ContributorInterface, MusicalPieceInterface } from '$lib/server/common';

const baseUrl = 'http://localhost:8888';
const testDivision = 'Piano';
const bearerEmail = env.REVIEW_BEARER_EMAIL ?? 'review-bearer@test.concertprogram';

const adminSession = {
	email: 'review-admin@test.concertprogram',
	role: 'Admin' as AuthRole
};

const nonReviewSession = {
	email: 'review-concertmaster@test.concertprogram',
	role: 'ConcertMaster' as AuthRole
};

type ReviewEndpoint = {
	name: string;
	method: 'GET' | 'PATCH' | 'PUT' | 'POST';
	path: (pieceId: number) => string;
	body?: () => unknown;
};

const reviewEndpoints: ReviewEndpoint[] = [
	{
		name: 'queue',
		method: 'GET',
		path: () => `${baseUrl}/api/review/queue?division=${testDivision}`
	},
	{
		name: 'metadata',
		method: 'PATCH',
		path: (pieceId) => `${baseUrl}/api/review/pieces/${pieceId}`,
		body: () => ({ printed_name: 'Review Test Updated' })
	},
	{
		name: 'categories',
		method: 'PUT',
		path: (pieceId) => `${baseUrl}/api/review/pieces/${pieceId}/categories`,
		body: () => ({ categories: ['Solo'] })
	},
	{
		name: 'division-tags',
		method: 'PUT',
		path: (pieceId) => `${baseUrl}/api/review/pieces/${pieceId}/division-tags`,
		body: () => ({ division_tags: [testDivision] })
	},
	{
		name: 'complete',
		method: 'POST',
		path: (pieceId) => `${baseUrl}/api/review/pieces/${pieceId}/complete`
	}
];

let adminCookie: string;
let nonReviewCookie: string;
let pieceId: number;
let contributorId: number;
let adminReviewerId: number;
let bearerReviewerId: number;

async function upsertAuthorizedUser(email: string, role: AuthRole): Promise<number> {
	const normalized = email.toLowerCase();
	const result = await pool.query<{ id: number }>(
		`INSERT INTO authorized_user (email, role)
     VALUES ($1, $2)
     ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role
     RETURNING id`,
		[normalized, role]
	);
	return result.rows[0].id;
}

async function seedPiece(): Promise<void> {
	const composer: ContributorInterface = {
		id: null,
		full_name: `Review Composer ${Date.now()}`,
		years_active: '2000 - 2001',
		role: 'Composer',
		notes: ''
	};
	const composerResult = await insertTable('contributor', composer);
	contributorId = composerResult.rows[0].id;

	const piece: MusicalPieceInterface = {
		id: null,
		printed_name: `Review Piece ${Date.now()}`,
		first_contributor_id: contributorId,
		all_movements: 'Allegro',
		second_contributor_id: null,
		third_contributor_id: null,
		imslp_url: null,
		comments: null,
		flag_for_discussion: false,
		discussion_notes: null,
		is_not_appropriate: false
	};
	const pieceResult = await insertTable('musical_piece', piece);
	pieceId = pieceResult.rows[0].id;

	await pool.query(
		`INSERT INTO musical_piece_division_tag (musical_piece_id, division_tag)
     VALUES ($1, $2)
     ON CONFLICT (musical_piece_id, division_tag) DO NOTHING`,
		[pieceId, testDivision]
	);
	await pool.query(`DELETE FROM musical_piece_category_map WHERE musical_piece_id = $1`, [pieceId]);
	await pool.query(`DELETE FROM musical_piece_review WHERE musical_piece_id = $1`, [pieceId]);
}

async function cleanupPiece(): Promise<void> {
	if (pieceId) {
		await pool.query(`DELETE FROM musical_piece_review WHERE musical_piece_id = $1`, [pieceId]);
		await pool.query(`DELETE FROM musical_piece_division_tag WHERE musical_piece_id = $1`, [
			pieceId
		]);
		await pool.query(`DELETE FROM musical_piece_category_map WHERE musical_piece_id = $1`, [
			pieceId
		]);
		await pool.query(`DELETE FROM musical_piece WHERE id = $1`, [pieceId]);
	}
	if (contributorId) {
		await pool.query(`DELETE FROM contributor WHERE id = $1`, [contributorId]);
	}
	await pool.query(`DELETE FROM authorized_user WHERE email = ANY($1::text[])`, [
		[
			adminSession.email.toLowerCase(),
			nonReviewSession.email.toLowerCase(),
			bearerEmail.toLowerCase()
		]
	]);
}

async function callReviewEndpoint(
	endpoint: ReviewEndpoint,
	auth: { cookie?: string; authorization?: string }
) {
	const headers: Record<string, string> = {};
	if (endpoint.body) {
		headers['Content-Type'] = 'application/json';
	}
	if (auth.cookie) {
		headers['Cookie'] = `${SESSION_COOKIE_NAME}=${auth.cookie}`;
	}
	if (auth.authorization) {
		headers['Authorization'] = auth.authorization;
	}

	const response = await fetch(endpoint.path(pieceId), {
		method: endpoint.method,
		headers,
		body: endpoint.body ? JSON.stringify(endpoint.body()) : undefined
	});
	const text = await response.text();
	let data: unknown = null;
	try {
		data = text ? JSON.parse(text) : null;
	} catch {
		data = text;
	}

	return { status: response.status, data };
}

describe.sequential('Review API authorization contract', () => {
	beforeAll(async () => {
		adminCookie = encodeSession(adminSession);
		nonReviewCookie = encodeSession(nonReviewSession);
		adminReviewerId = await upsertAuthorizedUser(adminSession.email, adminSession.role);
		await upsertAuthorizedUser(nonReviewSession.email, nonReviewSession.role);
		bearerReviewerId = await upsertAuthorizedUser(bearerEmail, 'Admin');
		await seedPiece();
	});

	afterAll(async () => {
		await cleanupPiece();
	});

	it('allows review roles via session cookie only', async () => {
		for (const endpoint of reviewEndpoints) {
			const { status, data } = await callReviewEndpoint(endpoint, { cookie: adminCookie });
			expect(status).toBe(200);

			if (endpoint.name === 'queue') {
				const items = (data as { items?: Array<{ id: number }> })?.items ?? [];
				expect(Array.isArray(items)).toBe(true);
				expect(items.some((item) => item.id === pieceId)).toBe(true);
			}
		}

		const completion = await pool.query<{ status: string }>(
			`SELECT status FROM musical_piece_review WHERE musical_piece_id = $1 AND reviewer_id = $2`,
			[pieceId, adminReviewerId]
		);
		expect(completion.rows[0]?.status).toBe('Complete');
	});

	it('rejects non-review session cookies without bearer token', async () => {
		for (const endpoint of reviewEndpoints) {
			const { status, data } = await callReviewEndpoint(endpoint, { cookie: nonReviewCookie });
			expect(status).toBe(401);
			const reason = (data as { reason?: string })?.reason ?? '';
			expect(String(reason)).toMatch(/unauthorized/i);
		}
	});

	it('accepts non-review cookies when paired with a valid bearer token', async () => {
		for (const endpoint of reviewEndpoints) {
			const { status } = await callReviewEndpoint(endpoint, {
				cookie: nonReviewCookie,
				authorization: `Bearer ${auth_code}`
			});
			expect(status).toBe(200);
		}
	});

	it('accepts bearer token without a session cookie', async () => {
		for (const endpoint of reviewEndpoints) {
			const { status } = await callReviewEndpoint(endpoint, {
				authorization: `Bearer ${auth_code}`
			});
			expect(status).toBe(200);
		}

		const completion = await pool.query<{ status: string; reviewer_id: number }>(
			`SELECT status, reviewer_id FROM musical_piece_review WHERE musical_piece_id = $1 AND reviewer_id = $2`,
			[pieceId, bearerReviewerId]
		);
		expect(completion.rows[0]?.status).toBe('Complete');
	});
});
