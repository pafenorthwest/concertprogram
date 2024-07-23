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
        <h2>{$page.error?.message || 'Something Went Wrong'}</h2>
    {/if}
</div>