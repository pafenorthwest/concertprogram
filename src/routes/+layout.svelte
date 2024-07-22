<script>
    export let data;
</script>

{#if !data.isAuthenticated}
    <div class="topbar"><a href="/login" class="link">
        <p>Admin Login</p>
        <span class="material-symbols-outlined">account_circle</span></a>
    </div>
{:else}
    <div class="topbar"><a href="/logout" class="link">
        <p>Admin Logout</p>
        <span class="material-symbols-outlined">account_circle</span></a>
    </div>
{/if}

<slot></slot>