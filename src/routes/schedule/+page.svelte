<svelte:head>
    <title>Concert Scheduling</title>
</svelte:head>

<h2>Concert Scheduling</h2>
<div class="schedule-form">
    <h3>Rank Performance Times</h3>
    <form id="ranked-choice-form" class="inline-add" method="POST" action="?/add" use:enhance>
    <p>Please rank the following options (1 = most preferred, 4 = least preferred).</p>

    <!-- Option 1 -->
    <div class="option">
      <label for="rank-sat-first">Sat May 3rd 4pm:</label>
      <select name="rank-sat-first" id="rank-sat-first">
        <option value="" selected disabled>Rank</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
      </select>
      <label class="non-viable">
        <input type="checkbox" name="nonviable-sat-first" value="not-viable">
        Mark as Not Available to Attend
      </label>
    </div>

    <!-- Option 2 -->
    <div class="option">
      <label for="rank-sat-second">Sat May 3rd 7pm:</label>
      <select name="rank-sat-second" id="rank-sat-second">
        <option value="" selected disabled>Rank</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
      </select>
      <label class="non-viable">
        <input type="checkbox" name="nonviable-sat-second" value="not-viable">
        Mark as Not Available to Attend
      </label>
    </div>

    <!-- Option 3 -->
    <div class="option">
      <label for="rank-sun-third">Sun May 4th 2pm:</label>
      <select name="rank-sun-third" id="rank-sun-third">
        <option value="" selected disabled>Rank</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
      </select>
      <label class="non-viable">
        <input type="checkbox" name="nonviable-sun-third" value="not-viable">
        Mark as Not Available to Attend
      </label>
    </div>

    <!-- Option 4 -->
    <div class="option">
      <label for="rank-sun-fourth">Sun May 4th 5pm:</label>
      <select name="rank-sun-fourth" id="rank-sun-fourth">
        <option value="" selected disabled>Rank</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
      </select>
      <label class="non-viable">
        <input type="checkbox" name="nonviable-sun-fourth" value="not-viable">
        Mark as Not Available to Attend
      </label>
    </div>

    <button type="submit">Submit</button>
  </form>
</div>