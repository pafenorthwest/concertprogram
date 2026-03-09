<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import type { ScheduleViewModel } from '$lib/types/schedule.js';
	import { onDestroy } from 'svelte';

	type SubmissionStatus = 'success' | 'error';
	type ActionData = {
		submissionStatus?: SubmissionStatus;
		error?: string;
	} | null;
	type PerformancePiece = {
		musical_piece_id: number;
		printed_name: string;
		movement: string | null;
		is_performance_piece: boolean;
	};

	let disableFormSubmit = true;
	let firstTimeEntry = true;
	// view Model type ScheduleViewModel
	let viewModel: ScheduleViewModel | null = null;
	let rankSelections = {};
	let notAvailableSelections = {};
	let confirmSelections = {};
	export let data;
	export let form: ActionData = null;

	// Keep as string so SSR-selected option matches option values
	let durationSelection = '1';
	let durationPerformanceId: number | null = null;

	let popupStatus: SubmissionStatus | null = null;
	let popupVisible = false;
	let popupFading = false;
	let lastSubmissionStatus: SubmissionStatus | null = null;
	let popupTimers: ReturnType<typeof setTimeout>[] = [];
	let performancePieces: PerformancePiece[] = [];
	let selectedPerformancePieceId: number | null = null;
	let selectionRequired = false;
	let selectionError: string | null = null;
	let selectionSaving = false;
	let selectionPerformanceId: number | null = null;
	let selectedPerformancePiece: PerformancePiece | null = null;
	let performancePieceHeading = '';
	let helpVisible = true;
	let selectedLookupCode = '';
	let reviewPerformancePiece = '';
	let pieceInstruction = '';
	let timeInstruction = '';
	// Refresh the selection any time the route data changes (e.g., client nav to another performer)
	$: if (data) {
		const performanceId = data.performance_id ?? null;
		// Only reset the duration when the loaded performance changes so user picks are preserved
		if (performanceId !== durationPerformanceId) {
			const performanceDuration = Number(data.performance_duration) || 0;
			durationSelection =
				performanceDuration > 0 ? Math.min(performanceDuration, 8).toString() : '1';
			durationPerformanceId = performanceId;
		}
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

	$: if (data) {
		const performanceId = data.performance_id ?? null;
		if (performanceId !== selectionPerformanceId) {
			selectionPerformanceId = performanceId;
			performancePieces = data.performance_pieces ?? [];
			selectedPerformancePieceId = data.selected_performance_piece_id ?? null;
			selectionRequired = data.performance_piece_selection_required ?? false;
			selectionError = null;
			selectionSaving = false;
			helpVisible = true;
		}
	}

	$: selectedPerformancePiece =
		performancePieces.find((piece) => piece.musical_piece_id === selectedPerformancePieceId) ??
		null;
	$: performancePieceHeading = selectedPerformancePiece
		? selectedPerformancePiece.printed_name
		: selectionRequired
			? ''
			: data?.performance_piece_display || data?.musical_piece || '';
	$: selectedLookupCode = data?.primary_class_code ?? data?.lottery_code ?? '';
	$: reviewPerformancePiece = performancePieceHeading || 'Choose one performance piece below.';
	$: pieceInstruction =
		performancePieces.length > 1
			? 'If more than one song is listed, choose one piece below. If only one piece is eligible, it stays selected for you by default. Please perform the piece that matches the award you received unless the Concert Chair asks otherwise.'
			: 'If only one eligible piece is listed, it stays selected for you by default. Please perform the piece that matches the award you received unless the Concert Chair asks otherwise.';
	$: timeInstruction =
		viewModel?.mode === 'confirm-only'
			? 'You are invited to play at one concert. Confirm attendance for the listed concert, or choose Not Available if you cannot attend.'
			: 'You are invited to play at one concert. Rank the concert times you prefer and mark any time you cannot attend as Not Available.';

	function selectedRanks() {
		return Object.entries(rankSelections)
			.filter(([slotId]) => !notAvailableSelections[slotId])
			.map(([, rank]) => String(rank ?? '').trim())
			.filter((rank) => rank !== '')
			.map((rank) => Number(rank))
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
		if (selectionRequired) {
			disableFormSubmit = true;
			return;
		}
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
		disableFormSubmit = lacksGoodRankChoices() || selectionRequired;
	}

	$: if (viewModel?.mode === 'confirm-only') {
		const slot = viewModel.slots[0];
		if (slot) {
			const confirmed = confirmSelections[slot.slotId];
			const notAvailable = notAvailableSelections[slot.slotId];
			disableFormSubmit = !(confirmed || notAvailable) || selectionRequired;
		}
	}

	function handleConfirmChange(slotId) {
		if (confirmSelections[slotId]) {
			notAvailableSelections = { ...notAvailableSelections, [slotId]: false };
		}
	}

	function handleNotAvailableChange(slotId) {
		if (notAvailableSelections[slotId]) {
			confirmSelections = { ...confirmSelections, [slotId]: false };
		}
	}

	function clearPopupTimers() {
		popupTimers.forEach((timer) => clearTimeout(timer));
		popupTimers = [];
	}

	function showPopup(status: SubmissionStatus) {
		if (!browser) {
			return;
		}
		clearPopupTimers();
		popupStatus = status;
		popupVisible = true;
		popupFading = false;

		popupTimers.push(
			setTimeout(() => {
				popupFading = true;
			}, 7000)
		);
		popupTimers.push(
			setTimeout(() => {
				popupVisible = false;
				popupStatus = null;
				popupFading = false;
			}, 8000)
		);

		if (status === 'success') {
			popupTimers.push(
				setTimeout(() => {
					goto('/');
				}, 8000)
			);
		}
	}

	function dismissPopup() {
		const shouldRedirect = popupStatus === 'success';
		clearPopupTimers();
		popupFading = true;
		popupTimers.push(
			setTimeout(() => {
				popupVisible = false;
				popupStatus = null;
				popupFading = false;
			}, 1000)
		);
		if (shouldRedirect && browser) {
			goto('/');
		}
	}

	$: if (browser && form?.submissionStatus && form.submissionStatus !== lastSubmissionStatus) {
		lastSubmissionStatus = form.submissionStatus;
		showPopup(form.submissionStatus);
	}

	onDestroy(() => {
		clearPopupTimers();
	});

	function formatPieceLabel(piece: PerformancePiece): string {
		if (piece.movement && piece.movement.trim().length > 0) {
			return `${piece.printed_name} - ${piece.movement}`;
		}
		return piece.printed_name;
	}

	function dismissHelp() {
		helpVisible = false;
	}

	function showHelp() {
		helpVisible = true;
	}

	async function selectPerformancePiece(musicalPieceId: number) {
		if (!data?.performance_id) {
			return;
		}
		selectionSaving = true;
		selectionError = null;
		try {
			const response = await fetch('/api/performance/pieces/select', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					performance_id: data.performance_id,
					musical_piece_id: musicalPieceId
				})
			});
			if (!response.ok) {
				selectionError = 'Unable to save selection. Please try again.';
				return;
			}
			selectedPerformancePieceId = musicalPieceId;
			performancePieces = performancePieces.map((piece) => ({
				...piece,
				is_performance_piece: piece.musical_piece_id === musicalPieceId
			}));
			selectionRequired = false;
		} finally {
			selectionSaving = false;
		}
	}

	async function clearPerformancePieceSelection() {
		if (!data?.performance_id) {
			return;
		}
		selectionSaving = true;
		selectionError = null;
		try {
			const response = await fetch('/api/performance/pieces/clear', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ performance_id: data.performance_id })
			});
			if (!response.ok) {
				selectionError = 'Unable to clear selection. Please try again.';
				return;
			}
			selectedPerformancePieceId = null;
			performancePieces = performancePieces.map((piece) => ({
				...piece,
				is_performance_piece: false
			}));
			selectionRequired = performancePieces.length > 1;
		} finally {
			selectionSaving = false;
		}
	}
</script>

<svelte:head>
	<title>Concert Scheduling</title>
</svelte:head>

<h2>Concert Scheduling</h2>
<div class="schedule-form">
	{#if popupVisible && popupStatus}
		<div
			class="status-popup"
			class:fade-out={popupFading}
			class:success={popupStatus === 'success'}
			class:error={popupStatus === 'error'}
			role={popupStatus === 'error' ? 'alert' : 'status'}
			aria-live={popupStatus === 'error' ? 'assertive' : 'polite'}
		>
			<button class="popup-dismiss" type="button" aria-label="Dismiss" on:click={dismissPopup}>
				X
			</button>
			<span class="popup-icon" aria-hidden="true">{popupStatus === 'success' ? '✓' : 'X'}</span>
			<span class="popup-text">
				{popupStatus === 'success' ? 'Success' : 'Please Try Again'}
			</span>
		</div>
	{/if}
	{#if data.status === 'OK' && data.viewModel}
		{#if data.viewModel.mode === 'confirm-only'}
			<h3 class="schedule">Confirmation of Concerto Performance</h3>
			{#if helpVisible}
				<section class="help-panel" aria-labelledby="schedule-help-title">
					<div class="help-panel-header">
						<div>
							<p class="help-kicker">Parents and teachers</p>
							<h4 id="schedule-help-title">How to complete this form</h4>
						</div>
						<button
							type="button"
							class="help-toggle"
							aria-label="Dismiss schedule help"
							on:click={dismissHelp}
						>
							Dismiss help
						</button>
					</div>
					<ol class="help-steps">
						<li>
							<strong>Review concert information at the top.</strong> Confirm the performer name, classes,
							performance piece, and lookup code before making any choices.
						</li>
						<li>
							<strong>Choose one performance piece if needed.</strong>
							{pieceInstruction}
						</li>
						<li>
							<strong>Confirm or decline the listed concert time.</strong>
							{timeInstruction}
						</li>
						<li>
							<strong>Enter duration.</strong> We need the length of your performance in minutes. The
							limit is 8 minutes and must not be exceeded.
						</li>
						<li>
							<strong>Add comments if needed.</strong> Use comments for any special information that pertains
							to the performance.
						</li>
					</ol>
					<p class="help-note">You can return to this page later if you need to make changes.</p>
				</section>
			{:else}
				<button type="button" class="help-reopen" on:click={showHelp}
					>Show instructions again</button
				>
			{/if}
			<section class="review-card" aria-labelledby="review-concert-info">
				<h4 id="review-concert-info">Step 1: Review concert information</h4>
				<div class="review-grid">
					<div>
						<span class="review-label">Performer name</span>
						<p>{data.performer_name}</p>
					</div>
					<div>
						<span class="review-label">Classes</span>
						<p>{data.winner_class_display}</p>
					</div>
					<div>
						<span class="review-label">Performance piece</span>
						<p>{reviewPerformancePiece}</p>
					</div>
					<div>
						<span class="review-label">Lookup code</span>
						<p>{selectedLookupCode}</p>
					</div>
				</div>
			</section>
			{#if performancePieces.length > 1}
				<div class="piece-selection">
					<h4>Step 2: Choose one performance piece</h4>
					<p class="instruction-text">{pieceInstruction}</p>
					{#each performancePieces as piece (piece.musical_piece_id)}
						<label class="piece-option">
							<input
								type="radio"
								name="performancePiece"
								value={piece.musical_piece_id}
								checked={piece.musical_piece_id === selectedPerformancePieceId}
								on:change={() => selectPerformancePiece(piece.musical_piece_id)}
								disabled={selectionSaving}
							/>
							<span>{formatPieceLabel(piece)}</span>
						</label>
					{/each}
					<div class="piece-actions">
						{#if selectedPerformancePieceId && performancePieces.length > 1}
							<button
								type="button"
								class="action"
								on:click={clearPerformancePieceSelection}
								disabled={selectionSaving}
							>
								Clear selection
							</button>
						{/if}
						{#if selectionRequired}
							<span class="piece-warning">Selection required before submitting schedule.</span>
						{/if}
						{#if selectionError}
							<span class="piece-error">{selectionError}</span>
						{/if}
					</div>
				</div>
			{/if}
			{#if data.viewModel.slots[0].confirmed}
				<h3>
					You are all set, thank you for confirming your attendance {data.viewModel.slots[0]
						.displayTime}
				</h3>
				<p>Please contact concertchair@pafenorthwest.com with any questions</p>
				<br /><br />
			{:else}
				<form id="concerto-confirmation" method="POST" action="?/add">
					<h4>Step 3: Confirm your concert time</h4>
					<p class="instruction-text">
						{timeInstruction}
					</p>
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
							on:change={() => handleConfirmChange(data.viewModel.slots[0].slotId)}
						/>
						<p class="concerto-confirm">Confirm Attendance</p>
						<input
							type="checkbox"
							name={fieldNames.notAvailable(data.viewModel.slots[0].slotId)}
							class="concerto-confirm"
							id="concert-not-available"
							bind:checked={notAvailableSelections[data.viewModel.slots[0].slotId]}
							on:change={() => handleNotAvailableChange(data.viewModel.slots[0].slotId)}
						/>
						<p class="concerto-confirm">Not Available</p>
						<br /><br />
						<label for="duration"
							><span class="concerto-confirm">Step 4: Duration</span><br /><span>
								Enter the performance time in minutes. The limit is 8 minutes.</span
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
						<label for="comment"
							><span class="concerto-confirm">Step 5: Comments</span><br /><span>
								Add any special information about the performance.</span
							></label
						>
						<input
							type="text"
							id="comment"
							name="comment"
							value={data.performance_comment ?? ''}
						/><br /><br />
						<p class="return-note">
							You can come back and edit this page later if anything changes.
						</p>
					</div>
					<div class="form-group">
						<button type="submit" disabled={disableFormSubmit}>Submit</button>
					</div>
				</form>
			{/if}
		{:else}
			<h3 class="schedule">Rank Performance Times</h3>
			{#if helpVisible}
				<section class="help-panel" aria-labelledby="schedule-help-title">
					<div class="help-panel-header">
						<div>
							<p class="help-kicker">Parents and teachers</p>
							<h4 id="schedule-help-title">How to complete this form</h4>
						</div>
						<button
							type="button"
							class="help-toggle"
							aria-label="Dismiss schedule help"
							on:click={dismissHelp}
						>
							Dismiss help
						</button>
					</div>
					<ol class="help-steps">
						<li>
							<strong>Review concert information at the top.</strong> Confirm the performer name, classes,
							performance piece, and lookup code before making any choices.
						</li>
						<li>
							<strong>Choose one performance piece if needed.</strong>
							{pieceInstruction}
						</li>
						<li>
							<strong>Rank your preferred concert times.</strong>
							{timeInstruction}
						</li>
						<li>
							<strong>Enter duration.</strong> We need the length of your performance in minutes. The
							limit is 8 minutes and must not be exceeded.
						</li>
						<li>
							<strong>Add comments if needed.</strong> Use comments for any special information that pertains
							to the performance.
						</li>
					</ol>
					<p class="help-note">You can return to this page later if you need to make changes.</p>
				</section>
			{:else}
				<button type="button" class="help-reopen" on:click={showHelp}
					>Show instructions again</button
				>
			{/if}
			<section class="review-card" aria-labelledby="review-concert-info">
				<h4 id="review-concert-info">Step 1: Review concert information</h4>
				<div class="review-grid">
					<div>
						<span class="review-label">Performer name</span>
						<p>{data.performer_name}</p>
					</div>
					<div>
						<span class="review-label">Classes</span>
						<p>{data.winner_class_display}</p>
					</div>
					<div>
						<span class="review-label">Performance piece</span>
						<p>{reviewPerformancePiece}</p>
					</div>
					<div>
						<span class="review-label">Lookup code</span>
						<p>{selectedLookupCode}</p>
					</div>
				</div>
			</section>
			{#if performancePieces.length > 1}
				<div class="piece-selection">
					<h4>Step 2: Choose one performance piece</h4>
					<p class="instruction-text">{pieceInstruction}</p>
					{#each performancePieces as piece (piece.musical_piece_id)}
						<label class="piece-option">
							<input
								type="radio"
								name="performancePiece"
								value={piece.musical_piece_id}
								checked={piece.musical_piece_id === selectedPerformancePieceId}
								on:change={() => selectPerformancePiece(piece.musical_piece_id)}
								disabled={selectionSaving}
							/>
							<span>{formatPieceLabel(piece)}</span>
						</label>
					{/each}
					<div class="piece-actions">
						{#if selectedPerformancePieceId && performancePieces.length > 1}
							<button
								type="button"
								class="action"
								on:click={clearPerformancePieceSelection}
								disabled={selectionSaving}
							>
								Clear selection
							</button>
						{/if}
						{#if selectionRequired}
							<span class="piece-warning">Selection required before submitting schedule.</span>
						{/if}
						{#if selectionError}
							<span class="piece-error">{selectionError}</span>
						{/if}
					</div>
				</div>
			{/if}
			<div id="error-icon" class="base-icon hidden"><p>Duplicate Rankings Selected</p></div>
			<div id="success-icon" class="base-icon hidden"><p>✓</p></div>
			<form id="ranked-choice-form" class="form-container" method="POST" action="?/add">
				<div class="form-group">
					<input type="hidden" name="performerId" value={data.performer_id} />
					<input type="hidden" name="concertSeries" value={data.concert_series} />
					<input type="hidden" name="performanceId" value={data.performance_id} />
					<span class="concerto-confirm">Step 3: Rank concert times</span><br />
					<p>
						{timeInstruction}
					</p>
					<p>
						Use 1 for your most preferred option and {data.viewModel.slotCount} for your least preferred
						option.
					</p>
					<br /><br />

					<!-- assert and filter; best to surface the dupliate data bug, two zero slots, early -->
					{#each (data.viewModel.slots ?? []).filter((s) => s?.slotId != null) as slot (slot.slotId)}
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
						><span class="concerto-confirm">Step 4: Duration</span><br /><span>
							Enter the performance time in minutes. The limit is 8 minutes.</span
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
					<label for="comment"
						><span class="concerto-confirm">Step 5: Comments</span><br /><span>
							Add any special information about the performance.</span
						></label
					>
					<input
						type="text"
						id="comment"
						name="comment"
						value={data.performance_comment ?? ''}
					/><br /><br />
					<p class="return-note">You can come back and edit this page later if anything changes.</p>
					<div class="form-group">
						<button type="submit" disabled={disableFormSubmit}>Submit</button>
					</div>
				</div>
			</form>
		{/if}
	{:else if popupVisible && popupStatus}
		<h3 class="schedule">Completed Processing</h3>
	{:else}
		<h3 class="schedule">{data.status}</h3>
		<p class="top-message">
			Please perform search again. If unable to schedule please contact
			concertchair@pafenorthwest.org
		</p>
		<br /><br /><br />
	{/if}
</div>

<style>
	.status-popup {
		position: fixed;
		top: calc(var(--margin) * 3);
		left: var(--margin);
		z-index: 20;
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 12px;
		align-items: center;
		padding: 14px 18px;
		min-width: 220px;
		background: var(--card-bg-color);
		color: var(--text-color);
		border: 1px solid var(--separator-color);
		border-left: 6px solid var(--allok-color);
		border-radius: var(--border-radius);
		box-shadow: 0 8px 18px rgba(0, 0, 0, 0.18);
		opacity: 1;
		transition: opacity 1s ease;
	}

	.status-popup.success {
		border-left-color: var(--allok-color);
	}

	.status-popup.error {
		border-left-color: var(--error-color);
	}

	.status-popup.fade-out {
		opacity: 0;
	}

	.popup-icon {
		font-size: 1.6em;
		font-weight: bold;
	}

	.status-popup.success .popup-icon {
		color: var(--allok-color);
	}

	.status-popup.error .popup-icon {
		color: var(--error-color);
	}

	.popup-text {
		font-size: 1em;
		font-weight: 600;
	}

	.popup-dismiss {
		position: absolute;
		top: 6px;
		right: 8px;
		background: transparent;
		border: none;
		color: var(--low-em-color);
		font-size: 0.9em;
		cursor: pointer;
	}

	.popup-dismiss:hover {
		color: var(--text-color);
	}

	@media screen and (max-width: 600px) {
		.status-popup {
			left: var(--gutter);
			right: var(--gutter);
		}
	}

	.piece-selection {
		margin: 0 0 18px var(--margin);
		padding: 12px 14px;
		border: 1px solid var(--separator-color);
		border-radius: var(--border-radius);
		background: var(--card-bg-color);
	}

	.help-panel,
	.review-card {
		margin: 0 0 18px var(--margin);
		padding: 16px 18px;
		border: 1px solid var(--separator-color);
		border-radius: var(--border-radius);
		background: var(--card-bg-color);
	}

	.help-panel-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 12px;
	}

	.help-kicker,
	.review-label {
		margin: 0;
		color: var(--low-em-color);
		font-size: 0.9rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.help-toggle,
	.help-reopen {
		border: 1px solid var(--separator-color);
		border-radius: var(--border-radius);
		background: transparent;
		color: var(--text-color);
		cursor: pointer;
		padding: 8px 12px;
	}

	.help-reopen {
		margin: 0 0 18px var(--margin);
	}

	.help-steps {
		margin: 12px 0 0 20px;
		padding: 0;
	}

	.help-steps li,
	.help-note,
	.instruction-text,
	.return-note {
		line-height: 1.5;
	}

	.help-note,
	.return-note {
		margin: 12px 0 0;
		color: var(--low-em-color);
	}

	.review-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 14px;
		margin-top: 12px;
	}

	.review-grid p {
		margin: 6px 0 0;
	}

	.piece-option {
		display: flex;
		align-items: center;
		gap: 8px;
		margin: 6px 0;
	}

	.piece-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		align-items: center;
		margin-top: 10px;
	}

	.piece-warning,
	.piece-error {
		color: var(--error-color);
		font-weight: 600;
	}

	@media screen and (max-width: 600px) {
		.help-panel-header {
			flex-direction: column;
		}
	}
</style>
