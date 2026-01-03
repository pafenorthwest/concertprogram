/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
	const session = locals.session ?? null;
	return { isAuthenticated: !!session, session };
}
