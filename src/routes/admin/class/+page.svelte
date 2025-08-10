<script>
	import { enhance } from '$app/forms';
	export let data;
	let disableStatus = false;
</script>

<h2>Class Lottery</h2>
{#if data.isAuthenticated}
	<div class="lookup-form">
		<h3>Add</h3>
		<form id="class_lottery" class="inline-add" method="POST" action="?/add" use:enhance>
			<div class="form-group">
				<label for="class">Class Code:</label>
				<input type="text" id="class" name="class" maxlength="256" required />
				<label for="lottery">Lottery:</label>
				<input type="number" id="lottery" name="lottery" maxlength="25" step="1" required />
			</div>
			<div class="form-group">
				<button type="submit" disabled={disableStatus}>Submit</button>
			</div>
		</form>
	</div>
	<h3>Listing</h3>
	<table class="table">
		<thead>
			<tr>
				{#each data.class_lottery_fields as field}
					<th>{field}</th>
				{/each}
				<th>Edit</th>
				<th>Delete</th>
			</tr>
		</thead>
		<tbody>
			{#each data.classLottery as classLotteryRecord}
				<tr>
					<td>{classLotteryRecord.class_name}</td>
					<td>{classLotteryRecord.lottery}</td>
					<td class="slim-button">
						<form method="POST" action="?/delete" use:enhance>
							<input type="hidden" name="class" value={classLotteryRecord.class_name} />
							<button type="submit">
								<span class="material-symbols-outlined">delete</span>
							</button>
						</form>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
{:else}
	<h3 class="noauth">Not Authorized</h3>
{/if}
