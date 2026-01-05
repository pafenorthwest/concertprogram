<script lang="ts">
	import { onMount } from 'svelte';
	import {
		divisionTags,
		pieceCategories,
		type DivisionTag,
		type PieceCategory
	} from '$lib/constants/review';
	import type { PageData } from './$types';

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

	type FirstContributorOption = PageData['contributors'][number] & { display_label: string };

	export let data: PageData;

	const contributorOptions: FirstContributorOption[] = (data?.contributors ?? []).map(
		(contributor) => ({
			...contributor,
			display_label:
				contributor.display_label ??
				`${contributor.role ? `${contributor.role}: ` : ''}${contributor.full_name}${
					contributor.id ? ` (#${contributor.id})` : ''
				}`
		})
	);

	let queueItems: ReviewQueueItem[] = [];
	let division: DivisionTag = divisionTags[0];
	let selectedId: number | null = null;
	let contributorFilter = '';
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
	let isDetailsModalOpen = false;
	let isDiscussionOpen = false;
	let categorySaveStatus: 'idle' | 'saving' | 'saved' | 'error' = 'idle';
	let categorySaveTimeout: ReturnType<typeof setTimeout> | null = null;

	let divisionSaveStatus: 'idle' | 'saving' | 'saved' | 'error' = 'idle';
	let divisionSaveTimeout: ReturnType<typeof setTimeout> | null = null;
	const divisionSaveDelay = 500; // optional for autosave

	const categorySaveDelay = 500;

	let selectedFirstContributor: FirstContributorOption | null = null;
	let selectedSecondContributor: FirstContributorOption | null = null;
	let selectedThirdContributor: FirstContributorOption | null = null;
	let secondContributorName = '';
	let thirdContributorName = '';
	let secondSlotManuallyAdded = false;
	let thirdSlotManuallyAdded = false;
	$: showSecondContributor = Boolean(secondContributorId) || secondSlotManuallyAdded;
	$: showThirdContributor =
		(Boolean(thirdContributorId) || thirdSlotManuallyAdded) && showSecondContributor;
	$: {
		if (!showSecondContributor) {
			thirdContributorId = '';
			thirdSlotManuallyAdded = false;
		}
	}

	$: filteredItems = queueItems.filter((item) => {
		if (flaggedOnly && !item.flag_for_discussion) {
			return false;
		}
		if (contributorFilter.trim().length > 0) {
			const contributorName = item.first_contributor_name ?? '';
			return contributorName.toLowerCase().includes(contributorFilter.toLowerCase());
		}
		return true;
	});

	$: selectedItem = queueItems.find((item) => item.id === selectedId) ?? null;
	$: selectedFirstContributor =
		contributorOptions.find((contributor) => String(contributor.id) === firstContributorId) ?? null;
	$: contributorName =
		selectedFirstContributor?.display_label ??
		(selectedItem?.first_contributor_name && firstContributorId
			? `${selectedItem.first_contributor_name} (#${firstContributorId})`
			: (selectedItem?.first_contributor_name ??
				(firstContributorId ? `Contributor #${firstContributorId}` : '')));
	$: selectedSecondContributor =
		contributorOptions.find((contributor) => String(contributor.id) === secondContributorId) ??
		null;
	$: secondContributorName =
		selectedSecondContributor?.display_label ??
		(secondContributorId ? `Contributor #${secondContributorId}` : '');
	$: selectedThirdContributor =
		contributorOptions.find((contributor) => String(contributor.id) === thirdContributorId) ?? null;
	$: thirdContributorName =
		selectedThirdContributor?.display_label ??
		(thirdContributorId ? `Contributor #${thirdContributorId}` : '');

	$: updatedAtLabel = selectedItem ? formatUpdatedAt(selectedItem.updated_at) : '';

	function formatUpdatedAt(value: string): string {
		const parsed = new Date(value);
		if (Number.isNaN(parsed.getTime())) {
			return 'Unknown';
		}
		return parsed.toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function setFormFromItem(item: ReviewQueueItem) {
		printedName = item.printed_name;
		allMovements = item.all_movements ?? '';
		firstContributorId = String(item.first_contributor_id ?? '');
		secondContributorId = item.second_contributor_id ? String(item.second_contributor_id) : '';
		thirdContributorId = item.third_contributor_id ? String(item.third_contributor_id) : '';
		secondSlotManuallyAdded = Boolean(item.second_contributor_id);
		thirdSlotManuallyAdded = Boolean(item.third_contributor_id);
		imslpUrl = item.imslp_url ?? '';
		comments = item.comments ?? '';
		flagForDiscussion = item.flag_for_discussion;
		discussionNotes = item.discussion_notes ?? '';
		selectedCategories = item.categories ?? [];
		selectedDivisionTags = item.division_tags ?? [];
		isDetailsModalOpen = false;
		isDiscussionOpen = false;
		categorySaveStatus = 'idle';
		if (categorySaveTimeout) {
			clearTimeout(categorySaveTimeout);
			categorySaveTimeout = null;
		}
		divisionSaveStatus = 'idle';
		if (divisionSaveTimeout) {
			clearTimeout(divisionSaveTimeout);
			divisionSaveTimeout = null;
		}
	}

	function normalizeCategories(value: unknown): PieceCategory[] {
		if (!Array.isArray(value)) {
			if (import.meta.env.DEV && value != null) {
				console.warn('Expected categories to be an array; received:', value);
			}
			return [];
		}

		return value.filter(
			(category): category is PieceCategory =>
				typeof category === 'string' && pieceCategories.includes(category as PieceCategory)
		);
	}

	function normalizeDivisionTags(value: unknown): DivisionTag[] {
		if (!Array.isArray(value)) {
			if (import.meta.env.DEV && value != null) {
				console.warn('Expected division_tags to be an array; received:', value);
			}
			return [];
		}

		return value.filter(
			(tag): tag is DivisionTag =>
				typeof tag === 'string' && divisionTags.includes(tag as DivisionTag)
		);
	}

	function normalizeQueueItem(item: ReviewQueueItem): ReviewQueueItem {
		const normalizedCategories = normalizeCategories(item.categories);
		const normalizedDivisionTags = normalizeDivisionTags(item.division_tags);

		// Guardrail: keep is_untagged logically consistent if payload is off.
		const isUntagged =
			typeof item.is_untagged === 'boolean'
				? item.is_untagged
				: normalizedDivisionTags.length === 0;

		return {
			...item,
			categories: normalizedCategories,
			division_tags: normalizedDivisionTags,
			is_untagged: isUntagged
		};
	}

	function toNullableNumber(value: string): number | null {
		if (!value) {
			return null;
		}
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : null;
	}

	function addContributorSlot() {
		if (!showSecondContributor) {
			secondSlotManuallyAdded = true;
			return;
		}
		if (!showThirdContributor) {
			thirdSlotManuallyAdded = true;
		}
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
			queueItems = (payload.items ?? []).map((item: ReviewQueueItem) => normalizeQueueItem(item));
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
			selectedCategories = selectedCategories.includes('Not Appropriate')
				? []
				: ['Not Appropriate'];
			scheduleCategorySave();
			return;
		}
		const withoutNotAppropriate = selectedCategories.filter((value) => value !== 'Not Appropriate');
		if (withoutNotAppropriate.includes(category)) {
			selectedCategories = withoutNotAppropriate.filter((value) => value !== category);
		} else {
			selectedCategories = [...withoutNotAppropriate, category];
		}
		scheduleCategorySave();
	}

	function scheduleCategorySave() {
		if (!selectedId) {
			return;
		}
		categorySaveStatus = 'saving';
		if (categorySaveTimeout) {
			clearTimeout(categorySaveTimeout);
		}
		categorySaveTimeout = setTimeout(async () => {
			const success = await saveCategories();
			categorySaveStatus = success ? 'saved' : 'error';
			if (success) {
				setTimeout(() => {
					categorySaveStatus = 'idle';
				}, 1500);
			}
		}, categorySaveDelay);
	}

	function toggleDivisionTag(tag: DivisionTag) {
		if (selectedDivisionTags.includes(tag)) {
			selectedDivisionTags = selectedDivisionTags.filter((value) => value !== tag);
		} else {
			selectedDivisionTags = [...selectedDivisionTags, tag];
		}
		// Optional autosave:
		scheduleDivisionSave();
	}

	function scheduleDivisionSave() {
		if (!selectedId) return;

		divisionSaveStatus = 'saving';
		if (divisionSaveTimeout) clearTimeout(divisionSaveTimeout);

		divisionSaveTimeout = setTimeout(async () => {
			const success = await saveDivisionTags();
			divisionSaveStatus = success ? 'saved' : 'error';
			if (success) {
				setTimeout(() => (divisionSaveStatus = 'idle'), 1500);
			}
		}, divisionSaveDelay);
	}

	async function saveDetails(): Promise<boolean> {
		if (!selectedId) {
			return false;
		}
		const parsedFirstContributorId = toNullableNumber(firstContributorId);
		if (!parsedFirstContributorId) {
			errorMessage = 'First contributor selection is required.';
			return false;
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
			return false;
		}

		const updatedFirstContributorName =
			selectedFirstContributor?.display_label ?? selectedItem?.first_contributor_name ?? null;

		updateQueueItem(selectedId, {
			printed_name: printedName,
			all_movements: allMovements,
			first_contributor_id: parsedFirstContributorId,
			first_contributor_name: updatedFirstContributorName,
			second_contributor_id: toNullableNumber(secondContributorId),
			third_contributor_id: toNullableNumber(thirdContributorId),
			imslp_url: imslpUrl,
			comments,
			flag_for_discussion: flagForDiscussion,
			discussion_notes: discussionNotes
		});
		return true;
	}

	async function saveCategories(): Promise<boolean> {
		if (!selectedId) {
			return false;
		}
		const response = await fetch(`/api/review/pieces/${selectedId}/categories`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ categories: selectedCategories })
		});
		if (!response.ok) {
			const payload = await response.json();
			errorMessage = payload?.reason ?? 'Failed to update categories';
			return false;
		}
		updateQueueItem(selectedId, { categories: selectedCategories });
		return true;
	}

	async function handleSaveDivisionTagsInline() {
		errorMessage = '';
		divisionSaveStatus = 'saving';
		const success = await saveDivisionTags();
		divisionSaveStatus = success ? 'saved' : 'error';
		if (success) {
			setTimeout(() => (divisionSaveStatus = 'idle'), 1500);
		}
	}

	async function handleSaveDiscussion() {
		errorMessage = '';
		const success = await saveDetails();
		if (!success) return;

		// Keep queue in sync
		if (selectedId) {
			updateQueueItem(selectedId, {
				flag_for_discussion: flagForDiscussion,
				discussion_notes: discussionNotes
			});
		}
	}

	async function saveDivisionTags(): Promise<boolean> {
		if (!selectedId) {
			return false;
		}
		const response = await fetch(`/api/review/pieces/${selectedId}/division-tags`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ division_tags: selectedDivisionTags })
		});
		if (!response.ok) {
			const payload = await response.json();
			errorMessage = payload?.reason ?? 'Failed to update division tags';
			return false;
		}
		updateQueueItem(selectedId, {
			division_tags: selectedDivisionTags,
			is_untagged: selectedDivisionTags.length === 0
		});
		return true;
	}

	async function handleSaveDetails() {
		errorMessage = '';
		const success = await saveDetails();
		if (success) {
			isDetailsModalOpen = false;
		}
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
				Contributor
				<input type="text" placeholder="Filter by contributor" bind:value={contributorFilter} />
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
								<span class="subtitle">{item.first_contributor_name ?? 'Unknown contributor'}</span>
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
				<div class="review-pane">
					<header class="pane-header">
						<p class="eyebrow">Reviewing</p>
						<h2>
							<button
								type="button"
								class="title-button"
								on:click={() => (isDetailsModalOpen = true)}
							>
								{selectedItem.printed_name}
							</button>
						</h2>
						<div class="meta-line">
							<button
								type="button"
								class="contributor-button"
								on:click={() => (isDetailsModalOpen = true)}
							>
								{contributorName || 'Unknown contributor'}
							</button>
							<span>•</span>
							<span>{selectedItem.imslp_url ? 'IMSLP ✓' : 'IMSLP: —'}</span>
							<span>•</span>
							<span>Updated {updatedAtLabel}</span>
						</div>
					</header>

					<div class="action-bar">
						<button type="button" class="complete" on:click={markComplete}>Mark Complete</button>
						<button
							type="button"
							class="ghost-button"
							class:active={flagForDiscussion}
							on:click={() => (flagForDiscussion = !flagForDiscussion)}
						>
							{flagForDiscussion ? 'Flagged for discussion' : 'Flag for discussion'}
						</button>
					</div>

					<section class="pane-card">
						<div class="card-header">
							<h3>Classification</h3>
							{#if categorySaveStatus === 'saving'}
								<span class="status">Saving…</span>
							{:else if categorySaveStatus === 'saved'}
								<span class="status saved">Saved ✓</span>
							{:else if categorySaveStatus === 'error'}
								<span class="status error">Save failed</span>
							{/if}
						</div>
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
						{#if selectedCategories.includes('Not Appropriate')}
							<p class="hint">Selecting “Not Appropriate” removes the piece from registration.</p>
						{/if}
					</section>

					<section class="pane-card">
						<div class="card-header">
							<h3>Details</h3>
							<button
								type="button"
								class="ghost-button"
								on:click={() => (isDetailsModalOpen = true)}
							>
								Edit details
							</button>
						</div>
						<dl class="summary-list">
							<div class="summary-row">
								<dt>Printed name</dt>
								<dd>{printedName || '—'}</dd>
							</div>
							<div class="summary-row">
								<dt>Movements</dt>
								<dd>{allMovements || '—'}</dd>
							</div>
							<div class="summary-row">
								<dt>First Contributor</dt>
								<dd>{contributorName || '—'}</dd>
							</div>
							{#if secondContributorId}
								<div class="summary-row">
									<dt>Second Contributor</dt>
									<dd>{secondContributorName || '—'}</dd>
								</div>
							{/if}
							{#if thirdContributorId}
								<div class="summary-row">
									<dt>Third Contributor</dt>
									<dd>{thirdContributorName || '—'}</dd>
								</div>
							{/if}
							<div class="summary-row">
								<dt>Division tags</dt>
								<dd>
									{selectedDivisionTags.length > 0
										? selectedDivisionTags.join(', ')
										: 'All divisions'}
								</dd>
							</div>

							<!-- Inline Division Tags editor (no popup) -->
							<div class="divider"></div>

							<div class="division-editor" aria-label="Division Tags Editor">
								<div class="division-editor-header">
									<div>
										<h4>Division Tags</h4>
										<p class="hint">
											Select one or more divisions. Leaving empty shows in all divisions.
										</p>
									</div>

									<div class="division-actions">
										{#if divisionSaveStatus === 'saving'}
											<span class="status">Saving…</span>
										{:else if divisionSaveStatus === 'saved'}
											<span class="status saved">Saved ✓</span>
										{:else if divisionSaveStatus === 'error'}
											<span class="status error">Save failed</span>
										{/if}

										<button
											type="button"
											class="ghost-button"
											on:click={handleSaveDivisionTagsInline}
										>
											Save divisions
										</button>
									</div>
								</div>

								<div class="pill-grid">
									{#each divisionTags as tag}
										<label class="pill" class:active={selectedDivisionTags.includes(tag)}>
											<input
												type="checkbox"
												checked={selectedDivisionTags.includes(tag)}
												on:change={() => toggleDivisionTag(tag)}
											/>
											<span>{tag}</span>
										</label>
									{/each}
								</div>
							</div>

							<div class="summary-row">
								<dt>Comments</dt>
								<dd>{comments || '—'}</dd>
							</div>
						</dl>
					</section>

					<details class="pane-card" bind:open={isDiscussionOpen}>
						<summary class="discussion-summary">
							<span>Discussion</span>
							<span class="summary-status">
								{flagForDiscussion ? 'Flagged' : 'Not flagged'}
							</span>
						</summary>
						<div class="discussion-body">
							<label class="checkbox">
								<input type="checkbox" bind:checked={flagForDiscussion} />
								Flag for discussion
							</label>
							<label>
								Notes
								<textarea rows="4" bind:value={discussionNotes}></textarea>
							</label>
							<button type="button" class="ghost-button" on:click={handleSaveDiscussion}>
								Save discussion
							</button>
						</div>
					</details>
				</div>

				{#if isDetailsModalOpen}
					<div class="modal-layer" role="presentation">
						<button
							type="button"
							class="modal-backdrop"
							aria-label="Close dialog"
							on:click={() => (isDetailsModalOpen = false)}
						/>
						<div class="modal" role="dialog" aria-modal="true" aria-label="Edit Piece Details">
							<header class="modal-header">
								<h3>Edit Piece Details</h3>
								<button
									type="button"
									class="ghost-button"
									on:click={() => (isDetailsModalOpen = false)}
								>
									✕
								</button>
							</header>
							<div class="modal-content">
								<label>
									Printed name
									<input type="text" bind:value={printedName} />
								</label>
								<label>
									Movements
									<input type="text" bind:value={allMovements} />
								</label>
								<label>
									First Contributor
									<select bind:value={firstContributorId}>
										<option value="">Select a contributor</option>
										{#each contributorOptions as contributor}
											<option value={String(contributor.id)}>
												{contributor.display_label}
											</option>
										{/each}
									</select>
								</label>
								{#if showSecondContributor}
									<label>
										Second Contributor
										<select bind:value={secondContributorId}>
											<option value="">None</option>
											{#each contributorOptions as contributor}
												<option value={String(contributor.id)}>
													{contributor.display_label}
												</option>
											{/each}
										</select>
									</label>
								{/if}
								{#if showThirdContributor}
									<label>
										Third Contributor
										<select bind:value={thirdContributorId}>
											<option value="">None</option>
											{#each contributorOptions as contributor}
												<option value={String(contributor.id)}>
													{contributor.display_label}
												</option>
											{/each}
										</select>
									</label>
								{/if}
								<button
									type="button"
									class="add-contributor"
									on:click={addContributorSlot}
									disabled={showSecondContributor && showThirdContributor}
								>
									+
								</button>
								<label>
									IMSLP URL
									<input type="url" bind:value={imslpUrl} />
								</label>
								<label>
									Comments
									<textarea rows="3" bind:value={comments}></textarea>
								</label>
							</div>
							<footer class="modal-footer">
								<button
									type="button"
									class="ghost-button"
									on:click={() => (isDetailsModalOpen = false)}
								>
									Cancel
								</button>
								<button type="button" class="complete" on:click={handleSaveDetails}>Save</button>
							</footer>
						</div>
					</div>
				{/if}
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

	.review-pane {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.pane-header {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.eyebrow {
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-size: 12px;
		color: #64748b;
		font-weight: 700;
		margin: 0;
	}

	.title-button,
	.contributor-button {
		background: none;
		border: none;
		padding: 0;
		font: inherit;
		color: #1e293b;
		cursor: pointer;
		text-align: left;
	}

	.title-button {
		font-size: 24px;
		font-weight: 700;
	}

	.meta-line {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		font-size: 14px;
		color: #475569;
	}

	.action-bar {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
		align-items: center;
		position: sticky;
		top: 12px;
		background: #fff;
		padding: 12px;
		border: 1px solid #e0e4f4;
		border-radius: 10px;
		z-index: 2;
		box-shadow: 0 8px 16px rgba(15, 23, 42, 0.08);
	}

	.complete {
		background: #4f46e5;
		color: #fff;
		border: none;
		border-radius: 6px;
		padding: 8px 14px;
		cursor: pointer;
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

	.ghost-button.active {
		background: #ede9fe;
		border-color: #818cf8;
		color: #312e81;
	}

	.add-contributor {
		background: #e2e8f0;
		border: 1px solid #cbd5e1;
		color: #0f172a;
		border-radius: 6px;
		padding: 6px 10px;
		font-weight: 700;
		cursor: pointer;
		width: fit-content;
	}

	.add-contributor:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.pane-card {
		border: 1px solid #e0e4f4;
		border-radius: 10px;
		padding: 16px;
		background: #fff;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
	}

	.status {
		font-size: 12px;
		color: #64748b;
		font-weight: 600;
	}

	.status.saved {
		color: #15803d;
	}

	.status.error {
		color: #b91c1c;
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

	.summary-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin: 0;
	}

	.summary-row {
		display: grid;
		grid-template-columns: minmax(140px, 200px) 1fr auto;
		align-items: center;
		gap: 12px;
	}

	.summary-row dt {
		font-weight: 600;
		color: #1e293b;
	}

	.summary-row dd {
		margin: 0;
		color: #475569;
	}

	.discussion-summary {
		display: flex;
		justify-content: space-between;
		align-items: center;
		cursor: pointer;
		font-weight: 600;
		color: #1e293b;
	}

	.summary-status {
		font-size: 12px;
		color: #64748b;
		font-weight: 600;
	}

	.discussion-body {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding-top: 12px;
	}

	.hint {
		font-size: 12px;
		color: #64748b;
	}

	.modal-layer {
		position: fixed;
		inset: 0;
		z-index: 10;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24px;
	}

	.modal-backdrop {
		position: absolute;
		inset: 0;
		background: rgba(15, 23, 42, 0.4);
		border: none;
		padding: 0;
		margin: 0;
		cursor: default;
	}

	.modal-backdrop:focus {
		outline: none;
	}

	.modal {
		position: relative; /* ensures it sits above the backdrop */
		z-index: 1;
		background: #fff;
		border-radius: 12px;
		width: min(640px, 100%);
		max-height: 90vh;
		overflow: auto;
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding: 20px;
		box-shadow: 0 24px 40px rgba(15, 23, 42, 0.2);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.modal-content {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
	}

	.error {
		color: #b91c1c;
		font-weight: 600;
	}

	.empty {
		color: #64748b;
	}
	.divider {
		height: 1px;
		background: #e0e4f4;
		margin: 12px 0;
	}

	.division-editor {
		border: 1px dashed #c7d2fe;
		border-radius: 10px;
		padding: 12px;
		background: #f3f4f6;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.division-editor-header {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		align-items: flex-start;
		flex-wrap: wrap;
	}

	.division-editor h4 {
		margin: 0;
		font-size: 14px;
		font-weight: 700;
		color: #1e293b;
	}

	.division-actions {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
	}

	.pill-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		background: #f3f4f6;
		padding: 8px;
	}

	.pill {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 8px;
		border-radius: 4px;
		border: 1px solid #c7d2fe;
		background: #ffffff;
		color: #1e293b;
		cursor: pointer;
		user-select: none;
		font-weight: 600;
		font-size: 13px;
	}

	.pill input {
		margin: 0;
	}

	.pill.active {
		background: #eef2ff;
		border-color: #818cf8;
		color: #312e81;
	}

	@media (max-width: 900px) {
		.review-body {
			grid-template-columns: 1fr;
		}

		.summary-row {
			grid-template-columns: 1fr;
			align-items: flex-start;
		}
	}
</style>
