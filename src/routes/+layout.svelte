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

<div class="navbar">
    <div class="row">
        <div class="navbutton">
            <a href="/">
                <p class="navicon"><span class="material-symbols-outlined">home</span></p>
                <br/>
                <p class="subtext">Home</p>
            </a>
        </div>
        <div class="navbutton">
            <a href="/about">
                <p class="navicon"><span class="material-symbols-outlined">info</span></p>
                <br/>
                <p class="subtext">About</p>
            </a>
        </div>
        {#if data.isAuthenticated}
            <div class="navbutton">
                <a href="/admin/">
                    <p class="navicon"><span class="material-symbols-outlined">shield_person</span></p>
                    <br/>
                    <p class="subtext">Admin</p>
                </a>
            </div>
            <div class="navbutton">
                <a href="/admin/list">
                    <p class="navicon"><span class="material-symbols-outlined">queue_music</span></p>
                    <br/>
                    <p class="subtext">Performances</p>
                </a>
            </div>
        {/if}
    </div>
</div>