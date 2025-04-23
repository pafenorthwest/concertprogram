<script>
  import { goto } from '$app/navigation';

  let lookupCode = ''
  let performerName = ''
  let age = '6'
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
      goto(`/schedule?performerLastName=${performerName}&age=${age}&composerName=${composerName}`);
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
            <label for="code">Enter Code:</label>
            <input type="text" id="code" bind:value={lookupCode} name="code" maxlength="20">
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

            <label for="age">Performers Age:</label>
            <select bind:value={age} id="age" name="age">
                <option value="6">6</option>
                <option value="7">7</option>
                <option value="8">8</option>
                <option value="9">9</option>
                <option value="10" selected>10</option>
                <option value="11">11</option>
                <option value="12">12</option>
                <option value="13">13</option>
                <option value="14">14</option>
                <option value="15">15</option>
                <option value="16">16</option>
                <option value="17">17</option>
                <option value="18">18</option>
            </select>
            <label for="composer">Composer:</label>
            <input type="text" bind:value={composerName} id="composerName" name="composerName" maxlength="30">
        </div>
        <div class="form-group">
            <button type="submit">Lookup</button>
        </div>
    </form>
</div>