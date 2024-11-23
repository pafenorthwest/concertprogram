import {auth_code} from '$env/static/private';

export function isAuthorized(authHeader: string): boolean {
	// Check if the Authorization header is present
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return false
	}

	// Extract the token from the header
	const token = authHeader.slice(7); // Remove "Bearer "

	// Validate the token (you can replace this with your actual token validation logic)
	return token === auth_code;

}