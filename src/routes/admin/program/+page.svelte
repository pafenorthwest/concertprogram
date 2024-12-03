<script>
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';

	export let data;
	let draggable = true

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

	onMount(() => {
		const table = document.getElementById("sortable-table");
		const tbody = table.querySelector("tbody");
		let draggingRow = null;

		tbody.addEventListener("dragstart", (e) => {
			if (e.target.closest("tr")) {
				draggingRow = e.target.closest("tr");
				setTimeout(() => draggingRow.classList.add("dragging"), 0);
			}
		});

		tbody.addEventListener("dragend", () => {
			if (draggingRow) {
				draggingRow.classList.remove("dragging");
				draggingRow = null;
			}
			// get all rows to run number order
			const rows = tbody.querySelectorAll("tr.sortable-row");
			for (let i = 0; i < rows.length; i++) {
				const keyCell = rows[i].querySelector('td[data-id]')
				const orderCell = rows[i].querySelector('td.order-cell')
				if (keyCell) {
					const performanceId = Number(keyCell.getAttribute("data-id"));
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

		tbody.addEventListener("dragover", (e) => {
			e.preventDefault();
			const draggingOver = getDragAfterRow(tbody, e.clientY);
			if (draggingOver) {
				tbody.insertBefore(draggingRow, draggingOver);
			} else {
				tbody.appendChild(draggingRow);
			}
		});

		function getDragAfterRow(container, y) {
			const rows = [...container.querySelectorAll(".sortable-row:not(.dragging)")];
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
	<div class="right-corner-form">
		<form id="limit" method="POST" action="?/updateseats" use:enhance>
			<label for="seats">seats:</label>
			<input type="text" id="seats" name="seats" maxlength="2" required>
			<button type="submit">rebuild</button>
		</form>
	</div>
	<select name="concert-selector" id="concert-selector">
		{#each data.concert_times as concert}
			<option value="{concert.concert_series+'-'+concert.concert_number_in_series}">{concert.concert_series}
				#{concert.concert_number_in_series} {concert.displayStartTime}</option>
		{/each}
		<option value="Waitlist">Waitlist NoTime</option>
		<option value="All">All</option>
	</select>
	<table class="table" id="sortable-table">
		<thead>
		<tr>
			<th>Grab</th>
			<th>performance id</th>
			<th>performer id</th>
			<th>concert series</th>
			<th>concert number</th>
			<th>order</th>
			<th>lottery</th>
		</tr>
		</thead>
		<tbody>
		{#each data.program as entry}
			<tr class="sortable-row" draggable={draggable}>
				<td><button class="grab-button" draggable="true">☰</button></td>
				<td data-id="{entry.id}">{entry.id}</td>
				<td>{entry.performerId}</td>
				<td>{entry.concertSeries}</td>
				<td>{entry.concertNumberInSeries}</td>
				<td class="order-cell">{entry.order}</td>
				<td>{entry.lottery}</td>
			</tr>
		{/each}
		</tbody>
	</table>
{:else}
	<h3 class="noauth">Not Authorized</h3>
{/if}