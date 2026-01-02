import type { PageServerLoad } from './$types';
import { auth_code } from '$env/static/private';
import { CodeGenerator } from '$lib/server/codeGenerator';
import { verifyLoginCode } from '$lib/server/login';

export const load: PageServerLoad = async ({ params, cookies, url }) => {
	if (!params.code) {
		return { codeOk: false, status: 400, error: 'No verification code provided' };
	}

	const code = parseInt(params.code, 10);
	if (Number.isNaN(code)) {
		return { codeOk: false, status: 400, error: 'Invalid verification code.' };
	}

	try {
		const user = await verifyLoginCode(code);
		if (!user) {
			return { codeOk: false, status: 400, error: 'Your code was not found. Please try again.' };
		}

		cookies.set('pafe_auth', auth_code, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: url.protocol === 'https:' || process.env.NODE_ENV === 'production',
			maxAge: 60 * 60 * 24 * 30
		});

		return { codeOk: true, status: 200, token: CodeGenerator.getToken(), error: null, email: user.email };
	} catch (err) {
		console.error('Error verifying login code', err);
		return { codeOk: false, status: 500, error: 'Unable to verify your code right now.' };
	}
};
