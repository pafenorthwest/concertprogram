<script>
    export let data;
</script>
<h2>Performances</h2>
{#if data.isAuthenticated}
    <h3>Listings</h3>
    <table class="table">
        <thead>
        <tr>
            {#each data.performance_fields as field}
                <th>{field}</th>
            {/each}
        </tr>
        </thead>
        <tbody>
        {#each data.performances as performance}
            <tr>
                <td>{performance.id}</td>
                <td>{performance.musical_piece}</td>
                <td>{performance.movement}</td>
                <td>{performance.composer}</td>
                <td>{performance.composer_years_active}</td>
                <td>{performance.composer2}</td>
                <td>{performance.composer2_years_active}</td>
                <td>{performance.composer3}</td>
                <td>{performance.composer3_years_active}</td>
                <td>{performance.accompanist}</td>
                <td>{performance.duration}</td>
                <td>{performance.comment}</td>
                <td>{performance.instrument}</td>
                <td>{performance.performance_order}</td>
                <td>{performance.concert_series}</td>
                <td>{performance.pafe_series}</td>
            </tr>
        {/each}
        </tbody>
    </table>
{:else}
    <h3 class="noauth">Not Authorized</h3>
{/if}