import type { PageServerLoad } from './$types';
import { CodeGenerator } from '$lib/server/codeGenerator';
import { verifyLoginCode } from '$lib/server/login';
import {
	encodeSession,
	SESSION_COOKIE_MAX_AGE_SECONDS,
	SESSION_COOKIE_NAME
} from '$lib/server/session';

export const load: PageServerLoad = async ({ params, cookies, url }) => {
	if (!params.code) {
		return { codeOk: false, status: 400, error: 'No verification code provided' };
	}

	const email = url.searchParams.get('email');
	if (!email) {
		return { codeOk: false, status: 400, error: 'No email provided for verification.' };
	}

	const code = parseInt(params.code, 10);
	if (Number.isNaN(code)) {
		return { codeOk: false, status: 400, error: 'Invalid verification code.' };
	}

	try {
		const user = await verifyLoginCode(code, email);
		if (!user) {
			return { codeOk: false, status: 400, error: 'Your code was not found. Please try again.' };
		}

		const sessionToken = encodeSession({ email: user.email, role: user.role });

		cookies.set(SESSION_COOKIE_NAME, sessionToken, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: url.protocol === 'https:' || process.env.NODE_ENV === 'production',
			maxAge: SESSION_COOKIE_MAX_AGE_SECONDS
		});

		return {
			codeOk: true,
			status: 200,
			token: CodeGenerator.getToken(),
			error: null,
			email: user.email
		};
	} catch (err) {
		console.error('Error verifying login code', err);
		return { codeOk: false, status: 500, error: 'Unable to verify your code right now.' };
	}
};
