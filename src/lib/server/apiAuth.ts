import { auth_code } from '$env/static/private';
import { env } from '$env/dynamic/private';
import { decodeSession } from '$lib/server/session';
import type { AuthRole, AuthSession } from '$lib/server/session';

const REVIEW_ROLES: AuthRole[] = ['Admin', 'MusicEditor', 'DivisionChair'];
const BEARER_FALLBACK_SESSION: AuthSession = {
	email: env.REVIEW_BEARER_EMAIL ?? 'review-bearer@test.concertprogram',
	role: 'Admin'
};

export function isAuthorized(authHeader: string | null | undefined): boolean {
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return false;
	}

	const token = authHeader.slice(7); // Remove "Bearer "

	return token === auth_code;
}

export function getSessionFromCookie(pafeAuth?: string | null): AuthSession | null {
	return decodeSession(pafeAuth);
}

export function isAuthorizedRequest(
	authHeader: string | null | undefined,
	pafeAuth?: string | null
): boolean {
	const session = getSessionFromCookie(pafeAuth);
	if (session) {
		return true;
	}

	return isAuthorized(authHeader);
}

export function getReviewSession(
	authHeader: string | null | undefined,
	pafeAuth?: string | null
): AuthSession | null {
	const session = getSessionFromCookie(pafeAuth);
	if (session) {
		if (REVIEW_ROLES.includes(session.role)) {
			return session;
		}
		return isAuthorized(authHeader) ? session : null;
	}

	if (isAuthorized(authHeader)) {
		return BEARER_FALLBACK_SESSION;
	}

	return null;
}
