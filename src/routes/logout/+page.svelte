<script>
    import { enhance } from '$app/forms';
</script>

<svelte:head>
    <title>Sign in</title>
</svelte:head>

<div class="login-container popover">
    <form use:enhance method="POST" action="?/logout">
        <button type="submit">Sign Out</button>
    </form>
</div>