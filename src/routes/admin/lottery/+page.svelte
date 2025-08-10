<script lang="ts">
	export let data;
	import { convertToEpochAge } from '$lib/clientUtils';
</script>

<h2>Performer Lottery</h2>
{#if data.isAuthenticated}
	<table class="table">
		<thead>
			<tr>
				{#each data.performer_fields as field}
					<th>{field}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each data.performers as performer_lottery}
				<tr class:lowemphasis={!!performer_lottery.first_choice_time}>
					<td class:with-star={!!performer_lottery.concert_chair_choice}
						>{performer_lottery.lookupcode}</td
					>
					<td>{performer_lottery.fullname}</td>
					<td>{convertToEpochAge(performer_lottery.epoch)}</td>
					<td>{performer_lottery.instrument}</td>
					<td>{performer_lottery.composer}</td>
					<td class="concerttime">{performer_lottery.first_choice_time}</td>
				</tr>
			{/each}
		</tbody>
	</table>
{:else}
	<h3 class="noauth">Not Authorized</h3>
{/if}
