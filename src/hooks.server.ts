import { initializeCache } from '$lib/cache';
import type { Handle } from '@sveltejs/kit';
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
	event.locals.session = decodeSession(sessionCookie);

	const response = await resolve(event);
	if (event.url.pathname.startsWith('/api')) {
		response.headers.append('Access-Control-Allow-Origin', `*`);
	}
	return response;
};

await initializeCache();
