<script lang="ts">
	import { enhance } from '$app/forms';
	import { contributorRoles, defaultContributorRole } from '$lib/constants/contributors';


	let disableStatus = false;
	export let data;
	export let formErrors = null;
	let contributor_1_role = defaultContributorRole;
	let contributor_2_role = defaultContributorRole;

	// Boolean variable to track which form to display
	let showSingleEntryForm = false;

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
	// connect return from form data
	function handleFormResponse() {
		const form_response = document.getElementById('form-response');
		if (form_response) {
			form_response.innerHTML = '';
		}
		return async ({ result, update }) => {
			await update();

			if (result.type === 'success') {
				const success_icon = document.getElementById('success-icon');
				appear_then_fade(success_icon);
			} else {
				formErrors = result;
				const error_icon = document.getElementById('error-icon');
				appear_then_fade(error_icon);

				if (form_response) {
					if (!showSingleEntryForm) {
						const error_message = result.data?.error ? result.data?.error : 'Something Went Wrong';
						form_response.innerHTML = '<h3 class="error-message">' + error_message + '</h3>';
					} else {
						if (result.data?.error !== null) {
							const t_err_header =
								'<table class="table error-table"><thead><tr><th>reason</th><th>performer</th></tr></thead><tbody>';
							let t_err_body = '';
							const failure_list = JSON.parse(result.data?.error);
							for (const record of failure_list) {
								t_err_body =
									t_err_body +
									'<tr><td>' +
									record.reason +
									'</td><td>' +
									record.data.performer +
									'</td></tr>';
							}
							const t_err_footer = '</tbody></table>';
							form_response.innerHTML = t_err_header + t_err_body + t_err_footer;
						}
					}
				}
			}
		};
	}
</script>

<svelte:head>
	<title>Admin</title>
</svelte:head>

<h2>Admin</h2>
{#if !data.isAuthenticated}
	<h3 class="noauth">Not Authorized</h3>
{:else}
	<h3>Enter Data</h3>
	<div id="error-icon" class="base-icon hidden"><p>X</p></div>
	<div id="success-icon" class="base-icon hidden"><p>✓</p></div>
	<form id="full" class="inline-add" method="POST" action="?/add" use:enhance={handleFormResponse}>
		<div class="form-group">
			<label for="class">Class:</label>
			<input type="text" id="class" name="class" maxlength="14" required />
			<label for="performer-name">Performer Name:</label>
			<input type="text" id="performer-name" name="performer-name" maxlength="40" required />
			<label for="age">Age:</label>
			<input type="number" id="age" name="age" maxlength="2" step="1" required />
			<label for="lottery">Lottery:</label>
			<input type="number" id="lottery" name="lottery" maxlength="6" step="1" required />
			<label for="performer-email">Performer Email:</label>
			<input type="text" id="performer-email" name="performer-email" maxlength="25" required />
			<label for="performer-phone">Performer Phone <i>(optional)</i>:</label>
			<input type="text" id="performer-phone" name="performer-phone" maxlength="14" />
			<label for="accompanist">Accompanist <i>(optional)</i>:</label>
			<input type="text" id="accompanist" name="accompanist" maxlength="40" />
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
			<input type="text" id="musical-piece-1" name="musical-piece-1" maxlength="256" required />

			<label for="composer-name-piece-1">Contributor Name, Musical Piece 1:</label>
			<input
				type="text"
				id="composer-name-piece-1"
				name="composer-name-piece-1"
				maxlength="80"
				required
			/>
			<label for="role">Role, Musical Piece 1:</label>
			<select  class="action" id="contributor-1-role" name="contributor-1-role" bind:value={contributor_1_role}>
				{#each contributorRoles as role}
					<option value={role}>{role}</option>
				{/each}
			</select>
			<label for="composer-years-piece-1">Contributor Years Active, Musical Piece 1:</label>
			<input
				type="text"
				id="composer-years-piece-1"
				name="composer-years-piece-1"
				maxlength="80"
				required
			/>

			<label for="musical-piece-2">Musical Piece 2 <i>(optional)</i>:</label>
			<input type="text" id="musical-piece-2" name="musical-piece-2" maxlength="256" />

			<label for="composer-name-piece-2">Contributor Name, Musical Piece 2:</label>
			<input type="text" id="composer-name-piece-2" name="composer-name-piece-2" maxlength="80" />
			<label for="role">Role, Musical Piece 2:</label>
			<select class="action" id="contributor-2-role" name="contributor-2-role" bind:value={contributor_2_role}>
				{#each contributorRoles as role}
					<option value={role}>{role}</option>
				{/each}
			</select>
			<label for="composer-years-piece-1">Contributor Years Active, Musical Piece 2:</label>
			<input type="text" id="composer-years-piece-2" name="composer-years-piece-2" maxlength="80" />

			<label for="concert-series">Choose a concert series:</label>
			<select class="action" name="concert-series" id="concert-series">
				<option value="Eastside">Eastside</option>
				<option value="Concerto">Concerto</option>
			</select>
		</div>
		<div class="form-group">
			<button type="submit" disabled={disableStatus}>Submit</button>
		</div>
	</form>
	<div id="form-response"></div>
{/if}
