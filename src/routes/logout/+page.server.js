import { fail, redirect } from '@sveltejs/kit';

export async function load({ cookies }) {
    const pafeAuth = cookies.get('pafe_auth')
    if (!pafeAuth) {
        redirect(307, '/');
    }
}

/** @type {import('./$types').Actions} */
export const actions = {
    logout: async ({ cookies, locals }) => {
        cookies.delete('pafe_auth', { path: '/' });
        locals.isAuthenticated = false;
    }
};