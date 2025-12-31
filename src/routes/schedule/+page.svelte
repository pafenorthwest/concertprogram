<script>
	let disableFormSubmit = true;
	let firstTimeEntry = true;
	let viewModel = null;
	let rankSelections = {};
	let notAvailableSelections = {};
	let confirmSelections = {};
	export let data;
	// Keep as string so SSR-selected option matches option values
	let durationSelection = '1';
	// Refresh the selection any time the route data changes (e.g., client nav to another performer)
	$: if (data) {
		const performanceDuration = Number(data.performance_duration) || 0;
		durationSelection =
			performanceDuration > 0 ? Math.min(performanceDuration, 8).toString() : '1';
	}

	const fieldNames = {
		rank: (slotId) => `slot-${slotId}-rank`,
		notAvailable: (slotId) => `slot-${slotId}-not-available`,
		confirm: (slotId) => `slot-${slotId}-confirm`
	};

	$: if (data?.viewModel && data.viewModel !== viewModel) {
		viewModel = data.viewModel;
		firstTimeEntry = true;
		if (viewModel.mode === 'rank-choice') {
			rankSelections = {};
			notAvailableSelections = {};
			viewModel.slots.forEach((slot) => {
				rankSelections[slot.slotId] = slot.rank ? slot.rank.toString() : '';
				notAvailableSelections[slot.slotId] = slot.notAvailable;
			});
		} else {
			confirmSelections = {};
			notAvailableSelections = {};
			viewModel.slots.forEach((slot) => {
				confirmSelections[slot.slotId] = slot.confirmed;
				notAvailableSelections[slot.slotId] = slot.notAvailable;
			});
		}
	}

	function selectedRanks() {
		return Object.entries(rankSelections)
			.filter(([slotId, rank]) => !notAvailableSelections[slotId] && rank.trim() !== '')
			.map(([, rank]) => Number(rank))
			.filter((rank) => Number.isInteger(rank));
	}

	function lacksGoodRankChoices() {
		const ranks = selectedRanks();
		if (ranks.length === 0) {
			return true;
		}
		const uniqueRanks = new Set(ranks);
		if (uniqueRanks.size !== ranks.length) {
			return true;
		}
		return !uniqueRanks.has(1);
	}

	function appear_then_fade(element) {
		if (element?.classList?.contains('hidden')) {
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

	function enforceValidSelect() {
		const lacksGoodChoices = lacksGoodRankChoices();
		if (lacksGoodChoices) {
			const error_icon = document.getElementById('error-icon');
			appear_then_fade(error_icon);
		} else {
			if (disableFormSubmit && !firstTimeEntry) {
				const success_icon = document.getElementById('success-icon');
				appear_then_fade(success_icon);
			}
			firstTimeEntry = false;
		}
		disableFormSubmit = lacksGoodChoices;
	}

	$: if (viewModel?.mode === 'rank-choice') {
		disableFormSubmit = lacksGoodRankChoices();
	}

	$: if (viewModel?.mode === 'confirm-only') {
		const slot = viewModel.slots[0];
		if (slot) {
			const confirmed = confirmSelections[slot.slotId];
			const notAvailable = notAvailableSelections[slot.slotId];
			disableFormSubmit = !(confirmed || notAvailable);
		}
	}
</script>

<svelte:head>
	<title>Concert Scheduling</title>
</svelte:head>

<h2>Concert Scheduling</h2>
<div class="schedule-form">
	{#if data.status === 'OK' && data.viewModel}
		{#if data.viewModel.mode === 'confirm-only'}
			<h3 class="schedule">Confirmation of Concerto Performance</h3>
			<p class="top-message">Scheduling for {data.performer_name}</p>
			<br />
			<p class="top-message">Performing {data.musical_piece}</p>
			<br />
			<p class="top-message">Lookup code {data.lottery_code}</p>
			<br /><br /><br />
			{#if data.viewModel.slots[0].confirmed}
				<h3>
					You are all set, thank you for confirming you attendance {data.viewModel.slots[0]
						.displayTime}
				</h3>
				<p>Please contact concertchair@pafenorthwest.com with any questions</p>
				<br /><br />
			{:else}
				<form id="concerto-confirmation" method="POST" action="?/add">
					<p>
						Please confirm your attendance for Concerto Playoff on {data.concertTimes[0]
							.displayStartTime}
					</p>
					<br /><br />
					<div class="form-group">
						<input type="hidden" name="performerId" value={data.performer_id} />
						<input type="hidden" name="concertSeries" value={data.concert_series} />
						<input type="hidden" name="performanceId" value={data.performance_id} />
						<input
							type="checkbox"
							name={fieldNames.confirm(data.viewModel.slots[0].slotId)}
							class="concerto-confirm"
							id="concert-confirm"
							bind:checked={confirmSelections[data.viewModel.slots[0].slotId]}
						/>
						<p class="concerto-confirm">Confirm Attendance</p>
						<input
							type="checkbox"
							name={fieldNames.notAvailable(data.viewModel.slots[0].slotId)}
							class="concerto-confirm"
							id="concert-not-available"
							bind:checked={notAvailableSelections[data.viewModel.slots[0].slotId]}
						/>
						<p class="concerto-confirm">Not Available</p>
						<br /><br />
						<label for="duration"
							><span class="concerto-confirm">Duration: </span><br /><span>
								performance time in minutes</span
							></label
						>
						<select class="action" name="duration" id="duration">
							<option value="1">1</option>
							<option value="2">2</option>
							<option value="3">3</option>
							<option value="4">4</option>
							<option value="5">5</option>
							<option value="6">6</option>
							<option value="7">7</option>
							<option value="8">8</option>
						</select><br /><br />
						<label for="comment"><span class="concerto-confirm">Comments:</span></label>
						<input
							type="text"
							id="comment"
							name="comment"
							value={data.performance_comment ?? ''}
						/><br /><br />
					</div>
					<div class="form-group">
						<button type="submit" disabled={disableFormSubmit}>Submit</button>
					</div>
				</form>
			{/if}
		{:else}
			<h3 class="schedule">Rank Performance Times</h3>
			<p class="top-message">Scheduling for {data.performer_name}</p>
			<br />
			<p class="top-message">Performing {data.musical_piece}</p>
			<br />
			<p class="top-message">Lookup code {data.lottery_code}</p>
			<br /><br /><br />
			<div id="error-icon" class="base-icon hidden"><p>Duplicate Rankings Selected</p></div>
			<div id="success-icon" class="base-icon hidden"><p>✓</p></div>
			<form id="ranked-choice-form" class="form-container" method="POST" action="?/add">
				<div class="form-group">
					<input type="hidden" name="performerId" value={data.performer_id} />
					<input type="hidden" name="concertSeries" value={data.concert_series} />
					<input type="hidden" name="performanceId" value={data.performance_id} />
					<span class="concerto-confirm">Rank Choice: </span><br />
					<p>
						Please rank the following options (1 = most preferred, {data.viewModel.slotCount} =
						least preferred).
					</p>
					<br /><br />

					{#each data.viewModel.slots as slot (slot.slotId)}
						<div class="inline-form">
							<label for={fieldNames.rank(slot.slotId)} style="width:180px"
								>{slot.displayTime}:</label
							>
							<select
								name={fieldNames.rank(slot.slotId)}
								id={fieldNames.rank(slot.slotId)}
								on:change={enforceValidSelect}
								bind:value={rankSelections[slot.slotId]}
								disabled={notAvailableSelections[slot.slotId]}
							>
								<option value="">Rank</option>
								{#each data.viewModel.rankOptions as option}
									<option value={option}>{option}</option>
								{/each}
							</select>
							<input
								type="checkbox"
								name={fieldNames.notAvailable(slot.slotId)}
								id={fieldNames.notAvailable(slot.slotId)}
								bind:checked={notAvailableSelections[slot.slotId]}
								on:change={enforceValidSelect}
							/>
							<p>Not Available</p>
						</div>
					{/each}
					<br /><br />
					<label for="duration"
						><span class="concerto-confirm">Duration: </span><br /><span>
							performance time in minutes</span
						></label
					>
					<select class="action" name="duration" id="duration" bind:value={durationSelection}>
						<option value="1">1</option>
						<option value="2">2</option>
						<option value="3">3</option>
						<option value="4">4</option>
						<option value="5">5</option>
						<option value="6">6</option>
						<option value="7">7</option>
						<option value="8">8</option>
					</select><br /><br />
					<label for="comment"><span class="concerto-confirm">Comments:</span></label>
					<input
						type="text"
						id="comment"
						name="comment"
						value={data.performance_comment ?? ''}
					/><br /><br />
					<div class="form-group">
						<button type="submit" disabled={disableFormSubmit}>Submit</button>
					</div>
				</div>
			</form>
		{/if}
	{:else}
		<h3 class="schedule">{data.status}</h3>
		<p class="top-message">
			Please perform search again. If unable to schedule please contact
			concertchair@pafenorthwest.org
		</p>
		<br /><br /><br />
	{/if}
</div>
