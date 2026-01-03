<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';

	export let data;

	let isVerified = data.codeOk && data.status === 200;
	let message = data.error;

	onMount(() => {
		if (isVerified) {
			if (typeof window !== 'undefined' && data.token) {
				localStorage.setItem('token', data.token);
			}
			setTimeout(() => {
				window.location.href = '/landing';
			}, 2500);
		}
	});
</script>

<div class="login-container popover verify-popover">
	<h3>Email Verification</h3>
	{#if isVerified}
		<p class="login-status success">
			Verification successful! Redirecting to the main page...
			<a href={resolve('/')} class="link">Back to Home</a>
		</p>
	{:else}
		<p class="login-status error">
			{message}
			<a href={resolve('/')} class="link">Back to Home</a>
		</p>
	{/if}
</div>

<style>
	.verify-popover {
		margin-top: var(--margin);
	}
	.login-status {
		display: block;
		margin-top: var(--gutter);
	}
	.login-status.success {
		color: var(--allok-color);
	}
	.login-status.error {
		color: var(--error-color);
	}
</style>
