<script>
	import { page } from '$app/stores';
</script>

<svelte:head>
	<title>{$page.status}</title>
</svelte:head>

<div>
	{#if $page.status === 404}
		<h2>Not found!</h2>
	{:else}
		<h2>Internal Error</h2>
		<h3 class="error-message">{$page.error?.message || 'Something Went Wrong'}</h3>
	{/if}
</div>
