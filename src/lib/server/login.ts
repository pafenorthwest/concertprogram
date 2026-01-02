import { env } from '$env/dynamic/private';
import { pool } from '$lib/server/db';
import { CodeGenerator } from '$lib/server/codeGenerator';

export interface LoginUser {
	id: number;
	email: string;
	first_login_at: Date | null;
	last_login_at: Date | null;
}

const DEFAULT_SENDER_EMAIL = 'noreply@concertprogram.app';
const DEFAULT_SENDER_NAME = 'Concert Program';

function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

export async function issueLoginCode(email: string): Promise<{ code: number; email: string }> {
	const normalizedEmail = normalizeEmail(email);
	const code = CodeGenerator.getCode();
	const client = await pool.connect();

	try {
		await client.query(
			`INSERT INTO login_user (email, code, last_code_sent_at)
			 VALUES ($1, $2, NOW())
			 ON CONFLICT (email)
			 DO UPDATE SET code = EXCLUDED.code, last_code_sent_at = NOW()`,
			[normalizedEmail, code]
		);

		return { code, email: normalizedEmail };
	} finally {
		client.release();
	}
}

export async function verifyLoginCode(code: number): Promise<LoginUser | null> {
	const client = await pool.connect();

	try {
		const result = await client.query(
			`SELECT id, email, first_login_at, last_login_at
			 FROM login_user
			 WHERE code = $1
			 LIMIT 1`,
			[code]
		);

		if (result.rowCount == null || result.rowCount === 0) {
			return null;
		}

		const user: LoginUser = result.rows[0];
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

export async function sendVerificationEmail(email: string, code: number, origin: string): Promise<void> {
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
		htmlContent: `<p>Your verification code is <strong>${code}</strong>.</p><p>Click <a href="${verificationUrl}">here</a> to verify, or paste the code into the site.</p>`,
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
