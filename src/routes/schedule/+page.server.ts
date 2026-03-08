import { fail } from '@sveltejs/kit';
import { type PerformerSearchResultsInterface, isNonEmptyString, year } from '$lib/server/common';
import {
	backfillAdjudicatedPiecesIfEmpty,
	ensureAutoSelectedPerformancePiece,
	fetchPerformancePieces,
	getPerformancePieceSelectionSummary,
	updateConcertPerformance
} from '$lib/server/db';
import { PerformerLookup } from '$lib/server/performerLookup';
import { ScheduleMapper } from '$lib/server/scheduleMapper';
import { ScheduleRepository } from '$lib/server/scheduleRepository';
import { ScheduleValidator } from '$lib/server/scheduleValidator';
import { SlotCatalog } from '$lib/server/slotCatalog';
import { getCachedTimeStamps, type ConcertRow } from '$lib/cache';
import type { ScheduleViewModel, Slot } from '$lib/types/schedule';

// Ensure a stable ordering of concert times for both rendering and form processing
async function getSortedConcertTimes(): Promise<ConcertRow[] | null> {
	const cached = getCachedTimeStamps();
	if (!cached) {
		return null;
	}

	return cached.data.slice().sort((a, b) => {
		if (a.concert_series === b.concert_series) {
			return a.concert_number_in_series - b.concert_number_in_series;
		}
		return a.concert_series.localeCompare(b.concert_series);
	});
}

function formatPerformancePiece(piece: { printed_name: string; movement: string | null }): string {
	return piece.printed_name;
}

export async function load({ url }) {
	/* console.log('[schedule.load] url=', url.toString()); */

	const performerLookup = PerformerLookup.create();
	let performerSearchResults: PerformerSearchResultsInterface = {
		status: 'ERROR',
		performer_id: 0,
		performer_name: '',
		musical_piece: '',
		lottery_code: 0,
		primary_class_code: 0,
		winner_class_display: '',
		concert_series: '',
		performance_id: 0,
		performance_duration: 0,
		performance_comment: null
	};
	let viewModel: ScheduleViewModel | null = null;
	let slotCount = 0;
	let slots: Slot[] = [];
	let performancePieces: Array<{
		musical_piece_id: number;
		printed_name: string;
		movement: string | null;
		is_performance_piece: boolean;
	}> = [];
	let selectedPerformancePieceId: number | null = null;
	let performancePieceDisplay = '';
	let selectionRequired = false;

	const concertStartTimes = await getSortedConcertTimes();
	/*
	console.log(
		'[schedule.load] concertStartTimes?',
		!!concertStartTimes,
		'count=',
		concertStartTimes?.length
	);
	*/

	if (concertStartTimes == null) {
		return {
			status: 'NOTFOUND',
			performer_id: 0,
			performer_name: '',
			musical_piece: '',
			lottery_code: '',
			primary_class_code: 0,
			winner_class_display: '',
			concert_series: '',
			formValues: null,
			concertTimes: null,
			performance_id: 0,
			performance_duration: 0,
			performance_comment: null
		};
	}

	performerSearchResults = await performerLookup.lookupFromUrl(url);
	/* console.log('[schedule.load] performerSearchResults=', performerSearchResults); */

	if (performerSearchResults.status === 'OK') {
		const slotCatalog = await SlotCatalog.load(performerSearchResults.concert_series, year());
		slotCount = slotCatalog.slotCount;
		slots = slotCatalog.slots;

		if (slotCount > 0) {
			const scheduleRepository = new ScheduleRepository();
			try {
				const scheduleChoice = await scheduleRepository.fetchChoices(
					performerSearchResults.performer_id,
					performerSearchResults.concert_series,
					year()
				);
				viewModel = ScheduleMapper.toViewModel(slotCatalog.slots, scheduleChoice);
			} catch {
				console.error('Error performing fetchSchedule');
			}
		}

		const performanceId = performerSearchResults.performance_id;
		if (performanceId) {
			await backfillAdjudicatedPiecesIfEmpty(performanceId);
			await ensureAutoSelectedPerformancePiece(performanceId);

			const piecesResult = await fetchPerformancePieces(performanceId);
			const selectionSummary = await getPerformancePieceSelectionSummary(performanceId);
			performancePieces = piecesResult.rows.map((row) => ({
				musical_piece_id: row.musical_piece_id,
				printed_name: row.printed_name,
				movement: row.movement,
				is_performance_piece: row.is_performance_piece === true
			}));
			const selectedPiece = performancePieces.find((piece) => piece.is_performance_piece) ?? null;
			selectedPerformancePieceId = selectedPiece?.musical_piece_id ?? null;
			if (selectedPiece) {
				performancePieceDisplay = formatPerformancePiece(selectedPiece);
			}
			selectionRequired = selectionSummary.total > 1 && !selectedPerformancePieceId;
		}
		/*
		console.log(
			'[schedule.load] slotCount=',
			slotCount,
			'concert_series=',
			performerSearchResults.concert_series
		);
		*/
	}
	return {
		status: performerSearchResults.status,
		performer_id: performerSearchResults.performer_id,
		performer_name: performerSearchResults.performer_name,
		musical_piece: performancePieceDisplay || performerSearchResults.musical_piece,
		lottery_code: performerSearchResults.lottery_code,
		primary_class_code: performerSearchResults.primary_class_code,
		winner_class_display: performerSearchResults.winner_class_display,
		concert_series: performerSearchResults.concert_series,
		concertTimes: concertStartTimes,
		performance_id: performerSearchResults.performance_id,
		performance_duration: performerSearchResults.performance_duration,
		performance_comment: performerSearchResults.performance_comment,
		performance_pieces: performancePieces,
		selected_performance_piece_id: selectedPerformancePieceId,
		performance_piece_display: performancePieceDisplay,
		performance_piece_selection_required: selectionRequired,
		viewModel,
		slotCount,
		slots
	};
}

export const actions = {
	add: async ({ request }) => {
		const formData = await request.formData();

		const performerId = formData.get('performerId');
		const concertSeries = formData.get('concertSeries')
			? String(formData.get('concertSeries'))
			: null;
		const performanceId = formData.get('performanceId');
		const duration: number = formData.get('duration') ? Number(formData.get('duration')) : 0;
		const comment: string | null = formData.get('comment') ? String(formData.get('comment')) : null;

		if (
			performerId != null &&
			concertSeries != null &&
			isNonEmptyString(concertSeries) &&
			isNonEmptyString(performerId)
		) {
			const performerIdAsNumber = Number(performerId);
			if (!Number.isInteger(performerIdAsNumber)) {
				return fail(400, { submissionStatus: 'error', error: 'performer id must be an integer' });
			}

			if (performanceId == null) {
				return fail(400, {
					submissionStatus: 'error',
					error: 'performance id is required'
				});
			}

			const performanceIdAsNumber = Number(performanceId);
			if (!Number.isInteger(performanceIdAsNumber)) {
				return fail(400, {
					submissionStatus: 'error',
					error: 'performance id must be an integer'
				});
			}

			await ensureAutoSelectedPerformancePiece(performanceIdAsNumber);
			const selection = await getPerformancePieceSelectionSummary(performanceIdAsNumber);
			if (selection.total > 1 && selection.selected === 0) {
				return fail(400, {
					submissionStatus: 'error',
					error: 'Select a performance piece before submitting scheduling preferences.'
				});
			}
			// if this fails return some error??
			await updateConcertPerformance(performanceIdAsNumber, duration, comment);

			const slotCatalog = await SlotCatalog.load(concertSeries, year());
			if (slotCatalog.slotCount === 0) {
				return fail(400, { submissionStatus: 'error', error: 'No schedule slots available.' });
			}

			const scheduleRepository = new ScheduleRepository();
			const submission = ScheduleMapper.fromFormData(formData, {
				performerId: performerIdAsNumber,
				concertSeries,
				year: year(),
				slots: slotCatalog.slots
			});
			const validation = ScheduleValidator.validate(submission, slotCatalog.slotCount);
			if (!validation.valid) {
				return fail(400, { submissionStatus: 'error', error: validation.errors[0] });
			}

			await scheduleRepository.upsertChoices(submission);
			return { submissionStatus: 'success' };
		} else {
			// failed param test null or empty parameters
			return fail(400, {
				submissionStatus: 'error',
				error: 'performer id or concert series is required'
			});
		}

		try {
			// do work
		} catch (e) {
			return fail(500, { submissionStatus: 'error', error: (e as Error).message });
		}
	}
};
