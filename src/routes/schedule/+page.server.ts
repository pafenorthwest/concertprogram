import { fail, redirect } from '@sveltejs/kit';
import { type PerformerSearchResultsInterface, isNonEmptyString, year } from '$lib/server/common';
import { updateConcertPerformance } from '$lib/server/db';
import { PerformerLookup } from '$lib/server/performerLookup';
import { ScheduleMapper } from '$lib/server/scheduleMapper';
import { ScheduleRepository } from '$lib/server/scheduleRepository';
import { ScheduleValidator } from '$lib/server/scheduleValidator';
import { SlotCatalog } from '$lib/server/slotCatalog';
import { getCachedTimeStamps, type ConcertRow } from '$lib/cache';
import type { ScheduleViewModel, Slot } from '$lib/types/schedule';

// Ensure a stable ordering of concert times for both rendering and form processing
function getSortedConcertTimes(): ConcertRow[] | null {
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

export async function load({ url }) {
	const performerLookup = PerformerLookup.create();
	let performerSearchResults: PerformerSearchResultsInterface = {
		status: 'ERROR',
		performer_id: 0,
		performer_name: '',
		musical_piece: '',
		lottery_code: 0,
		concert_series: '',
		performance_id: 0,
		performance_duration: 0,
		performance_comment: null
	};
	let viewModel: ScheduleViewModel | null = null;
	let slotCount = 0;
	let slots: Slot[] = [];

	const concertStartTimes = getSortedConcertTimes();
	if (concertStartTimes == null) {
		return {
			status: 'NOTFOUND',
			performer_id: 0,
			performer_name: '',
			musical_piece: '',
			lottery_code: '',
			concert_series: '',
			formValues: null,
			concertTimes: null,
			performance_id: 0,
			performance_duration: 0,
			performance_comment: null
		};
	}

	performerSearchResults = await performerLookup.lookupFromUrl(url);
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
	}
	return {
		status: performerSearchResults.status,
		performer_id: performerSearchResults.performer_id,
		performer_name: performerSearchResults.performer_name,
		musical_piece: performerSearchResults.musical_piece,
		lottery_code: performerSearchResults.lottery_code,
		concert_series: performerSearchResults.concert_series,
		concertTimes: concertStartTimes,
		performance_id: performerSearchResults.performance_id,
		performance_duration: performerSearchResults.performance_duration,
		performance_comment: performerSearchResults.performance_comment,
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
				return fail(400, { error: 'performer id must be an integer' });
			}

			// update duration and comment across all concert series
			if (performanceId != null) {
				const performanceIdAsNumber = Number(performanceId);
				// if this fails return some error??
				await updateConcertPerformance(performanceIdAsNumber, duration, comment);
			}

			const slotCatalog = await SlotCatalog.load(concertSeries, year());
			if (slotCatalog.slotCount === 0) {
				return fail(400, { error: 'No schedule slots available.' });
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
				return fail(400, { error: validation.errors[0] });
			}

			await scheduleRepository.upsertChoices(submission);
			throw redirect(303, '/');
		} else {
			// failed param test null or empty parameters
			return fail(400, { error: 'performer id or concert series is required' });
		}

		try {
			// do work
		} catch (e) {
			return fail(500, { error: (e as Error).message });
		}
	}
};
