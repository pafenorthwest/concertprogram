<script>
    import {enhance} from '$app/forms';

    let disableStatus = false;
    export let data;
    let editable = false;
    let editing = {};

    async function handleSave(composer) {
        try {
            const response = await fetch(`/api/composer/${composer.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(composer)
            });
            if (!response.ok) {
                throw new Error('Failed to save composer');
            }
            const index = data.composers.findIndex(c => c.id === composer.id);
            data.composers[index] = {...composer};
            editing = {};
        } catch (error) {
            console.error('Error saving composer:', error);
        }
    }

    function handleEdit(composer) {
        editing = {...composer};
    }

    function handleInputChange(event, field) {
        editing[field] = event.target.value;
    }

</script>

<h2>Composers</h2>
{#if data.isAuthenticated}
    <div class="lookup-form">
        <h3>Add</h3>
        <form id="composer" class="inline-add" method="POST" action="?/add" use:enhance>
            <div class="form-group">
                <label for="printedName">Printed Name:</label>
                <input type="text" id="printedName" name="printedName" maxlength="256" required>
                <label for="fullName">Full Name:</label>
                <input type="text" id="fullName" name="fullName" maxlength="256" required>
                <label for="yearsActive">Years Active:</label>
                <input type="text" id="yearsActive" name="yearsActive" maxlength="25" required>
                <label for="notes">Notes:</label>
                <input type="text" id="notes" name="notes" maxlength="25">
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
            {#each data.composer_fields as field}
                <th>{field}</th>
            {/each}
            <th>Edit</th>
            <th>Delete</th>
        </tr>
        </thead>
        <tbody>
        {#each data.composers as composer}
            <tr>
                <td>{composer.id}</td>
                <td>
                    {#if editing.id === composer.id}
                        <input type="text" value={editing.full_name}
                               on:input={(event) => handleInputChange(event, 'full_name')}/>
                    {:else}
                        {composer.full_name}
                    {/if}
                </td>
                <td>
                    {#if editing.id === composer.id}
                        <input type="text" value={editing.years_active}
                               on:input={(event) => handleInputChange(event, 'years_active')}/>
                    {:else}
                        {composer.years_active}
                    {/if}
                </td>
                <td>
                    {#if editing.id === composer.id}
                        <input type="text" value={editing.notes}
                               on:input={(event) => handleInputChange(event, 'notes')}/>
                    {:else}
                        {composer.notes}
                    {/if}
                </td>
                <td>
                    {#if editing.id === composer.id}
                        <button on:click={() => handleSave(editing)}>
                            <span class="material-symbols-outlined">save</span>
                        </button>
                        <button on:click={() => editing = {}}>
                            <span class="material-symbols-outlined">cancel</span>
                        </button>
                    {:else}
                        <button on:click={() => handleEdit(composer)}>
                            <span class="material-symbols-outlined">edit</span>
                        </button>
                    {/if}
                </td>
                <td class="slim-button">
                    <form method="POST" action="?/delete" use:enhance>
                        <input type="hidden" name="composerId" value={composer.id}>
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