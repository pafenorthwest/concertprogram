import { error, redirect } from '@sveltejs/kit';
import {admin, auth_code, password} from '$env/static/private';

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

        if (data.get('user') === admin && data.get('password') === password) {
            // suggest add httpOnly: true  secure: true sameSite: 'strict'
            cookies.set('pafe_auth', auth_code, { path: '/' });
            redirect(307, '/admin');
        } else {
            return error(401, 'bad login attempt');
        }
    }
};