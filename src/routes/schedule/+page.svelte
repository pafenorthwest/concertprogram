<svelte:head>
    <title>Schedule</title>
</svelte:head>

<h2>Select Your Preferred Performance Times</h2>
<div class="schedule-form">
    <h3>Ranked Choice Form</h3>
    <p>Please rank the following options (1 = most preferred, 4 = least preferred).</p>

    <!-- Option 1 -->
    <div class="option">
      <label for="rank-sat2">Sat May 3rd 4pm:</label>
      <select name="rank-sat2" id="rank-sat2">
        <option value="" selected disabled>Rank</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
      </select>
      <label class="non-viable">
        <input type="checkbox" name="nonviable-sat4" value="not-viable">
        Mark as Not Available to Attend
      </label>
    </div>

    <!-- Option 2 -->
    <div class="option">
      <label for="rank-sat5">Sat May 3rd 7pm:</label>
      <select name="rank-sat5" id="rank-sat5">
        <option value="" selected disabled>Rank</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
      </select>
      <label class="non-viable">
        <input type="checkbox" name="nonviable-sat7" value="not-viable">
        Mark as Not Available to Attend
      </label>
    </div>

    <!-- Option 3 -->
    <div class="option">
      <label for="rank-sun2">Sun May 4th 2pm:</label>
      <select name="rank-sun2" id="rank-sun2">
        <option value="" selected disabled>Rank</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
      </select>
      <label class="non-viable">
        <input type="checkbox" name="nonviable-sun2" value="not-viable">
        Mark as Not Available to Attend
      </label>
    </div>

    <!-- Option 4 -->
    <div class="option">
      <label for="rank-sun5">Sun May 4th 5pm:</label>
      <select name="rank-sun5" id="rank-sun5">
        <option value="" selected disabled>Rank</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
      </select>
      <label class="non-viable">
        <input type="checkbox" name="nonviable-sun5" value="not-viable">
        Mark as Not Available to Attend
      </label>
    </div>

    <button type="submit">Submit</button>
  </form>
</div>