/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
	const user = locals.user ?? null;
	return { isAuthenticated: !!user, user };
}
