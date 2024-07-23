<svelte:head>
    <title>Lookup</title>
</svelte:head>

<h2>PAFE Concert Registration</h2>
<div class="lookup-form">
    <h3>Lookup By Code</h3>
    <form id="codelookup">
        <div class="form-group">
            <label for="code">Enter 4-Char Code:</label>
            <input type="text" id="code" name="code" maxlength="4" required pattern="[A-Za-z0-9]{4}">
        </div>
        <div class="form-group">
            <button type="submit" disabled>Lookup</button>
        </div>
    </form>
    <h3>Lookup By Name</h3>
    <form id="namelookup">
        <div class="form-group">
            <label for="code">Performer's Last Name:</label>
            <input type="text" id="code" name="performername" maxlength="30">
            <label for="code">Teacher's Last Name:</label>
            <input type="text" id="code" name="teachername" maxlength="30">
            <label for="code">Composer's Last Name:</label>
            <input type="text" id="code" name="composername" maxlength="30">
        </div>
        <div class="form-group">
            <button type="submit" disabled>Lookup</button>
        </div>
    </form>
</div>