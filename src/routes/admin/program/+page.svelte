<script>
	import { onMount } from 'svelte';
	import { buildProgramExportUrl, canExportProgram } from '$lib/programExport';

	export let data;

	let draggable = true;
	let filterSeries = 'Concerto';
	let filterConcertNumber = 0;
	let selectedConcertValue = `${filterSeries}-${filterConcertNumber}`;
	let selectedCommentId = null;

	$: filteredProgram = data.program.filter(
		(entry) =>
			(entry.concertSeries === filterSeries &&
				entry.concertNumberInSeries === filterConcertNumber) ||
			(entry.concertSeries === filterSeries && filterSeries === 'Waitlist') ||
			filterSeries === 'All'
	);

	$: selectedCommentEntry =
		selectedCommentId == null
			? null
			: (data.program.find((entry) => entry.id === selectedCommentId) ?? null);

	$: if (selectedCommentId != null) {
		const activeCommentEntry = data.program.find((entry) => entry.id === selectedCommentId) ?? null;

		if (
			!activeCommentEntry ||
			!hasComment(activeCommentEntry.comment) ||
			!filteredProgram.some((entry) => entry.id === activeCommentEntry.id)
		) {
			selectedCommentId = null;
		}
	}

	function hasComment(comment) {
		return typeof comment === 'string' && comment.trim().length > 0;
	}

	function closeCommentPopover() {
		selectedCommentId = null;
	}

	function toggleCommentPopover(entry) {
		if (!hasComment(entry.comment)) {
			return;
		}

		selectedCommentId = selectedCommentId === entry.id ? null : entry.id;
	}

	async function handleSave(program) {
		try {
			const response = await fetch(`/api/program/`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(program)
			});
			if (!response.ok) {
				throw new Error('Failed to save program');
			}
		} catch (error) {
			console.error('Error saving program:', error);
		}
	}

	async function filterByConcert(event) {
		const chooser = event.target;
		selectedConcertValue = chooser.value;
		closeCommentPopover();
		if (chooser.value.includes('-')) {
			const [concertSeries, concertNum] = chooser.value.split('-', 2);
			filterSeries = concertSeries;
			filterConcertNumber = Number(concertNum);
		} else {
			filterSeries = chooser.value;
			filterConcertNumber = 0;
		}
	}

	function downloadCsv() {
		window.location.href = '/api/program/';
	}

	function downloadProgram() {
		const programUrl = buildProgramExportUrl(selectedConcertValue);
		if (!programUrl) {
			return;
		}
		window.location.href = programUrl;
	}

	async function forceMove(event) {
		const selectConcertGroup = event.target;
		const performanceId = selectConcertGroup.getAttribute('data-id');
		const performerId = selectConcertGroup.getAttribute('data-performer-id');
		const [concertSeries, concertNum] = selectConcertGroup.value.split('-', 2);
		try {
			const response = await fetch(`/api/program/${performanceId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					concertSeries: concertSeries,
					concertNum: concertNum,
					performerId: performerId
				})
			});
			if (!response.ok) {
				throw new Error('Failed to save program');
			}
			window.location.reload();
		} catch (error) {
			console.error('Error saving program:', error);
		}
	}

	onMount(() => {
		const table = document.getElementById('sortable-table');
		const tbody = table?.querySelector('tbody');

		if (!tbody) {
			return undefined;
		}

		let draggingRow = null;

		const handleDragStart = (event) => {
			if (event.target.closest('tr')) {
				draggingRow = event.target.closest('tr');
				setTimeout(() => draggingRow?.classList.add('dragging'), 0);
			}
		};

		const handleDragEnd = () => {
			if (draggingRow) {
				draggingRow.classList.remove('dragging');
				draggingRow = null;
			}

			const rows = tbody.querySelectorAll('tr.sortable-row');
			for (let i = 0; i < rows.length; i++) {
				const keyCell = rows[i].querySelector('td[data-id]');
				if (keyCell) {
					const performanceId = Number(keyCell.getAttribute('data-id'));
					const programEntry = data.program.find((entry) => entry.id === performanceId);
					if (programEntry) {
						programEntry.order = i;
					}
				}
			}
			handleSave(data.program);
		};

		const handleDragOver = (event) => {
			event.preventDefault();
			if (!draggingRow) {
				return;
			}
			const draggingOver = getDragAfterRow(tbody, event.clientY);
			if (draggingOver) {
				tbody.insertBefore(draggingRow, draggingOver);
			} else {
				tbody.appendChild(draggingRow);
			}
		};

		function getDragAfterRow(container, y) {
			const rows = [...container.querySelectorAll('.sortable-row:not(.dragging)')];
			return rows.reduce(
				(closest, row) => {
					const box = row.getBoundingClientRect();
					const offset = y - box.top - box.height / 2;
					if (offset < 0 && offset > closest.offset) {
						return { offset, element: row };
					}
					return closest;
				},
				{ offset: Number.NEGATIVE_INFINITY }
			).element;
		}

		tbody.addEventListener('dragstart', handleDragStart);
		tbody.addEventListener('dragend', handleDragEnd);
		tbody.addEventListener('dragover', handleDragOver);

		return () => {
			tbody.removeEventListener('dragstart', handleDragStart);
			tbody.removeEventListener('dragend', handleDragEnd);
			tbody.removeEventListener('dragover', handleDragOver);
		};
	});
</script>

{#if data.isAuthenticated}
	<section class="program-page">
		<header class="program-header">
			<div>
				<p class="eyebrow">Admin</p>
				<h1>Programs</h1>
				<p>Manage program order, review performer details, and inspect row comments.</p>
			</div>
			<div class="program-controls">
				<label>
					Concert
					<select
						name="concert-selector"
						id="concert-selector"
						bind:value={selectedConcertValue}
						on:change={filterByConcert}
					>
						{#each data.concert_times as concert}
							<option value={concert.concert_series + '-' + concert.concert_number_in_series}
								>{concert.concert_series}
								#{concert.concert_number_in_series}
								{concert.displayStartTime}</option
							>
						{/each}
						<option value="Waitlist">Waitlist NoTime</option>
						<option value="All">All</option>
					</select>
				</label>
				<div class="control-buttons">
					<button type="button" class="ghost-button" on:click={downloadCsv}>CSV</button>
					<button
						type="button"
						class="complete"
						on:click={downloadProgram}
						disabled={!canExportProgram(selectedConcertValue)}
					>
						Program
					</button>
				</div>
			</div>
		</header>

		<section class="table-card">
			<div class="card-header">
				<div>
					<h2>Program order</h2>
					<p>{filteredProgram.length} rows in the current view.</p>
				</div>
			</div>

			<div class="table-scroll">
				<table class="program-table" id="sortable-table">
					<thead>
						<tr>
							<th>Grab</th>
							<th>Concert Series</th>
							<th>Comment</th>
							<th>Duration</th>
							<th>Musical Piece</th>
							<th>Contributors</th>
							<th>Performer</th>
							<th>Age</th>
							<th>Accompanist</th>
							<th>Move</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredProgram as entry}
							<tr class="sortable-row" {draggable}>
								<td data-id={entry.id}>
									<button type="button" class="grab-button" draggable="true" aria-label="Drag row">
										☰
									</button>
								</td>
								<td>{entry.concertSeries}</td>
								<td>
									<button
										type="button"
										class="ghost-button comment-button"
										disabled={!hasComment(entry.comment)}
										aria-disabled={!hasComment(entry.comment)}
										aria-label={hasComment(entry.comment)
											? `View comment for ${entry.performerName}`
											: `No comment for ${entry.performerName}`}
										on:click={() => toggleCommentPopover(entry)}
									>
										{hasComment(entry.comment) ? 'View comment' : 'No comment'}
									</button>
								</td>
								<td>{entry.duration}</td>
								<td class="stacked-cell">
									{#each entry.musicalTitles as piece}
										<div class="stacked-block">
											<div>{piece.title}</div>
											<div class="muted-text">{piece.movement || '—'}</div>
										</div>
									{/each}
								</td>
								<td class="stacked-cell">
									{#each entry.musicalTitles as piece}
										<div class="stacked-block">
											{#each piece.contributors as composer}
												<div>{composer.printedName} {composer.yearsActive}</div>
											{/each}
										</div>
									{/each}
								</td>
								<td>Soloist on {entry.instrument}: {entry.performerName}</td>
								<td>{entry.age}</td>
								<td>
									{#if entry.accompanist !== ''}
										Pianist: {entry.accompanist}
									{:else}
										<span class="muted-text">—</span>
									{/if}
								</td>
								<td>
									{#if entry.concertSeries !== 'Concerto'}
										<select
											class="move-select"
											name="override-selector"
											on:change={forceMove}
											data-id={entry.id}
											data-performer-id={entry.performerId}
										>
											<option value="" selected disabled>Mv</option>
											<option value="Eastside-1">E1</option>
											<option value="Eastside-2">E2</option>
											<option value="Eastside-3">E3</option>
											<option value="Eastside-4">E4</option>
											<option value="Waitlist-1">WL</option>
										</select>
									{:else}
										<span class="muted-text">—</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>

		{#if selectedCommentEntry}
			<div class="comment-popover-layer">
				<button
					type="button"
					class="comment-popover-backdrop"
					aria-label="Close comment popover"
					on:click={closeCommentPopover}
				></button>
				<div
					class="comment-popover"
					role="dialog"
					aria-modal="true"
					aria-labelledby="comment-title"
				>
					<div class="popover-header">
						<div>
							<p class="eyebrow">Comment</p>
							<h2 id="comment-title">{selectedCommentEntry.performerName}</h2>
							<p class="popover-meta">
								{selectedCommentEntry.concertSeries}
								#{selectedCommentEntry.concertNumberInSeries}
							</p>
						</div>
						<button type="button" class="ghost-button" on:click={closeCommentPopover}
							>Dismiss</button
						>
					</div>
					<p class="comment-copy">{selectedCommentEntry.comment}</p>
				</div>
			</div>
		{/if}
	</section>
{:else}
	<section class="program-page">
		<div class="table-card noauth-card">
			<h2>Not Authorized</h2>
			<p>You must be signed in to view the admin program page.</p>
		</div>
	</section>
{/if}

<style>
	.program-page {
		padding: 24px;
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.program-header {
		display: flex;
		justify-content: space-between;
		gap: 20px;
		align-items: flex-start;
		flex-wrap: wrap;
	}

	.program-header h1,
	.table-card h2,
	.comment-popover h2 {
		margin: 0;
		color: #1e293b;
	}

	.program-header p:not(.eyebrow),
	.card-header p,
	.popover-meta,
	.comment-copy,
	.noauth-card p {
		margin: 0;
		color: #475569;
	}

	.eyebrow {
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-size: 12px;
		color: #64748b;
		font-weight: 700;
		margin: 0 0 8px;
	}

	.program-controls {
		display: flex;
		gap: 12px;
		align-items: flex-end;
		flex-wrap: wrap;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 6px;
		font-weight: 600;
		color: #1e293b;
	}

	select {
		padding: 8px 10px;
		border-radius: 6px;
		border: 1px solid #cbd5f5;
		font-size: 14px;
		background: #fff;
		color: #1e293b;
	}

	.control-buttons {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
	}

	.table-card {
		border: 1px solid #e0e4f4;
		border-radius: 12px;
		padding: 16px;
		background: #f8f9ff;
		display: flex;
		flex-direction: column;
		gap: 16px;
		box-shadow: 0 8px 16px rgba(15, 23, 42, 0.06);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 12px;
	}

	.table-scroll {
		overflow-x: auto;
		border: 1px solid #e0e4f4;
		border-radius: 10px;
		background: #fff;
	}

	.program-table {
		width: 100%;
		border-collapse: collapse;
		min-width: 980px;
	}

	.program-table th,
	.program-table td {
		padding: 12px 14px;
		border-bottom: 1px solid #e2e8f0;
		text-align: left;
		vertical-align: top;
	}

	.program-table th {
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #64748b;
		background: #f8fafc;
	}

	.program-table tbody tr:last-child td {
		border-bottom: none;
	}

	:global(.sortable-row.dragging) {
		opacity: 0.55;
		background: #eef2ff;
	}

	.complete {
		background: #4f46e5;
		color: #fff;
		border: none;
		border-radius: 6px;
		padding: 8px 14px;
		cursor: pointer;
		font-weight: 600;
	}

	.ghost-button {
		background: #eef2ff;
		border: 1px solid #c7d2fe;
		color: #4338ca;
		border-radius: 6px;
		padding: 8px 14px;
		cursor: pointer;
		font-weight: 600;
	}

	.complete:disabled,
	.ghost-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.comment-button {
		min-width: 116px;
	}

	.grab-button {
		background: #e2e8f0;
		border: 1px solid #cbd5e1;
		color: #0f172a;
		border-radius: 6px;
		padding: 6px 10px;
		font-weight: 700;
		cursor: grab;
	}

	.move-select {
		min-width: 74px;
	}

	.stacked-cell {
		min-width: 180px;
	}

	.stacked-block + .stacked-block {
		margin-top: 10px;
		padding-top: 10px;
		border-top: 1px solid #e2e8f0;
	}

	.muted-text {
		color: #64748b;
	}

	.comment-popover-layer {
		position: fixed;
		inset: 0;
		z-index: 20;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24px;
	}

	.comment-popover-backdrop {
		position: absolute;
		inset: 0;
		border: none;
		background: rgba(15, 23, 42, 0.4);
		padding: 0;
		margin: 0;
	}

	.comment-popover {
		position: relative;
		z-index: 1;
		width: min(520px, 100%);
		background: #fff;
		border: 1px solid #e0e4f4;
		border-radius: 12px;
		padding: 20px;
		box-shadow: 0 24px 40px rgba(15, 23, 42, 0.2);
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.popover-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 12px;
	}

	.comment-copy {
		white-space: pre-wrap;
		line-height: 1.6;
	}

	.noauth-card {
		max-width: 480px;
	}

	@media (max-width: 900px) {
		.program-page {
			padding: 16px;
		}

		.program-controls,
		.control-buttons {
			width: 100%;
		}

		.control-buttons :global(button) {
			flex: 1 1 0;
		}

		.popover-header {
			flex-direction: column;
		}

		.comment-popover {
			padding: 16px;
		}
	}
</style>
