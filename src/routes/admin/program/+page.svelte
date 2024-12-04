<script>
	import { onMount } from 'svelte';

	export let data;
	let draggable = true;
	let filterSeries = 'Concerto';
	let filterConcertNumber = 0;

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
		if (chooser.value.includes('-')) {
			const [concertSeries, concertNum] = chooser.value.split('-', 2);
			filterSeries = concertSeries;
			filterConcertNumber = Number(concertNum);
		} else {
			filterSeries = chooser.value
		}
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
			// trigger reload of data
			window.location.reload();
		} catch (error) {
			console.error('Error saving program:', error);
		}
	}

	onMount(() => {
		const table = document.getElementById('sortable-table');
		const tbody = table.querySelector('tbody');
		let draggingRow = null;

		tbody.addEventListener('dragstart', (e) => {
			if (e.target.closest('tr')) {
				draggingRow = e.target.closest('tr');
				setTimeout(() => draggingRow.classList.add('dragging'), 0);
			}
		});

		tbody.addEventListener('dragend', () => {
			if (draggingRow) {
				draggingRow.classList.remove('dragging');
				draggingRow = null;
			}
			// get all rows to run number order
			const rows = tbody.querySelectorAll('tr.sortable-row');
			for (let i = 0; i < rows.length; i++) {
				const keyCell = rows[i].querySelector('td[data-id]');
				const orderCell = rows[i].querySelector('td.order-cell');
				if (keyCell) {
					const performanceId = Number(keyCell.getAttribute('data-id'));
					//find(concert => concert.normalizedStartTime === compareReformatISODate(item))?.concert_number_in_series)
					const programEntry = data.program.find(entry => entry.id === performanceId);
					if (programEntry) {
						programEntry.order = i;
					}
					if (orderCell) {
						orderCell.innerHTML = String(i);
					}
				}
			}
			handleSave(data.program);
		});

		tbody.addEventListener('dragover', (e) => {
			e.preventDefault();
			const draggingOver = getDragAfterRow(tbody, e.clientY);
			if (draggingOver) {
				tbody.insertBefore(draggingRow, draggingOver);
			} else {
				tbody.appendChild(draggingRow);
			}
		});

		function getDragAfterRow(container, y) {
			const rows = [...container.querySelectorAll('.sortable-row:not(.dragging)')];
			return rows.reduce(
				(closest, row) => {
					const box = row.getBoundingClientRect();
					const offset = y - box.top - box.height / 2;
					if (offset < 0 && offset > closest.offset) {
						return { offset: offset, element: row };
					}
					return closest;
				},
				{ offset: Number.NEGATIVE_INFINITY }
			).element;
		}
	});
</script>

<h2>Programs</h2>
{#if data.isAuthenticated}
	<div class="program-top-bar">
	<select name="concert-selector" id="concert-selector" on:change={filterByConcert}>
		{#each data.concert_times as concert}
			<option value="{concert.concert_series+'-'+concert.concert_number_in_series}">{concert.concert_series}
				#{concert.concert_number_in_series} {concert.displayStartTime}</option>
		{/each}
		<option value="Waitlist">Waitlist NoTime</option>
		<option value="All">All</option>
	</select>
		<a href="/api/program/">Export to csv</a>
	</div>
	<table class="table" id="sortable-table">
		<thead>
		<tr>
			<th>Grab</th>
			<th>Concert Series</th>
			<th>Num in Series</th>
			<th>Musical Piece</th>
			<th>Composers</th>
			<th>Performer</th>
			<th>Grade/Age</th>
			<th>Accompanist</th>
			<th>Move</th>
		</tr>
		</thead>
		<tbody>
		{#each data.program as entry}
			{#if (entry.concertSeries === filterSeries
				&& entry.concertNumberInSeries === filterConcertNumber)
			|| (entry.concertSeries === filterSeries
				&& filterSeries === 'Waitlist')
			|| filterSeries === 'All'}
				<tr class="sortable-row" draggable={draggable}>
					<td data-id="{entry.id}">
						<button class="grab-button" draggable="true">☰</button>
					</td>
					<td>{entry.concertSeries}</td>
					<td>{entry.concertNumberInSeries}</td>
					<td>
						{#each entry.musicalTitles as piece}
							{piece.title}<br />
							{piece.movement}<br />
						{/each}
					</td>
					<td>
						{#each entry.musicalTitles as piece}
							{#each piece.composers as composer}
								{composer.printedName} {composer.yearsActive}<br />
							{/each}
							<br />
						{/each}
					</td>
					<td>Soloist on {entry.instrument}: {entry.performerName}</td>
					<td>{entry.grade}</td>
					<td>
						{#if (entry.accompanist !== '')}
							Pianist: {entry.accompanist}
						{/if}
					</td>
					<td>
						{#if (entry.concertSeries !== 'Concerto')}
							<select name="override-selector" on:change={forceMove}
											data-id="{entry.id}"
											data-performer-id="{entry.performerId}">
								<option value="" selected disabled>Mv</option>
								<option value="EastSide-1">E1</option>
								<option value="EastSide-2">E2</option>
								<option value="EastSide-3">E3</option>
								<option value="EastSide-4">E4</option>
								<option value="Waitlist-1">WL</option>
							</select>
						{/if}
					</td>
				</tr>
			{/if}
		{/each}
		</tbody>
	</table>
{:else}
	<h3 class="noauth">Not Authorized</h3>
{/if}