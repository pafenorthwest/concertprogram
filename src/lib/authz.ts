import type { AuthRole } from '$lib/server/session';

export const ROLE_ROUTE_ALLOWLIST: Record<AuthRole, string[]> = {
	Admin: ['*', '/admin/users'],
	ConcertMaster: [
		'/',
		'/landing',
		'/about',
		'/login',
		'/logout',
		'/verify/email/[code]',
		'/schedule',
		'/admin',
		'/admin/lottery',
		'/admin/program'
	],
	MusicEditor: [
		'/',
		'/landing',
		'/about',
		'/login',
		'/logout',
		'/verify/email/[code]',
		'/admin/composer',
		'/admin/musicalpiece',
		'/admin/review'
	],
	DivisionChair: [
		'/',
		'/landing',
		'/about',
		'/login',
		'/logout',
		'/verify/email/[code]',
		'/admin/composer',
		'/admin/musicalpiece',
		'/admin/review',
		'/admin/list',
		'/admin/performer',
		'/admin/accompanist',
		'/admin/class'
	]
};

export const PROTECTED_ROUTE_PATTERNS = new Set(
	Object.values(ROLE_ROUTE_ALLOWLIST)
		.flatMap((routes) => routes.filter((route) => route !== '*'))
		.map((route) => normalizeRouteId(route))
);

export function normalizeRouteId(routeId: string | null | undefined): string | null {
	if (!routeId) {
		return null;
	}
	if (routeId === '') {
		return '/';
	}
	const trimmed = routeId.endsWith('/') && routeId !== '/' ? routeId.slice(0, -1) : routeId;
	return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

export function matchRoutePattern(pattern: string, routeId: string): boolean {
	if (pattern === routeId) {
		return true;
	}

	const patternParts = pattern.split('/').filter(Boolean);
	const routeParts = routeId.split('/').filter(Boolean);

	if (patternParts.length !== routeParts.length) {
		return false;
	}

	return patternParts.every((segment, index) => {
		const routeSegment = routeParts[index];
		return (segment.startsWith('[') && segment.endsWith(']')) || segment === routeSegment;
	});
}

export function roleAllowsRoute(role: AuthRole, routeId: string): boolean {
	const allowedRoutes = ROLE_ROUTE_ALLOWLIST[role] ?? [];
	const normalizedRoute = normalizeRouteId(routeId);
	if (!normalizedRoute) {
		return false;
	}
	return allowedRoutes.some(
		(pattern) => pattern === '*' || matchRoutePattern(pattern, normalizedRoute)
	);
}
