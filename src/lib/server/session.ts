import { auth_code } from '$env/static/private';
import { createHmac } from 'crypto';

export const SESSION_COOKIE_NAME = 'pafe_auth';
export const SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export type AuthRole = 'Admin' | 'ConcertMaster' | 'MusicEditor' | 'DivisionChair';

export interface AuthSession {
	email: string;
	role: AuthRole;
}

function getSecret(): string {
	// Reuse the existing auth_code secret to sign sessions until a dedicated secret is added.
	if (!auth_code) {
		console.warn('auth_code is not configured; session signatures will be weak.');
	}
	return auth_code || 'pafe-fallback-secret';
}

function sign(payload: string): string {
	return createHmac('sha256', getSecret()).update(payload).digest('base64url');
}

export function encodeSession(session: AuthSession): string {
	const payload = Buffer.from(JSON.stringify(session), 'utf8').toString('base64url');
	const signature = sign(payload);
	return `${payload}.${signature}`;
}

export function decodeSession(sessionToken?: string | null): AuthSession | null {
	if (!sessionToken) {
		return null;
	}

	const [payload, signature] = sessionToken.split('.');
	if (!payload || !signature) {
		return null;
	}

	if (sign(payload) !== signature) {
		return null;
	}

	try {
		const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as AuthSession;
		if (!session.email || !session.role) {
			return null;
		}
		return session;
	} catch (err) {
		console.error('Failed to decode session', err);
		return null;
	}
}
