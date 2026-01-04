<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';

	onMount(() => {
		if (typeof window !== 'undefined') {
			localStorage.removeItem('token');
		}
	});
</script>

<svelte:head>
	<title>Sign out</title>
</svelte:head>

<div class="login-container popover">
	<h3>Sign out</h3>
	<form use:enhance method="POST" action="?/logout">
		<button type="submit">Sign Out</button>
	</form>
</div>
