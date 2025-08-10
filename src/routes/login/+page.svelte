<script>
	import { enhance } from '$app/forms';
</script>

<svelte:head>
	<title>Sign in</title>
</svelte:head>

<div class="login-container popover">
	<form use:enhance method="POST" action="?/login">
		<label for="username">Username</label>
		<input name="user" type="text" required placeholder="User" />
		<label for="password">Password</label>
		<input name="password" type="password" required placeholder="Password" />
		<button type="submit">Sign in</button>
	</form>
</div>
