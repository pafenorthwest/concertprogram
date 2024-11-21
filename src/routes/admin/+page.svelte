<script lang="ts">
    import {enhance} from '$app/forms';

    let disableStatus = false;
    export let data;
    export let formErrors;
    let showHelp = false;

    // Boolean variable to track which form to display
    let showSingleEntryForm = false;

    // Toggle function to switch between forms
    function toggleForm() {
        showSingleEntryForm = !showSingleEntryForm;
    }
    function toggleHelp(event) {
        event.preventDefault()
        showHelp = !showHelp;
    }
    // connect return from form data
    function handleFormResponse({ result }: { result: any }) {
        formErrors = result;
    }
</script>

<svelte:head>
    <title>Admin</title>
</svelte:head>

<h2>Admin</h2>
{#if ! data.isAuthenticated}
    <h3 class="noauth">Not Authorized</h3>
{:else}
    <h3>Enter Data</h3>
    <!-- Toggle Button -->
    <button class="action" on:click={toggleForm}>
        {showSingleEntryForm ? "Switch to Single Entry Form" : "Switch to Bulk Entry Form"}
    </button>
    <!-- Form with Multiple Fields -->
    {#if !showSingleEntryForm}
        <form id="full" class="inline-add" method="POST" action="?/add" use:enhance>
            <div class="form-group">
                <label for="class">Class:</label>
                <input type="text" id="class" name="class" maxlength="10" required>
                <label for="performer-name">Performer Name:</label>
                <input type="text" id="performer-name" name="performer-name" maxlength="40" required>
                <label for="performer-email">Performer Email:</label>
                <input type="text" id="performer-email" name="performer-email" maxlength="25" required>
                <label for="performer-phone">Performer Phone <i>(optional)</i>:</label>
                <input type="text" id="performer-phone" name="performer-phone" maxlength="14">
                <label for="accompanist">Accompanist <i>(optional)</i>:</label>
                <input type="text" id="accompanist" name="accompanist" maxlength="40" required>
                <label for="instrument">Instrument:</label>
                <select class="action" name="instrument" id="instrument">
                    <option value="Cello">Cello</option>
                    <option value="Flute">Flute</option>
                    <option value="Piano">Piano</option>
                    <option value="Violin">Violin</option>
                    <option value="Viola">Viola</option>
                    <option value="Clarinet">Clarinet</option>
                    <option value="Oboe">Oboe</option>
                    <option value="Bassoon">Bassoon</option>
                    <option value="Ensemble">Ensemble</option>
                </select>
                <label for="musical-piece-1">Musical Piece 1:</label>
                <input type="text" id="musical-piece-1" name="musical-piece-1" maxlength="120">
                <label for="musical-piece-1">Musical Piece 2 <i>(optional)</i>:</label>
                <input type="text" id="musical-piece-2" name="musical-piece-2" maxlength="120">
                <label for="concert-series">Choose a concert series:</label>
                <select class="action" name="concert-series" id="concert-series">
                    <option value="EastSide">EastSide</option>
                    <option value="Concerto">Concerto</option>
                </select>
            </div>
            <div class="form-group">
                <button type="submit" disabled="{disableStatus}">Submit</button>
            </div>
        </form>
    {:else}
        <!-- Help for bulk entry -->
        <!-- Thin bar for toggling the help section as an <a> element -->
        <a
                href="help"
                class="help-bar"
                on:click={toggleHelp}
                role="button"
                aria-expanded={showHelp}
                aria-controls="help-section"
        >
            {showHelp ? 'hide help' : 'show help'}
        </a>
        <div class="help-section {showHelp ? 'expanded' : 'collapsed'}">
            <h3>Help Section</h3>
            <p>Bulk form expects the first line matches header 'class,class_name,performer,email,phone,accompanist,instrument,piece_1,piece_2'</p><br/>
            <p>Second line is comma separated values </p><br/>
            <p>phone, accompanist, piece_2 are optional</p><br/>
            <p>Musical piece example "J.C.Bach Concerto in C minor 3rd movement by Johann Christian Bach"</p><br/>
        </div>
        <!-- Bulk Entry with Textarea Field -->
        <form id="full" class="inline-add" method="POST" action="?/add" use:enhance>
            <div class="form-group">
                <label for="concert-series">Choose a concert series:</label>
                <select class="action" name="concert-series" id="concert-series">
                    <option value="EastSide">EastSide</option>
                    <option value="Concerto">Concerto</option>
                </select>
                <label for="bigtext">Concert Participants:</label>
                <textarea id="bigtext" name="bigtext" rows="40" cols="120" placeholder="Paste in participants..." required></textarea>
            </div>
            <div class="form-group">
                <button type="submit" disabled="{disableStatus}">Submit</button>
            </div>
        </form>
        {#if formErrors?.failedEntries.length > 0}
            <div class="help-bar">Has Form Errors </div>
            <table class="table">
                <thead>
                    <tr>
                        <th>Message</th><th>Record</th>
                    </tr>
                </thead>
                <tbody>
            {#each formErrors.failedEntries as failures}
                <tr>
                    <td>{failures.reason}</td>
                    <td>{failures.imported.performer}</td>
                </tr>
            {/each}
                </tbody>
            </table>
        {/if}
    {/if}
{/if}