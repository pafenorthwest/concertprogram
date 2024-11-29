<script>
  import { goto } from '$app/navigation';

  let lookupCode = ''
  let performerName = ''
  let grade = '2'
  let composerName = ''

  async function handleSubmitLookupByCode(event) {
      event.preventDefault();

      // Code param limited to 4 chars
      lookupCode = lookupCode.slice(0, 4)
      goto(`/schedule?code=${lookupCode}`);
  }
  async function handleSubmitLookupByDetails(event) {
      event.preventDefault();

      // Navigate to the /schedule page with the parameters
      // params binding in form definition, cap size
      performerName = performerName.slice(0,30)
      composerName = composerName.slice(0,30)
      goto(`/schedule?performerLastName=${performerName}&grade=${grade}&composerName=${composerName}`);
  }
</script>

<svelte:head>
    <title>Lookup</title>
</svelte:head>

<h2>PAFE Concert Registration</h2>
<div class="lookup-form">
    <h3>Lookup By Code</h3>
    <form id="codeLookup" on:submit={handleSubmitLookupByCode}>
        <div class="form-group">
            <label for="code">Enter 4-Char Code:</label>
            <input type="text" id="code" bind:value={lookupCode} name="code" maxlength="4" required pattern="[A-Za-z0-9]+">
        </div>
        <div class="form-group">
            <button type="submit">Lookup</button>
        </div>
    </form>
    <h3>Lookup By Name</h3>
    <form id="nameLookup" on:submit={handleSubmitLookupByDetails}>
        <div class="form-group">
            <label for="lastName">Performer's Last Name:</label>
            <input type="text" bind:value={performerName} id="performerName" name="performerName" maxlength="30">

            <label for="grade">Performers Grade:</label>
            <select bind:value={grade} id="grade" name="grade">
                <option value="P-2">Preschool to 2nd</option>
                <option value="P-4">Preschool to 4th</option>
                <option value="P-6">Preschool to 6th</option>
                <option value="P-8">Preschool to 8th</option>
                <option value="3-4" selected>3rd - 4th</option>
                <option value="3-5">3rd - 5th</option>
                <option value="3-8">3rd - 8th</option>
                <option value="5-6">5th - 6th</option>
                <option value="5-8">5th - 8th</option>
                <option value="6-8">6th - 8th</option>
                <option value="7-8">7th - 8th</option>
                <option value="9-10">9th - 10th</option>
                <option value="9-12">9th - 12th</option>
                <option value="11-12">11th - 12th</option>
            </select>
            <label for="composer">Composer:</label>
            <input type="text" bind:value={composerName} id="composerName" name="composerName" maxlength="30">
        </div>
        <div class="form-group">
            <button type="submit">Lookup</button>
        </div>
    </form>
</div>