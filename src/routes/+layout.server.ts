/** @type {import('./$types').PageServerLoad} */
export async function load({ cookies }) {
	const pafeAuth = cookies.get('pafe_auth');
	return { isAuthenticated: !!pafeAuth };
}
