import { env } from '$env/dynamic/private';
import { pool } from '$lib/server/db';
import { CodeGenerator } from '$lib/server/codeGenerator';
import type { PoolClient } from 'pg';
import type { AuthRole } from '$lib/server/session';

export interface LoginUser {
	id: number;
	email: string;
	first_login_at: Date | null;
	last_login_at: Date | null;
	role: AuthRole;
}

const DEFAULT_SENDER_EMAIL = 'noreply@concertprogram.app';
const DEFAULT_SENDER_NAME = 'Concert Program';

const RATE_LIMIT_LOCK_KEY = 4_424_242;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
let lastCodeIssuedAt: number | null = null;

export class UnauthorizedEmailError extends Error {}
export class RateLimitError extends Error {}

function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

async function requireAuthorizedUser(client: PoolClient, email: string): Promise<AuthRole> {
	const result = await client.query<{ role: AuthRole }>(
		`SELECT role FROM authorized_user WHERE email = $1`,
		[email]
	);

	if (result.rowCount === 0 || !result.rows[0]?.role) {
		throw new UnauthorizedEmailError('Unauthorized email address.');
	}

	return result.rows[0].role;
}

async function tryAcquireRateLimitLock(client: PoolClient): Promise<boolean> {
	try {
		const result = await client.query<{ locked: boolean }>(
			`SELECT pg_try_advisory_lock($1) AS locked`,
			[RATE_LIMIT_LOCK_KEY]
		);
		return result.rows[0]?.locked === true;
	} catch (err) {
		console.warn('Rate limit advisory lock unavailable, falling back to in-memory guard.', err);
		return false;
	}
}

function enforceRateLimitWindow(): void {
	const now = Date.now();
	if (lastCodeIssuedAt && now - lastCodeIssuedAt < RATE_LIMIT_WINDOW_MS) {
		throw new RateLimitError('Too many login attempts. Please wait a moment and try again.');
	}
}

async function releaseRateLimitLock(client: PoolClient, acquired: boolean): Promise<void> {
	if (!acquired) {
		return;
	}

	try {
		await client.query('SELECT pg_advisory_unlock($1)', [RATE_LIMIT_LOCK_KEY]);
	} catch (err) {
		console.warn('Failed to release advisory lock', err);
	}
}

export async function issueLoginCode(email: string): Promise<{ code: number; email: string }> {
	const normalizedEmail = normalizeEmail(email);
	const code = CodeGenerator.getCode();
	const client = await pool.connect();
	let lockAcquired = false;

	try {
		await requireAuthorizedUser(client, normalizedEmail);
		lockAcquired = await tryAcquireRateLimitLock(client);
		enforceRateLimitWindow();

		await client.query(
			`INSERT INTO login_user (email, code, last_code_sent_at)
			 VALUES ($1, $2, NOW())
			 ON CONFLICT (email)
			 DO UPDATE SET code = EXCLUDED.code, last_code_sent_at = NOW()`,
			[normalizedEmail, code]
		);

		lastCodeIssuedAt = Date.now();

		return { code, email: normalizedEmail };
	} finally {
		await releaseRateLimitLock(client, lockAcquired);
		client.release();
	}
}

export async function verifyLoginCode(code: number): Promise<LoginUser | null> {
	const client = await pool.connect();

	try {
		const result = await client.query<LoginUser & { role: AuthRole }>(
			`SELECT lu.id, lu.email, lu.first_login_at, lu.last_login_at, au.role
			 FROM login_user lu
			 JOIN authorized_user au ON au.email = lu.email
			 WHERE lu.code = $1
			 LIMIT 1`,
			[code]
		);

		if (result.rowCount == null || result.rowCount === 0) {
			return null;
		}

		const user = result.rows[0];
		const now = new Date();

		await client.query(
			`UPDATE login_user
			 SET last_login_at = $1, first_login_at = COALESCE(first_login_at, $1)
			 WHERE id = $2`,
			[now, user.id]
		);

		return user;
	} finally {
		client.release();
	}
}

export async function sendVerificationEmail(
	email: string,
	code: number,
	origin: string
): Promise<void> {
	const apiKey = env.BREVO_API_KEY;
	const senderEmail = env.BREVO_SENDER_EMAIL || DEFAULT_SENDER_EMAIL;
	const senderName = env.BREVO_SENDER_NAME || DEFAULT_SENDER_NAME;
	const verificationUrl = `${origin}/verify/email/${code}`;

	// If no API key is present, log and continue so local dev isn't blocked.
	if (!apiKey) {
		console.warn('BREVO_API_KEY not configured; skipping email send. Verification code:', code);
		return;
	}

	const payload = {
		sender: { email: senderEmail, name: senderName },
		to: [{ email }],
		subject: 'Your Concert Program login code',
		htmlContent: `<p>Your verification code is <strong>${code}</strong>.</p><p><a href="${verificationUrl}" style="display:inline-block;padding:10px 16px;background-color:#0d6efd;color:#ffffff;text-decoration:none;border-radius:4px;font-weight:600;">Verify</a></p><p>Or paste the link ${verificationUrl} into your browser.</p>`,
		textContent: `Your verification code is ${code}. Verify at ${verificationUrl}`
	};

	const response = await fetch('https://api.brevo.com/v3/smtp/email', {
		method: 'POST',
		headers: {
			accept: 'application/json',
			'content-type': 'application/json',
			'api-key': apiKey
		},
		body: JSON.stringify(payload)
	});

	if (!response.ok) {
		const responseText = await response.text();
		console.error('Failed to send verification email', response.status, responseText);
		throw new Error('Unable to send verification email right now.');
	}
}
