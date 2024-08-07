<script>
    export let data;
</script>

<svelte:head>
    <title>Admin</title>
</svelte:head>

<h2>Admin</h2>
{#if ! data.isAuthenticated}
    <h3 class="noauth">Not Authorized</h3>
{/if}