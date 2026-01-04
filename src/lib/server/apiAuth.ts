import { auth_code } from '$env/static/private';
import { decodeSession } from '$lib/server/session';
import type { AuthRole, AuthSession } from '$lib/server/session';

const REVIEW_ROLES: AuthRole[] = ['Admin', 'MusicEditor', 'DivisionChair'];

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

export function getReviewSession(pafeAuth?: string | null): AuthSession | null {
	const session = getSessionFromCookie(pafeAuth);
	if (!session) {
		return null;
	}
	if (!REVIEW_ROLES.includes(session.role)) {
		return null;
	}
	return session;
}
