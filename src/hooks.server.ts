import { initializeCache } from '$lib/cache';
import { normalizeRouteId, PROTECTED_ROUTE_PATTERNS, roleAllowsRoute } from '$lib/authz';
import { redirect, type Handle } from '@sveltejs/kit';
import { decodeSession, SESSION_COOKIE_NAME } from '$lib/server/session';

export const handle: Handle = async ({ resolve, event }) => {
	// Apply CORS header for API routes
	if (event.url.pathname.startsWith('/api')) {
		// Required for CORS to work
		if (event.request.method === 'OPTIONS') {
			return new Response(null, {
				headers: {
					'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Headers': 'Content-Type, Authorization'
				}
			});
		}
	}

	const sessionCookie = event.cookies.get(SESSION_COOKIE_NAME);
	const session = decodeSession(sessionCookie);
	event.locals.session = session;
	event.locals.user = session ? { email: session.email, role: session.role } : null;

	const routeId = normalizeRouteId(event.route.id);
	if (routeId && PROTECTED_ROUTE_PATTERNS.has(routeId) && session?.role) {
		if (session.role !== 'Admin' && !roleAllowsRoute(session.role, routeId)) {
			throw redirect(303, '/landing?unauthorized=1');
		}
	}

	const response = await resolve(event);
	if (event.url.pathname.startsWith('/api')) {
		response.headers.append('Access-Control-Allow-Origin', `*`);
	}
	return response;
};

await initializeCache();
