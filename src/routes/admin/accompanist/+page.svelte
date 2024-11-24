<script lang=ts>
    import {enhance} from '$app/forms';

    let disableStatus = false;
    export let data;
    let editing = {};

    async function handleSave(accompanist) {
        try {
            const response = await fetch(`/api/accompanist/${accompanist.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(accompanist)
            });
            if (!response.ok) {
                throw new Error('Failed to save accompanist');
            }
            const index = data.accompanist.findIndex(c => c.id === accompanist.id);
            data.accompanist[index] = {...accompanist};
            editing = {};
        } catch (error) {
            console.error('Error saving accompanist:', error);
        }
    }

    function handleEdit(accompanist) {
        editing = {...accompanist};
    }

    function handleInputChange(event, field) {
        editing[field] = event.target.value;
    }

</script>

<h2>Accompanist</h2>
{#if data.isAuthenticated}
    <div class="lookup-form">
        <h3>Add</h3>
        <form id="accompanist" class="inline-add" method="POST" action="?/add" use:enhance>
            <div class="form-group">
                <label for="fullName">Full Name:</label>
                <input type="text" id="fullName" name="fullName" maxlength="256" required>
            </div>
            <div class="form-group">
                <button type="submit" disabled="{disableStatus}">Submit</button>
            </div>
        </form>
    </div>
    <h3>Listing</h3>
    <table class="table">
        <thead>
        <tr>
            {#each data.accompanist_fields as field}
                <th>{field}</th>
            {/each}
            <th>Edit</th>
            <th>Delete</th>
        </tr>
        </thead>
        <tbody>
        {#each data.accompanist as accompanist}
            <tr>
                <td>{accompanist.id}</td>
                <td>
                    {#if editing.id === accompanist.id}
                        <input type="text" value={editing.full_name}
                               on:input={(event) => handleInputChange(event, 'full_name')}/>
                    {:else}
                        {accompanist.full_name}
                    {/if}
                </td>
                <td>
                    {#if editing.id === accompanist.id}
                        <button on:click={() => handleSave(editing)}>
                            <span class="material-symbols-outlined">save</span>
                        </button>
                        <button on:click={() => editing = {}}>
                            <span class="material-symbols-outlined">cancel</span>
                        </button>
                    {:else}
                        <button on:click={() => handleEdit(accompanist)}>
                            <span class="material-symbols-outlined">edit</span>
                        </button>
                    {/if}
                </td>
                <td class="slim-button">
                    <form method="POST" action="?/delete" use:enhance>
                        <input type="hidden" name="accompanistId" value={accompanist.id}>
                        <button type="submit">
                            <span class="material-symbols-outlined">delete</span>
                        </button>
                    </form>
                </td>
            </tr>
        {/each}
        </tbody>
    </table>
{:else}
    <h3 class="noauth">Not Authorized</h3>
{/if}