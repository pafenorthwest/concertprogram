import { fail, redirect } from '@sveltejs/kit';

export async function load({ cookies }) {
    const pafeAuth = cookies.get('pafe_auth')
    if (pafeAuth) {
        redirect(307, '/admin');
    }
}

/** @type {import('./$types').Actions} */
export const actions = {
    login: async ({ cookies, request }) => {
        const data = await request.formData();

        if (data.get('user') === 'eric' && data.get('password') === 'password') {
            cookies.set('pafe_auth', 'admin_key', { path: '/' });
            redirect(307, '/admin');
        } else {
            return fail(401, 'bad login attempt');
        }
    },
    logout: async ({ cookies, locals }) => {
        cookies.delete('pafe_auth', { path: '/' });
        locals.isAuthenticated = false;
    }
};