import {redirect} from "@sveltejs/kit";

export async function load({ cookies }) {
    const pafeAuth = cookies.get('pafe_auth')
    const isAuthenticated =  !!pafeAuth;

    return {isAuthenticated: isAuthenticated}
}