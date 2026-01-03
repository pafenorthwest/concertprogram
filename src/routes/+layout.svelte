<script lang="ts">
	import { normalizeRouteId, roleAllowsRoute } from '$lib/authz';

	type NavItem = {
		href: string;
		label: string;
		icon: string;
		requiresAuth?: boolean;
		routeId?: string;
	};

	export let data;

	const navItems: NavItem[] = [
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
		{ href: '/admin/class', label: 'Classes', icon: 'photo_auto_merge', requiresAuth: true }
	];

	function canDisplay(item: NavItem): boolean {
		if (!item.requiresAuth) {
			return true;
		}
		const userRole = data.user?.role;
		if (!userRole) {
			return false;
		}
		const routeId = normalizeRouteId(item.routeId ?? item.href);
		return routeId ? roleAllowsRoute(userRole, routeId) : false;
	}
</script>

{#if !data.isAuthenticated}
	<div class="topbar">
		<a href="/login" class="link">
			<p>Admin Login</p>
			<span class="material-symbols-outlined">account_circle</span></a
		>
	</div>
{:else}
	<div class="topbar">
		<a href="/logout" class="link">
			<p>Admin Logout</p>
			<span class="material-symbols-outlined">account_circle</span></a
		>
	</div>
{/if}

<slot></slot>

<div class="navbar">
	<div class="row">
		{#each navItems as item (item.href)}
			{#if canDisplay(item)}
				<div class="navbutton">
					<a href={item.href}>
						<p class="navicon"><span class="material-symbols-outlined">{item.icon}</span></p>
						<br />
						<p class="subtext">{item.label}</p>
					</a>
				</div>
			{/if}
		{/each}
	</div>
</div>
