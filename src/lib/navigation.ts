import { normalizeRouteId, roleAllowsRoute } from '$lib/authz';
import type { AuthRole } from '$lib/server/session';

export type NavItem = {
	href: string;
	label: string;
	icon: string;
	requiresAuth?: boolean;
	routeId?: string;
};

export const NAV_ITEMS: NavItem[] = [
	{ href: '/', label: 'Home', icon: 'home' },
	{ href: '/about', label: 'About', icon: 'info' },
	{ href: '/admin', label: 'Admin', icon: 'shield_person', requiresAuth: true },
	{ href: '/admin/list', label: 'Performances', icon: 'queue_music', requiresAuth: true },
	{
		href: '/admin/musicalpiece',
		label: 'Musical Pieces',
		icon: 'library_music',
		requiresAuth: true
	},
	{ href: '/admin/performer', label: 'Performer', icon: 'artist', requiresAuth: true },
	{ href: '/admin/composer', label: 'Contributors', icon: 'face', requiresAuth: true },
	{ href: '/admin/accompanist', label: 'Accompanist', icon: 'guardian', requiresAuth: true },
	{
		href: '/admin/lottery',
		label: 'Lottery Results',
		icon: 'confirmation_number',
		requiresAuth: true
	},
	{ href: '/admin/program', label: 'Concert Program', icon: 'menu_book', requiresAuth: true },
	{ href: '/admin/class', label: 'Classes', icon: 'photo_auto_merge', requiresAuth: true },
	{ href: '/admin/users', label: 'Authorized Users', icon: 'group', requiresAuth: true }
];

export function filterNavItemsForRole(role?: AuthRole | null): NavItem[] {
	const items = NAV_ITEMS.map((item) => ({ ...item }));
	const homeIndex = items.findIndex((item) => item.href === '/' && !item.requiresAuth);
	if (homeIndex !== -1 && role) {
		items[homeIndex] = { ...items[homeIndex], href: '/landing' };
	}

	if (!role) {
		return items.filter((item) => !item.requiresAuth);
	}

	return items.filter((item) => {
		if (!item.requiresAuth) {
			return true;
		}
		const routeId = normalizeRouteId(item.routeId ?? item.href);
		return routeId ? roleAllowsRoute(role, routeId) : false;
	});
}
