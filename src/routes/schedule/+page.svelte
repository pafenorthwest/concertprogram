<script>
    import { onMount } from 'svelte';

    let disableFormSubmit = true;
    let firstTimeEntry = true;
    export let data;

    function lacksGoodRankChoices() {
        // return true if there are dupes or no choices made
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
        // if no choices also bad
        return uniqueValues.size !== values.length;
    }

    function handleCheckboxChange(event) {
        // Find the checkbox's sibling elements
        const checkbox = event.target;
        updateCheckBoxDisplay(checkbox);
    }

    function updateCheckBoxDisplay(checkbox) {
        const siblingSelect = checkbox.previousElementSibling; // The next sibling (assumes the <select> is directly after the checkbox)
        const siblingP = checkbox.nextElementSibling; // The sibling <p> element after the <select>

        // Disable the <select> element if checkbox is checked
        if (siblingSelect.tagName === 'SELECT') {
            siblingSelect.disabled = checkbox.checked;
        }

        // Change the color of the <p> element if checkbox is checked
        if (siblingP.tagName === 'P') {
            siblingP.style.color = checkbox.checked ? 'black' : ''; // Reset color when uncheck
            siblingP.style.fontWeight = checkbox.checked ? 'bold' : '';
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
        const lacksGoodChoices = lacksGoodRankChoices()
        if (lacksGoodChoices) {
            const error_icon = document.getElementById('error-icon');
            appear_then_fade(error_icon)
        } else {
            if (disableFormSubmit && !firstTimeEntry) {
                const success_icon = document.getElementById('success-icon');
                appear_then_fade(success_icon)
            }
            firstTimeEntry = false;
        }
        disableFormSubmit = lacksGoodChoices
    }

    onMount(() => {
        if (data.formValues && data.formValues.length > 0) {
            const form = document.getElementById("ranked-choice-form");
            if (form) {
                // Gat all checkboxes within the form
                const selectCheckboxes = form.querySelectorAll('input[type="checkbox"]');
                // Get all select elements within the form
                const selectElements = form.querySelectorAll("select");
                data.formValues.forEach((value, index) => {
                    // re-hydrating we can allow submits
                    disableFormSubmit = false;
                    // update checkboxes and styling to respect non-available
                    if (value.notSelected && selectCheckboxes.length >= index) {
                        selectCheckboxes[index].checked = true;
                        updateCheckBoxDisplay(selectCheckboxes[index]);
                    }
                    // update ranked choices in drop down box
                    if (value.rank && selectElements.length >= index) {
                        selectElements[index].value = value.rank.toString();
                    }
                });
            }
        }
    })
</script>

<svelte:head>
    <title>Concert Scheduling</title>
</svelte:head>

<h2>Concert Scheduling</h2>
<div class="schedule-form">
    {#if data.status === 'OK' }
        {#if data.concert_series === "Concerto"}
            <h3 class="schedule">Confirmation of Concerto Performance</h3>
            <p class="top-message">Scheduling for {data.performer_name} </p><br/>
            <p class="top-message">Performing {data.musical_piece} </p><br/>
            <p class="top-message">Lookup code {data.lottery_code}</p>
            <br/><br/><br/>
            {#if data.formValues !== null && data.formValues[0].confirmed}
                <h3>You are all set, thank you for confirming you
                    attendance {data.concertTimes[0].displayStartTime}</h3>
                <p>Please contact concertchair@pafenorthwest.com with any questions</p>
                <br/><br/>
            {:else}
                <form id="concerto-confirmation" method="POST" action="?/add">
                    <p>Please confirm your attendance for Concerto Playoff
                        on {data.concertTimes[0].displayStartTime}</p>
                    <br /><br />
                    <div class="form-group">
                        <input type="hidden" name="performerId" value={data.performer_id} />
                        <input type="hidden" name="concertSeries" value={data.concert_series} />
                        <input type="checkbox" name="concert-confirm" id="concert-confirm">
                        <p>Confirm Attendance</p>
                    </div>
                    <div class="form-group">
                        <button type="submit">Submit</button>
                    </div>
                </form>
            {/if}
        {:else}
            <h3 class="schedule">Rank Performance Times</h3>
            <p class="top-message">Scheduling for {data.performer_name}</p><br/>
            <p class="top-message">Performing {data.musical_piece} </p><br/>
            <p class="top-message">Lookup code {data.lottery_code}</p>
            <br/><br/><br/>
            <div id="error-icon" class="base-icon hidden"><p>Duplicate Rankings Selected</p></div>
            <div id="success-icon" class="base-icon hidden"><p>✓</p></div>
            <form id="ranked-choice-form" class="form-container" method="POST" action="?/add">
                <div class="form-group">
                    <p>Please rank the following options (1 = most preferred, 4 = least preferred).</p>
                    <br/><br/>

                    <!-- Option 1 -->
                    <div class="inline-form">
                        <input type="hidden" name="performerId" value={data.performer_id}/>
                        <input type="hidden" name="concertSeries" value={data.concert_series}/>
                        <label for="rank-sat-first" style="width:180px">{data.concertTimes[1].displayStartTime}:</label>
                        <select name="rank-sat-first" id="rank-sat-first" on:change={enforceValidSelect}>
                            <option value="" selected disabled>Rank</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                        </select>
                        <input type="checkbox" name="nonviable-sat-first" id="nonviable-sat-first"
                               on:change={handleCheckboxChange}>
                        <p>Not Available</p>
                    </div>

                    <!-- Option 2 -->
                    <div class="inline-form">
                        <label for="rank-sat-second" style="width:180px">{data.concertTimes[2].displayStartTime}:</label>
                        <select name="rank-sat-second" id="rank-sat-second" on:change={enforceValidSelect}>
                            <option value="" selected disabled>Rank</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                        </select>
                        <input type="checkbox" name="nonviable-sat-second" id="nonviable-sat-second"
                               on:change={handleCheckboxChange}>
                        <p>Not Available</p>
                    </div>

                    <!-- Option 3 -->
                    <div class="inline-form">
                        <label for="rank-sun-third" style="width:180px">{data.concertTimes[3].displayStartTime}:</label>
                        <select name="rank-sun-third" id="rank-sun-third" on:change={enforceValidSelect}>
                            <option value="" selected disabled>Rank</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                        </select>
                        <input type="checkbox" name="nonviable-sun-third" id="nonviable-sun-third"
                               on:change={handleCheckboxChange}>
                        <p>Not Available</p>
                    </div>

                    <!-- Option 4 -->
                    <div class="inline-form">
                        <label for="rank-sun-fourth" style="width:180px">{data.concertTimes[4].displayStartTime}:</label>
                        <select name="rank-sun-fourth" id="rank-sun-fourth" on:change={enforceValidSelect}>
                            <option value="" selected disabled>Rank</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                        </select>
                        <input type="checkbox" name="nonviable-sun-fourth" id="nonviable-sun-forth"
                               on:change={handleCheckboxChange}>
                        <p>Not Available</p>
                    </div>
                    <br/>
                    <div class="form-group">
                        <button type="submit" disabled="{disableFormSubmit}">Submit</button>
                    </div>
                </div>
            </form>
        {/if}
    {:else}
        <h3 class="schedule">{data.status}</h3>
        <p class="top-message">Please perform search again. If unable to schedule please contact concertchair@pafenorthwest.org </p>
        <br/><br/><br/>
    {/if}
</div>