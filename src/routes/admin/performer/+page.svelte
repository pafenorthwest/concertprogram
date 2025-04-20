<script>
    import {enhance} from '$app/forms';
    import { convertToEpochAge } from '$lib/clientUtils';

    let disableStatus = false;
    export let data;
    let editable = false;
    let editing = {};

    async function handleSave(performer) {
        try {
            const response = await fetch(`/api/performer/${performer.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(performer)
            });
            if (!response.ok) {
                throw new Error('Failed to save performer');
            }
            const index = data.performers.findIndex(c => c.id === performer.id);
            data.performers[index] = {...performer};
            editing = {};
        } catch (error) {
            console.error('Error saving performer:', error);
        }
    }

    function handleEdit(performer) {
        performer.age = convertToEpochAge(performer.epoch)
        editing = {...performer};
    }

    function handleInputChange(event, field) {
        if (field === 'age') {
            editing['epoch'] = convertToEpochAge(event.target.value)
        }
        editing[field] = event.target.value;
    }
</script>

<h2>Performers</h2>
{#if data.isAuthenticated}
    <div class="lookup-form">
        <h3>Add</h3>
        <form id="performer" class="inline-add" method="POST" action="?/add" use:enhance>
            <div class="form-group">
                <label for="fullName">Printed Name:</label>
                <input type="text" id="fullName" name="fullName" maxlength="256" required>
                <label for="age">Age:</label>
                <input type="number" id="age" name="age" maxlength="256" step="1" required>
                <label for="instrument">Instrument:</label>
                <input type="text" id="instrument" name="instrument" maxlength="256" required>
                <label for="email">Email:</label>
                <input type="text" id="email" name="email" maxlength="256" required>
                <label for="phone">Phone:</label>
                <input type="text" id="phone" name="phone" maxlength="18">
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
            {#each data.performer_fields as field}
                <th>{field}</th>
            {/each}
            <th>Edit</th>
            <th>Delete</th>
        </tr>
        </thead>
        <tbody>
        {#each data.performers as performer}
            <tr>
                <td>{performer.id}</td>
                <td>
                    {#if editing.id === performer.id}
                        <input type="text" value={editing.full_name}
                               on:input={(event) => handleInputChange(event, 'full_name')}/>
                    {:else}
                        {performer.full_name}
                    {/if}
                </td>
                <td>
                    {#if editing.id === performer.id}
                        <input type="text" value={editing.email}
                               on:input={(event) => handleInputChange(event, 'email')}/>
                    {:else}
                        {performer.email}
                    {/if}
                </td>
                <td>
                    {#if editing.id === performer.id}
                        <input type="text" value={editing.phone}
                               on:input={(event) => handleInputChange(event, 'phone')}/>
                    {:else}
                        {performer.phone}
                    {/if}
                </td>
                <td>
                    {#if editing.id === performer.id}
                        <input type="text" value={convertToEpochAge(editing.epoch)}
                               on:input={(event) => handleInputChange(event, 'age')}/>
                    {:else}
                        {convertToEpochAge(performer.epoch)}
                    {/if}
                </td>
                <td>
                    {#if editing.id === performer.id}
                        <input type="text" value={editing.instrument}
                               on:input={(event) => handleInputChange(event, 'instrument')}/>
                    {:else}
                        {performer.instrument}
                    {/if}
                </td>
                <td>
                    {#if editing.id === performer.id}
                        <button on:click={() => handleSave(editing)}>
                            <span class="material-symbols-outlined">save</span>
                        </button>
                        <button on:click={() => editing = {}}>
                            <span class="material-symbols-outlined">cancel</span>
                        </button>
                    {:else}
                        <button on:click={() => handleEdit(performer)}>
                            <span class="material-symbols-outlined">edit</span>
                        </button>
                    {/if}
                </td>
                <td class="slim-button">
                    <form method="POST" action="?/delete" use:enhance>
                        <input type="hidden" name="performerId" value={performer.id}>
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