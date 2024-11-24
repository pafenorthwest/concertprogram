<script>
  import { goto } from '$app/navigation';

  let lookupCode = ''
  let performerName = ''
  let grade = ''
  let composerName = ''

  async function handleCodeSubmit(event) {
      event.preventDefault();

      // Perform the lookup by sending the lookupCode to the server
      const response = await fetch('/api/searchPerformer', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ "code": lookupCode })
      });

      if (response.ok) {
        const data = await response.json();
        const { performer_id, concert_series } = data;

        // Navigate to the /schedule page with the parameters
        goto(`/schedule?performer_id=${performer_id}&concert_series=${concert_series}`);
      } else {
        console.error('Lookup failed');
        // Handle errors (e.g., display an error message)
      }
  }
  async function handleLookupSubmit(event) {
      event.preventDefault();
      // Perform the lookup by sending the lookupCode to the server
      const response = await fetch('/api/searchPerformer', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ "performerName": performerName, "grade": grade, "composerName": composerName })
      });

      if (response.ok) {
        const data = await response.json();
        const { performer_id, concert_series } = data;

        // Navigate to the /schedule page with the parameters
        goto(`/schedule?performer_id=${performer_id}&concert_series=${concert_series}`);
      } else {
        console.error('Lookup failed');
        // Handle errors (e.g., display an error message)
      }
  }
</script>

<svelte:head>
    <title>Lookup</title>
</svelte:head>

<h2>PAFE Concert Registration</h2>
<div class="lookup-form">
    <h3>Lookup By Code</h3>
    <form id="codeLookup" on:submit={handleCodeSubmit}>
        <div class="form-group">
            <label for="code">Enter 4-Char Code:</label>
            <input type="text" id="code" bind:value={lookupCode} name="code" maxlength="4" required pattern="[A-Za-z0-9]{4}">
        </div>
        <div class="form-group">
            <button type="submit" disabled>Lookup</button>
        </div>
    </form>
    <h3>Lookup By Name</h3>
    <form id="nameLookup">
        <div class="form-group" on:submit={handleLookupSubmit}>
            <label for="lastName">Performer's Last Name:</label>
            <input type="text" bind:value={performerName} id="performerName" name="performerName" maxlength="30">
            <label for="grade">Performers Grade:</label>
            <input type="text" bind:value={grade} id="grade" name="grade" maxlength="30">
            <label for="composer">Composer:</label>
            <input type="text" bind:value={composerName} id="composerName" name="composerName" maxlength="30">
        </div>
        <div class="form-group">
            <button type="submit" disabled>Lookup</button>
        </div>
    </form>
</div>