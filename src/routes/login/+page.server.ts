import { fail, redirect } from '@sveltejs/kit';
import {
	issueLoginCode,
	sendVerificationEmail,
	RateLimitError,
	UnauthorizedEmailError
} from '$lib/server/login';

export async function load({ cookies }) {
	const pafeAuth = cookies.get('pafe_auth');
	if (pafeAuth) {
		throw redirect(307, '/admin');
	}
}

/** @type {import('./$types').Actions} */
export const actions = {
	login: async ({ request, cookies, url }) => {
		const pafeAuth = cookies.get('pafe_auth');
		if (pafeAuth) {
			throw redirect(307, '/admin');
		}

		const data = await request.formData();
		const email = (data.get('email') as string | null)?.trim() ?? '';

		if (!email || !email.includes('@')) {
			return fail(400, { success: false, error: 'Please enter a valid email address.' });
		}

		try {
			const { code, email: normalizedEmail } = await issueLoginCode(email);
			await sendVerificationEmail(normalizedEmail, code, url.origin);
			return { success: true, message: 'Check your email for the verification link.' };
		} catch (err) {
			if (err instanceof UnauthorizedEmailError) {
				return fail(401, {
					success: false,
					error: 'This email is not authorized to access the system.'
				});
			}

			if (err instanceof RateLimitError) {
				return fail(429, {
					success: false,
					error: 'Too many login attempts. Please wait a moment and try again.'
				});
			}

			console.error('Error sending verification email', err);
			return fail(500, {
				success: false,
				error: 'Unable to send the verification email right now. Please try again.'
			});
		}
	}
};
