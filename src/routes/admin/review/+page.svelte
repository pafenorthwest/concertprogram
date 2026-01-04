<script lang="ts">
	import { onMount } from 'svelte';
	import { divisionTags, pieceCategories, type DivisionTag, type PieceCategory } from '$lib/constants/review';

	type ReviewQueueItem = {
		id: number;
		printed_name: string;
		all_movements: string | null;
		first_contributor_id: number;
		first_contributor_name: string | null;
		second_contributor_id: number | null;
		third_contributor_id: number | null;
		imslp_url: string | null;
		comments: string | null;
		flag_for_discussion: boolean;
		discussion_notes: string | null;
		is_not_appropriate: boolean;
		updated_at: string;
		categories: PieceCategory[];
		division_tags: DivisionTag[];
		is_untagged: boolean;
	};

	let queueItems: ReviewQueueItem[] = [];
	let division: DivisionTag = divisionTags[0];
	let selectedId: number | null = null;
	let composerFilter = '';
	let flaggedOnly = false;
	let isLoading = false;
	let errorMessage = '';

	let printedName = '';
	let allMovements = '';
	let firstContributorId = '';
	let secondContributorId = '';
	let thirdContributorId = '';
	let imslpUrl = '';
	let comments = '';
	let flagForDiscussion = false;
	let discussionNotes = '';
	let selectedCategories: PieceCategory[] = [];
	let selectedDivisionTags: DivisionTag[] = [];

	$: filteredItems = queueItems.filter((item) => {
		if (flaggedOnly && !item.flag_for_discussion) {
			return false;
		}
		if (composerFilter.trim().length > 0) {
			const composerName = item.first_contributor_name ?? '';
			return composerName.toLowerCase().includes(composerFilter.toLowerCase());
		}
		return true;
	});

	$: selectedItem = queueItems.find((item) => item.id === selectedId) ?? null;

	function setFormFromItem(item: ReviewQueueItem) {
		printedName = item.printed_name;
		allMovements = item.all_movements ?? '';
		firstContributorId = String(item.first_contributor_id ?? '');
		secondContributorId = item.second_contributor_id ? String(item.second_contributor_id) : '';
		thirdContributorId = item.third_contributor_id ? String(item.third_contributor_id) : '';
		imslpUrl = item.imslp_url ?? '';
		comments = item.comments ?? '';
		flagForDiscussion = item.flag_for_discussion;
		discussionNotes = item.discussion_notes ?? '';
		selectedCategories = item.categories ?? [];
		selectedDivisionTags = item.division_tags ?? [];
	}

	function toNullableNumber(value: string): number | null {
		if (!value) {
			return null;
		}
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : null;
	}

	async function loadQueue() {
		isLoading = true;
		errorMessage = '';
		try {
			const response = await fetch(`/api/review/queue?division=${encodeURIComponent(division)}`);
			if (!response.ok) {
				const payload = await response.json();
				throw new Error(payload?.reason ?? 'Failed to load queue');
			}
			const payload = await response.json();
			queueItems = payload.items ?? [];
			if (queueItems.length > 0) {
				selectItem(queueItems[0].id);
			} else {
				selectedId = null;
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to load queue';
			errorMessage = message;
		} finally {
			isLoading = false;
		}
	}

	function selectItem(id: number) {
		selectedId = id;
		const item = queueItems.find((entry) => entry.id === id);
		if (item) {
			setFormFromItem(item);
		}
	}

	function updateQueueItem(id: number, updates: Partial<ReviewQueueItem>) {
		queueItems = queueItems.map((item) => (item.id === id ? { ...item, ...updates } : item));
	}

	function toggleCategory(category: PieceCategory) {
		if (category === 'Not Appropriate') {
			selectedCategories = selectedCategories.includes('Not Appropriate') ? [] : ['Not Appropriate'];
			return;
		}
		const withoutNotAppropriate = selectedCategories.filter((value) => value !== 'Not Appropriate');
		if (withoutNotAppropriate.includes(category)) {
			selectedCategories = withoutNotAppropriate.filter((value) => value !== category);
		} else {
			selectedCategories = [...withoutNotAppropriate, category];
		}
	}

	function toggleDivisionTag(tag: DivisionTag) {
		if (selectedDivisionTags.includes(tag)) {
			selectedDivisionTags = selectedDivisionTags.filter((value) => value !== tag);
		} else {
			selectedDivisionTags = [...selectedDivisionTags, tag];
		}
	}

	async function saveDetails() {
		if (!selectedId) {
			return;
		}
		const parsedFirstContributorId = toNullableNumber(firstContributorId);
		if (!parsedFirstContributorId) {
			errorMessage = 'First contributor ID is required.';
			return;
		}
		const payload = {
			printed_name: printedName,
			all_movements: allMovements.trim().length > 0 ? allMovements : null,
			first_contributor_id: parsedFirstContributorId,
			second_contributor_id: toNullableNumber(secondContributorId),
			third_contributor_id: toNullableNumber(thirdContributorId),
			imslp_url: imslpUrl.trim().length > 0 ? imslpUrl : null,
			comments: comments.trim().length > 0 ? comments : null,
			flag_for_discussion: flagForDiscussion,
			discussion_notes: discussionNotes.trim().length > 0 ? discussionNotes : null
		};

		const response = await fetch(`/api/review/pieces/${selectedId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});

		if (!response.ok) {
			const payload = await response.json();
			errorMessage = payload?.reason ?? 'Failed to update piece';
			return;
		}

		updateQueueItem(selectedId, {
			printed_name: printedName,
			all_movements: allMovements,
			first_contributor_id: parsedFirstContributorId,
			second_contributor_id: toNullableNumber(secondContributorId),
			third_contributor_id: toNullableNumber(thirdContributorId),
			imslp_url: imslpUrl,
			comments,
			flag_for_discussion: flagForDiscussion,
			discussion_notes: discussionNotes
		});
	}

	async function saveCategories() {
		if (!selectedId) {
			return;
		}
		const response = await fetch(`/api/review/pieces/${selectedId}/categories`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ categories: selectedCategories })
		});
		if (!response.ok) {
			const payload = await response.json();
			errorMessage = payload?.reason ?? 'Failed to update categories';
			return;
		}
		updateQueueItem(selectedId, { categories: selectedCategories });
	}

	async function saveDivisionTags() {
		if (!selectedId) {
			return;
		}
		const response = await fetch(`/api/review/pieces/${selectedId}/division-tags`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ division_tags: selectedDivisionTags })
		});
		if (!response.ok) {
			const payload = await response.json();
			errorMessage = payload?.reason ?? 'Failed to update division tags';
			return;
		}
		updateQueueItem(selectedId, { division_tags: selectedDivisionTags, is_untagged: selectedDivisionTags.length === 0 });
	}

	async function markComplete() {
		if (!selectedId) {
			return;
		}
		const response = await fetch(`/api/review/pieces/${selectedId}/complete`, { method: 'POST' });
		if (!response.ok) {
			const payload = await response.json();
			errorMessage = payload?.reason ?? 'Failed to mark complete';
			return;
		}
		queueItems = queueItems.filter((item) => item.id !== selectedId);
		selectedId = queueItems.length > 0 ? queueItems[0].id : null;
		if (selectedId) {
			const nextItem = queueItems.find((item) => item.id === selectedId);
			if (nextItem) {
				setFormFromItem(nextItem);
			}
		}
	}

	onMount(loadQueue);
</script>

<section class="review-page">
	<header class="review-header">
		<div>
			<h1>Musical Piece Review</h1>
			<p>Review pieces by division, update metadata, and mark reviews complete.</p>
		</div>
		<div class="review-controls">
			<label>
				Division
				<select bind:value={division} on:change={loadQueue}>
					{#each divisionTags as tag}
						<option value={tag}>{tag}</option>
					{/each}
				</select>
			</label>
			<label>
				Composer
				<input type="text" placeholder="Filter by composer" bind:value={composerFilter} />
			</label>
			<label class="checkbox">
				<input type="checkbox" bind:checked={flaggedOnly} />
				Flagged only
			</label>
		</div>
	</header>

	{#if errorMessage}
		<p class="error">{errorMessage}</p>
	{/if}

	<div class="review-body">
		<aside class="queue">
			<h2>Queue {isLoading ? '(Loading...)' : ''}</h2>
			{#if filteredItems.length === 0 && !isLoading}
				<p class="empty">No pieces in this queue.</p>
			{:else}
				<ul>
					{#each filteredItems as item}
						<li class:selected={item.id === selectedId}>
							<button type="button" on:click={() => selectItem(item.id)}>
								<span class="title">
									{item.printed_name}
									{#if item.is_untagged}
										<span class="untagged">*</span>
									{/if}
								</span>
								<span class="subtitle">{item.first_contributor_name ?? 'Unknown composer'}</span>
								<span class="meta">
									{#if item.flag_for_discussion}
										<span class="flag">💬 Discussion</span>
									{/if}
								</span>
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</aside>

		<section class="editor">
			{#if !selectedItem}
				<p>Select a piece to review.</p>
			{:else}
				<div class="editor-header">
					<h2>Review: {selectedItem.printed_name}</h2>
					<button type="button" class="complete" on:click={markComplete}>Mark Complete</button>
				</div>

				<div class="editor-grid">
					<div class="card">
						<h3>Piece Details</h3>
						<label>
							Printed name
							<input type="text" bind:value={printedName} />
						</label>
						<label>
							Movements
							<input type="text" bind:value={allMovements} />
						</label>
						<label>
							First contributor ID
							<input type="number" min="1" bind:value={firstContributorId} />
						</label>
						<label>
							Second contributor ID
							<input type="number" min="1" bind:value={secondContributorId} />
						</label>
						<label>
							Third contributor ID
							<input type="number" min="1" bind:value={thirdContributorId} />
						</label>
						<label>
							IMSLP URL
							<input type="url" bind:value={imslpUrl} />
						</label>
						<label>
							Comments
							<textarea rows="3" bind:value={comments}></textarea>
						</label>
						<button type="button" on:click={saveDetails}>Save details</button>
					</div>

					<div class="card">
						<h3>Categories</h3>
						<div class="checkbox-grid">
							{#each pieceCategories as category}
								<label class="checkbox">
									<input
										type="checkbox"
										checked={selectedCategories.includes(category)}
										on:change={() => toggleCategory(category)}
									/>
									{category}
								</label>
							{/each}
						</div>
						<p class="hint">Selecting “Not Appropriate” clears other categories.</p>
						<button type="button" on:click={saveCategories}>Save categories</button>
					</div>

					<div class="card">
						<h3>Division Tags</h3>
						<div class="checkbox-grid">
							{#each divisionTags as tag}
								<label class="checkbox">
									<input
										type="checkbox"
										checked={selectedDivisionTags.includes(tag)}
										on:change={() => toggleDivisionTag(tag)}
									/>
									{tag}
								</label>
							{/each}
						</div>
						<p class="hint">Leaving tags empty shows the piece in all divisions (marked with *).</p>
						<button type="button" on:click={saveDivisionTags}>Save division tags</button>
					</div>

					<div class="card">
						<h3>Discussion</h3>
						<label class="checkbox">
							<input type="checkbox" bind:checked={flagForDiscussion} />
							Flag for discussion
						</label>
						<label>
							Discussion notes
							<textarea rows="4" bind:value={discussionNotes}></textarea>
						</label>
						<button type="button" on:click={saveDetails}>Save discussion</button>
					</div>
				</div>
			{/if}
		</section>
	</div>
</section>

<style>
	.review-page {
		padding: 24px;
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.review-header {
		display: flex;
		justify-content: space-between;
		gap: 20px;
		align-items: flex-start;
		flex-wrap: wrap;
	}

	.review-controls {
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
	}

	input,
	textarea,
	select {
		padding: 8px 10px;
		border-radius: 6px;
		border: 1px solid #cbd5f5;
		font-size: 14px;
	}

	.review-body {
		display: grid;
		grid-template-columns: 280px 1fr;
		gap: 20px;
	}

	.queue {
		border: 1px solid #e0e4f4;
		border-radius: 10px;
		padding: 16px;
		background: #f8f9ff;
	}

	.queue ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.queue li button {
		width: 100%;
		text-align: left;
		border: none;
		background: #fff;
		padding: 10px;
		border-radius: 8px;
		box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
		display: flex;
		flex-direction: column;
		gap: 4px;
		cursor: pointer;
	}

	.queue li.selected button {
		border: 2px solid #4f46e5;
	}

	.title {
		font-weight: 700;
		display: flex;
		gap: 6px;
		align-items: center;
	}

	.subtitle {
		font-size: 13px;
		color: #475569;
	}

	.untagged {
		color: #dc2626;
		font-weight: 700;
	}

	.flag {
		font-size: 12px;
		color: #b45309;
		font-weight: 600;
	}

	.editor {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.editor-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.complete {
		background: #4f46e5;
		color: #fff;
		border: none;
		border-radius: 6px;
		padding: 8px 14px;
		cursor: pointer;
	}

	.editor-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 16px;
	}

	.card {
		border: 1px solid #e0e4f4;
		border-radius: 10px;
		padding: 16px;
		background: #fff;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.checkbox-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 8px;
	}

	.checkbox {
		flex-direction: row;
		align-items: center;
		gap: 8px;
		font-weight: 500;
	}

	.hint {
		font-size: 12px;
		color: #64748b;
	}

	.error {
		color: #b91c1c;
		font-weight: 600;
	}

	.empty {
		color: #64748b;
	}

	@media (max-width: 900px) {
		.review-body {
			grid-template-columns: 1fr;
		}
	}
</style>
