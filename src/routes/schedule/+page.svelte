<script>

    let disableStatus = false;
    export let data;

    function hasDuplicatesValuesInForm() {
      // Get the form element
      const form = document.getElementById("ranked-choice-form");

      if (!form) {
        console.error("Form with id 'ranked-choice-form' not found.");
        return false;
      }

      // Get all select elements within the form
      const selectElements = form.querySelectorAll("select");

      // Extract values from the select elements
      const values = Array.from(selectElements)
        .map(select => select.value)
        .filter(value => value.trim() !== ""); // Ignore blank values

      // Check for duplicates
      const uniqueValues = new Set(values);

      // If the number of unique values is less than the total values, duplicates exist
      return uniqueValues.size !== values.length;
    }

     function handleCheckboxChange(event) {
        // Find the checkbox's sibling elements
        const checkbox = event.target;
        const siblingSelect = checkbox.previousElementSibling; // The next sibling (assumes the <select> is directly after the checkbox)
        const siblingP = checkbox.nextElementSibling; // The sibling <p> element after the <select>

        // Disable the <select> element if checkbox is checked
        if (siblingSelect.tagName === 'SELECT') {
            siblingSelect.disabled = checkbox.checked;
        }

        // Change the color of the <p> element if checkbox is checked
            if (siblingP.tagName === 'P') {
                siblingP.style.color = checkbox.checked ? 'black' : ''; // Reset color when uncheck
                siblingP.style.fontWeight =  checkbox.checked ? 'bold' : '';
            }
    }

    function appear_then_fade(element) {
       if (element.classList.contains('hidden')) {
          // Make it visible again
          element.classList.remove('hidden');
          element.style.display = 'inline-block';
          // Appear, then change display after animation
             setTimeout(() => {
                    element.classList.add('hidden');
                    element.style.display = 'none'; // Ensure it doesn't take up space
             }, 5000); // Match the duration of the CSS transition
       }
    }

    function enforceValidSelect(event) {
        const hasDuplicateRankings = hasDuplicatesValuesInForm()
        if (hasDuplicateRankings) {
            const error_icon = document.getElementById('error-icon');
            appear_then_fade(error_icon)
        } else {
            if (disableStatus) {
                const success_icon = document.getElementById('success-icon');
                appear_then_fade(success_icon)
            }
        }
        disableStatus = hasDuplicateRankings
    }
</script>

<svelte:head>
    <title>Concert Scheduling</title>
</svelte:head>

<h2>Concert Scheduling</h2>
<div class="schedule-form">
    <h3>DATA</h3>

        <p>{data.performer_id}</p>
        <p>{data.concert_series}</p>
    <h3>Rank Performance Times</h3>
    <div id="error-icon" class="base-icon hidden"><p>Duplicate Rankings Selected</p></div>
    <div id="success-icon" class="base-icon hidden"><p>✓</p></div>
    <form id="ranked-choice-form" method="POST" action="?/schedule">
        <div class="form-group">
            <p>Please rank the following options (1 = most preferred, 4 = least preferred).</p>
            <br/><br/>

            <!-- Option 1 -->
            <div class="inline-form">
            <label for="rank-sat-first" style="width:150px">Sat May 3rd 4pm:</label>
            <select name="rank-sat-first" id="rank-sat-first" on:change={enforceValidSelect}>
                <option value="" selected disabled>Rank</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
            </select>
            <input type="checkbox" name="nonviable-sat-first" id="nonviable-sat-first" on:change={handleCheckboxChange}>
            <p>Not Available</p>
        </div>

        <!-- Option 2 -->
        <div class="inline-form">
            <label for="rank-sat-second" style="width:150px">Sat May 3rd 7pm:</label>
            <select name="rank-sat-second" id="rank-sat-second" on:change={enforceValidSelect}>
                <option value="" selected disabled>Rank</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
            </select>
            <input type="checkbox" name="nonviable-sat-second" id="nonviable-sat-second" on:change={handleCheckboxChange}>
            <p>Not Available</p>
        </div>

        <!-- Option 3 -->
        <div class="inline-form">
            <label for="rank-sun-third" style="width:150px">Sun May 4th 2pm:</label>
            <select name="rank-sun-third" id="rank-sun-third" on:change={enforceValidSelect}>
                <option value="" selected disabled>Rank</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
            </select>
            <input type="checkbox" name="nonviable-sun-third" id="nonviable-sun-third" on:change={handleCheckboxChange}>
            <p>Not Available</p>
        </div>

        <!-- Option 4 -->
        <div class="inline-form">
        <label for="rank-sun-fourth" style="width:150px">Sun May 4th 5pm:</label>
        <select name="rank-sun-fourth" id="rank-sun-fourth">
            <option value="" selected disabled>Rank</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
        </select>
        <input type="checkbox" name="nonviable-sun-fourth" id="nonviable-sun-forth" on:change={handleCheckboxChange}>
        <p>Not Available</p>
        </div><br/>
        <div class="form-group">
            <button type="submit" disabled="{disableStatus}">Submit</button>
        </div>
  </form>
</div>