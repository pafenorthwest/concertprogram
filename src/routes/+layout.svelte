<script lang="ts">
	import { filterNavItemsForRole } from '$lib/navigation';
	export let data;

	$: visibleNavItems = filterNavItemsForRole(data.user?.role);
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
		{#each visibleNavItems as item (item.href)}
			<div class="navbutton">
				<a href={item.href}>
					<p class="navicon"><span class="material-symbols-outlined">{item.icon}</span></p>
					<br />
					<p class="subtext">{item.label}</p>
				</a>
			</div>
		{/each}
	</div>
</div>
