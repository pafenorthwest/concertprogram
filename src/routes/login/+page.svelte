<script lang="ts">
	import { enhance } from '$app/forms';

	let statusMessage = '';
	let submissionSucceeded = false;

	const enhanceLogin =
		() =>
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		async ({ result }: { result: any }) => {
			statusMessage = '';

			if (result?.type === 'success') {
				submissionSucceeded = true;
				statusMessage = result.data?.message ?? 'Check your email for the verification link.';
			} else if (result?.type === 'failure') {
				submissionSucceeded = false;
				const errorMessage = typeof result.data?.error === 'string' ? result.data.error : undefined;
				statusMessage = errorMessage ?? 'Unable to send the verification email. Please try again.';
			}
		};
</script>

<svelte:head>
	<title>Email Login</title>
</svelte:head>

<div class="login-container popover">
	<h3>Email Login</h3>
	<p class="lowemphasis">Enter your email to receive a one-time login link.</p>
	<form method="POST" action="?/login" use:enhance={enhanceLogin}>
		<label for="email">Email Address</label>
		<input name="email" id="email" type="email" required placeholder="you@example.com" />

		{#if statusMessage}
			<p class={`login-status ${submissionSucceeded ? 'success' : 'error'}`}>{statusMessage}</p>
		{/if}

		<button type="submit">Send Login Link</button>
	</form>
</div>

<style>
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
