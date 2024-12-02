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
            <div class="navbutton">
                <a href="/admin/musicalpiece">
                    <p class="navicon"><span class="material-symbols-outlined">library_music</span></p>
                    <br/>
                    <p class="subtext">Muiscal Pieces</p>
                </a>
            </div>
            <div class="navbutton">
                <a href="/admin/performer">
                    <p class="navicon"><span class="material-symbols-outlined">artist</span></p>
                    <br/>
                    <p class="subtext">Performer</p>
                </a>
            </div>
            <div class="navbutton">
                <a href="/admin/composer">
                    <p class="navicon"><span class="material-symbols-outlined">face</span></p>
                    <br/>
                    <p class="subtext">Composers</p>
                </a>
            </div>
            <div class="navbutton">
                <a href="/admin/accompanist">
                    <p class="navicon"><span class="material-symbols-outlined">guardian</span></p>
                    <br/>
                    <p class="subtext">Accompanist</p>
                </a>
            </div>
            <div class="navbutton">
                <a href="/admin/lottery">
                    <p class="navicon"><span class="material-symbols-outlined">confirmation_number</span></p>
                    <br/>
                    <p class="subtext">Lottery Results</p>
                </a>
            </div>
            <div class="navbutton">
                <a href="/admin/program">
                    <p class="navicon"><span class="material-symbols-outlined">menu_book</span></p>
                    <br/>
                    <p class="subtext">Concert Program</p>
                </a>
            </div>
        {/if}
    </div>
</div>