<script>
	import {enhance} from '$app/forms';
	export let data;
</script>

<h2>Programs</h2>
{#if data.isAuthenticated}
	<div class="right-corner-form">
		<form id="limit" method="POST" action="?/updateseats" use:enhance>
			<label for="seats">seats:</label>
			<input type="text" id="seats" name="seats" maxlength="2" required>
			<button type="submit">rebuild</button>
		</form>
	</div>
	<select name="concert-selector" id="concert-selector">
		{#each data.concert_times as concert}
			<option value="{concert.concert_number_in_series}">{concert.concert_series}
				#{concert.concert_number_in_series} {concert.displayStartTime}</option>
		{/each}
	</select>
{:else}
	<h3 class="noauth">Not Authorized</h3>
{/if}