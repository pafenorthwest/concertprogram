import { filterNavItemsForRole } from '$lib/navigation';
import { redirect } from '@sveltejs/kit';

export const load = ({ locals, url }) => {
	const user = locals.user ?? null;
	if (!user) {
		throw redirect(303, '/login');
	}

	const showUnauthorized = url.searchParams.get('unauthorized') === '1';
	const navItems = filterNavItemsForRole(user.role);

	return {
		user,
		navItems,
		showUnauthorized
	};
};
