import { redirect } from '@sveltejs/kit';
import { SESSION_COOKIE_NAME } from '$lib/server/session';

export async function load({ cookies }) {
	const pafeAuth = cookies.get('pafe_auth');
	if (!pafeAuth) {
		redirect(307, '/');
	}
}

/** @type {import('./$types').Actions} */
export const actions = {
	logout: async ({ cookies, locals }) => {
		cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
		locals.session = null;
	}
};
