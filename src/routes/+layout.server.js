/** @type {import('./$types').PageServerLoad} */
export async function load({ cookies }) {
    const pafeAuth = cookies.get('pafe_auth')
    if (pafeAuth) {
        return {isAuthenticated : true};
    }
    return {isAuthenticated : false};
}