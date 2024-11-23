<script>
    import {enhance} from '$app/forms';

    let disableStatus = false;
    export let data;
    let editable = false;
    let editing = {};

    async function handleSave(musicalPiece) {
        try {
            const response = await fetch(`/api/musicalpiece/${musicalPiece.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(musicalPiece)
            });
            if (!response.ok) {
                throw new Error('Failed to save Musical Piece');
            }
            const index = data.musicalPieces.findIndex(c => c.id === musicalPiece.id);
            data.musicalPieces[index] = {...musicalPiece};
            editing = {};
        } catch (error) {
            console.error('Error saving Musical Piece:', error);
        }
    }

    function handleEdit(musicalPiece) {
        editing = {...musicalPiece};
    }

    function handleInputChange(event, field) {
        editing[field] = event.target.value;
    }

</script>

<h2>Musical Peices</h2>
{#if data.isAuthenticated}
    <div class="lookup-form">
        <h3>Add</h3>
        <form id="musicalPiece" class="inline-add" method="POST" action="?/add" use:enhance>
            <div class="form-group">
                <label for="printedName">Printed Name:</label>
                <input type="text" id="printedName" name="printedName" maxlength="256" required>
                <label for="firstComposerId">First Composer Id:</label>
                <input type="text" id="firstComposerId" name="firstComposerId" maxlength="5" required>
                <label for="allMovements">All Movements:</label>
                <input type="text" id="allMovements" name="allMovements" maxlength="256">
                <label for="secondComposerId">Second Composer Id:</label>
                <input type="text" id="secondComposerId" name="secondComposerId" maxlength="5">
                <label for="thirdComposerId">Third Composer Id:</label>
                <input type="text" id="thirdComposerId" name="thirdComposerId" maxlength="5">
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
            {#each data.musical_piece_fields as field}
                <th>{field}</th>
            {/each}
            <th>Edit</th>
            <th>Delete</th>
        </tr>
        </thead>
        <tbody>
        {#each data.musicalPieces as musicalPiece}
            <tr>
                <td>{musicalPiece.id}</td>
                <td>
                    {#if editing.id === musicalPiece.id}
                        <input type="text" value={editing.printed_name}
                               on:input={(event) => handleInputChange(event, 'printed_name')}/>
                    {:else}
                        {musicalPiece.printed_name}
                    {/if}
                </td>
                <td>
                    {#if editing.id === musicalPiece.id}
                        <input type="text" value={editing.first_composer_id}
                               on:input={(event) => handleInputChange(event, 'first_composer_id')}/>
                    {:else}
                        {musicalPiece.first_composer_id}
                    {/if}
                </td>
                <td>
                    {#if editing.id === musicalPiece.id}
                        <input type="text" value={editing.all_movements}
                               on:input={(event) => handleInputChange(event, 'all_movements')}/>
                    {:else}
                        {musicalPiece.all_movements}
                    {/if}
                </td>
                <td>
                    {#if editing.id === musicalPiece.id}
                        <input type="text" value={editing.second_composer_id}
                               on:input={(event) => handleInputChange(event, 'second_composer_id')}/>
                    {:else}
                        {musicalPiece.second_composer_id}
                    {/if}
                </td>
                <td>
                    {#if editing.id === musicalPiece.id}
                        <input type="text" value={editing.third_composer_id}
                               on:input={(event) => handleInputChange(event, 'third_composer_id')}/>
                    {:else}
                        {musicalPiece.third_composer_id}
                    {/if}
                </td>
                <td>
                    {#if editing.id === musicalPiece.id}
                        <button on:click={() => handleSave(editing)}>
                            <span class="material-symbols-outlined">save</span>
                        </button>
                        <button on:click={() => editing = {}}>
                            <span class="material-symbols-outlined">cancel</span>
                        </button>
                    {:else}
                        <button on:click={() => handleEdit(musicalPiece)}>
                            <span class="material-symbols-outlined">edit</span>
                        </button>
                    {/if}
                </td>
                <td class="slim-button">
                    <form method="POST" action="?/delete" use:enhance>
                        <input type="hidden" name="musicalPieceId" value={musicalPiece.id}>
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