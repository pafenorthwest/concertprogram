<script lang="ts">
	export let data;
</script>

<svelte:head>
	<title>Landing</title>
</svelte:head>

<section class="landing">
	{#if data.showUnauthorized}
		<div class="banner warning">
			<p>You do not have access to the requested page. Please use the links below.</p>
		</div>
	{/if}

	<h2>Welcome back</h2>
	<p class="role">
		Signed in as <strong>{data.user.email}</strong> — Role: <strong>{data.user.role}</strong>
	</p>

	<div class="nav-grid">
		{#each data.navItems as item (item.href)}
			<a class="nav-card" href={item.href}>
				<span class="material-symbols-outlined">{item.icon}</span>
				<div>
					<h3>{item.label}</h3>
					<p>{item.href}</p>
				</div>
			</a>
		{/each}
	</div>
</section>

<style>
	.landing {
		padding: var(--gutter);
	}
	.banner {
		padding: 12px 14px;
		border-radius: 6px;
		margin-bottom: var(--gutter);
		font-weight: 600;
	}
	.banner.warning {
		background: #fff5e5;
		color: #8a4b00;
		border: 1px solid #f0c27b;
	}
	.role {
		margin-top: 8px;
		margin-bottom: var(--gutter);
	}
	.nav-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 12px;
	}
	.nav-card {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px;
		border: 1px solid #ececec;
		border-radius: 8px;
		text-decoration: none;
		color: inherit;
		background: #fff;
		transition:
			box-shadow 150ms ease,
			transform 150ms ease;
	}
	.nav-card:hover {
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
		transform: translateY(-1px);
	}
	.nav-card .material-symbols-outlined {
		font-size: 28px;
	}
	.nav-card h3 {
		margin: 0;
		font-size: 1rem;
	}
	.nav-card p {
		margin: 0;
		color: #555;
		font-size: 0.9rem;
	}
</style>
