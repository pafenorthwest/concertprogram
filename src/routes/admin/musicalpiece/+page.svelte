<script>
	import { enhance } from '$app/forms';

	let disableStatus = false;
	export let data;
	let editing = {};

	const normalizeText = (value) => {
		if (value == null) return null;
		const trimmed = value.toString().trim();
		return trimmed.length ? trimmed : null;
	};

	const normalizeNumber = (value) => {
		if (value === '' || value === null || value === undefined) return null;
		const parsed = Number(value);
		return Number.isNaN(parsed) ? null : parsed;
	};

	async function handleSave(musicalPiece) {
		try {
			const payload = {
				...musicalPiece,
				first_contributor_id: Number(musicalPiece.first_contributor_id),
				second_contributor_id: normalizeNumber(musicalPiece.second_contributor_id),
				third_contributor_id: normalizeNumber(musicalPiece.third_contributor_id),
				all_movements: normalizeText(musicalPiece.all_movements),
				imslp_url: normalizeText(musicalPiece.imslp_url),
				comments: normalizeText(musicalPiece.comments),
				flag_for_discussion: !!musicalPiece.flag_for_discussion,
				discussion_notes: normalizeText(musicalPiece.discussion_notes),
				is_not_appropriate: !!musicalPiece.is_not_appropriate
			};
			const response = await fetch(`/api/musicalpiece/${musicalPiece.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(payload)
			});
			if (!response.ok) {
				throw new Error('Failed to save Musical Piece');
			}
			const index = data.musicalPieces.findIndex((c) => c.id === musicalPiece.id);
			data.musicalPieces[index] = {
				...payload,
				id: musicalPiece.id,
				updated_at: new Date().toISOString()
			};
			editing = {};
		} catch (error) {
			console.error('Error saving Musical Piece:', error);
		}
	}

	function handleEdit(musicalPiece) {
		editing = { ...musicalPiece };
	}

	function handleInputChange(event, field) {
		editing = { ...editing, [field]: event.target.value };
	}

	function handleCheckboxChange(event, field) {
		editing = { ...editing, [field]: event.target.checked };
	}
</script>

<h2>Musical Pieces</h2>
{#if data.isAuthenticated}
	<div class="lookup-form">
		<h3>Add</h3>
		<form id="musicalPiece" class="inline-add" method="POST" action="?/add" use:enhance>
			<div class="form-group">
				<label for="printedName">Printed Name:</label>
				<input type="text" id="printedName" name="printedName" maxlength="256" required />
				<label for="firstComposerId">First Composer Id:</label>
				<input
					type="number"
					id="firstComposerId"
					name="firstComposerId"
					min="1"
					maxlength="5"
					required
				/>
				<label for="allMovements">All Movements:</label>
				<input type="text" id="allMovements" name="allMovements" maxlength="256" />
				<label for="secondComposerId">Second Composer Id:</label>
				<input type="number" id="secondComposerId" name="secondComposerId" maxlength="5" min="1" />
				<label for="thirdComposerId">Third Composer Id:</label>
				<input type="number" id="thirdComposerId" name="thirdComposerId" maxlength="5" min="1" />
				<label for="imslpUrl">IMSLP Url:</label>
				<input type="url" id="imslpUrl" name="imslpUrl" maxlength="512" />
				<label for="comments">Comments:</label>
				<textarea id="comments" name="comments" maxlength="1000"></textarea>
				<label class="checkbox-label" for="flagForDiscussion">
					<input type="checkbox" id="flagForDiscussion" name="flagForDiscussion" /> Flag for Discussion
				</label>
				<label for="discussionNotes">Discussion Notes:</label>
				<textarea id="discussionNotes" name="discussionNotes" maxlength="1000"></textarea>
				<label class="checkbox-label" for="isNotAppropriate">
					<input type="checkbox" id="isNotAppropriate" name="isNotAppropriate" /> Not Appropriate
				</label>
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
				{#each data.musical_piece_fields as field}
					<th>{field}</th>
				{/each}
				<th>Edit</th>
				<th>Delete</th>
			</tr>
		</thead>
		<tbody>
			{#each data.musicalPieces as musicalPiece}
				<tr>
					<td>{musicalPiece.id}</td>
					<td>
						{#if editing.id === musicalPiece.id}
							<input
								type="text"
								value={editing.printed_name}
								on:input={(event) => handleInputChange(event, 'printed_name')}
							/>
						{:else}
							{musicalPiece.printed_name}
						{/if}
					</td>
					<td>
						{#if editing.id === musicalPiece.id}
							<input
								type="number"
								value={editing.first_contributor_id}
								on:input={(event) => handleInputChange(event, 'first_contributor_id')}
							/>
						{:else}
							{musicalPiece.first_contributor_id}
						{/if}
					</td>
					<td>
						{#if editing.id === musicalPiece.id}
							<input
								type="text"
								value={editing.all_movements}
								on:input={(event) => handleInputChange(event, 'all_movements')}
							/>
						{:else}
							{musicalPiece.all_movements}
						{/if}
					</td>
					<td>
						{#if editing.id === musicalPiece.id}
							<input
								type="number"
								value={editing.second_contributor_id}
								on:input={(event) => handleInputChange(event, 'second_contributor_id')}
							/>
						{:else}
							{musicalPiece.second_contributor_id}
						{/if}
					</td>
					<td>
						{#if editing.id === musicalPiece.id}
							<input
								type="number"
								value={editing.third_contributor_id}
								on:input={(event) => handleInputChange(event, 'third_contributor_id')}
							/>
						{:else}
							{musicalPiece.third_contributor_id}
						{/if}
					</td>
					<td>
						{#if editing.id === musicalPiece.id}
							<input
								type="url"
								value={editing.imslp_url ?? ''}
								on:input={(event) => handleInputChange(event, 'imslp_url')}
							/>
						{:else}
							{musicalPiece.imslp_url}
						{/if}
					</td>
					<td>
						{#if editing.id === musicalPiece.id}
							<textarea
								value={editing.comments ?? ''}
								on:input={(event) => handleInputChange(event, 'comments')}
							></textarea>
						{:else}
							{musicalPiece.comments}
						{/if}
					</td>
					<td>
						{#if editing.id === musicalPiece.id}
							<input
								type="checkbox"
								checked={!!editing.flag_for_discussion}
								on:change={(event) => handleCheckboxChange(event, 'flag_for_discussion')}
							/>
						{:else}
							{musicalPiece.flag_for_discussion ? 'Yes' : 'No'}
						{/if}
					</td>
					<td>
						{#if editing.id === musicalPiece.id}
							<textarea
								value={editing.discussion_notes ?? ''}
								on:input={(event) => handleInputChange(event, 'discussion_notes')}
							></textarea>
						{:else}
							{musicalPiece.discussion_notes}
						{/if}
					</td>
					<td>
						{#if editing.id === musicalPiece.id}
							<input
								type="checkbox"
								checked={!!editing.is_not_appropriate}
								on:change={(event) => handleCheckboxChange(event, 'is_not_appropriate')}
							/>
						{:else}
							{musicalPiece.is_not_appropriate ? 'Yes' : 'No'}
						{/if}
					</td>
					<td>
						{musicalPiece.updated_at
							? new Date(musicalPiece.updated_at).toLocaleString()
							: ''}
					</td>
					<td>
						{#if editing.id === musicalPiece.id}
							<button on:click={() => handleSave(editing)}>
								<span class="material-symbols-outlined">save</span>
							</button>
							<button on:click={() => (editing = {})}>
								<span class="material-symbols-outlined">cancel</span>
							</button>
						{:else}
							<button on:click={() => handleEdit(musicalPiece)}>
								<span class="material-symbols-outlined">edit</span>
							</button>
						{/if}
					</td>
					<td class="slim-button">
						<form method="POST" action="?/delete" use:enhance>
							<input type="hidden" name="musicalPieceId" value={musicalPiece.id} />
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
