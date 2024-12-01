import {fail, redirect} from '@sveltejs/kit';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import {
	type PerformerSearchResultsInterface,
	isNonEmptyString,
	pafe_series,
	type ScheduleFormInterface, compareReformatISODate
} from '$lib/server/common'
import {createDBSchedule, lookupByCode, lookupByDetails, selectDBSchedule} from "$lib/server/db";

function parseRankChoice(choice:string|null): number | null {
	if (!choice || choice === '') {
		return null
	}
	const rankNumber = Number(choice);
	if (Number.isInteger(rankNumber) && rankNumber > 0 && rankNumber < 5) {
		return rankNumber
	} else {
		return null;
	}
}

function createRankedChoiceTimestamps(
	notAvailableFirstConcert: boolean,
	notAvailableSecondConcert: boolean,
	notAvailableThirdConcert: boolean,
	notAvailableFourthConcert: boolean,
	firstConcertRankChoice: number | null,
	secondConcertRankChoice: number | null,
	thirdConcertRankChoice: number | null,
	fourthConcertRankChoice: number | null
): (string|null)[] {
	const concertTimeStamps = [
		"05/03/2025T16:00:00",
		"05/03/2025T19:00:00",
		"05/04/2025T14:00:00",
		"05/04/2025T17:00:00"
	]

	// initialize what we will return
	const rankedConcertTimeStamps: (string|null)[] = [null,null,null,null]
	// consolidate not available and rank into single field
	const rankedChoices: (number|null)[] = [
		notAvailableFirstConcert ? null: firstConcertRankChoice,
		notAvailableSecondConcert ? null: secondConcertRankChoice,
		notAvailableThirdConcert ? null : thirdConcertRankChoice,
		notAvailableFourthConcert ? null : fourthConcertRankChoice
	]

	// the rank is 1-4 a priority for each concert in series
	// the lowest ranked (#1) timestamp goes in the beginning of the array
	// the higher ranked timestamps are push on inorder
	for (const [index, rank] of rankedChoices.entries()) {
		if (rank) {
			rankedConcertTimeStamps[rank - 1] = concertTimeStamps[index];
		}
	}

	// compact and remove the nulls
	// now that we have the timestamps that is all we need
	// this filter also removed gaps if the user had non-contiguous ranks
	return rankedConcertTimeStamps.filter((value): value is string => value !== null);
}

function timestampsToFormValues(timestamps:string[]): ScheduleFormInterface[] {
	const mapTimesToRanks: Map<string, number> = new Map([
		["05/03/2025T16:00:00", 1],
		["05/03/2025T19:00:00", 2],
		["05/04/2025T14:00:00", 3],
		["05/04/2025T17:00:00", 4]
	]);

	// init array
	const formData: ScheduleFormInterface[] = [
		{rank: null, notSelected: true},
		{rank: null, notSelected: true},
		{rank: null, notSelected: true},
		{rank: null, notSelected: true}
	]
	/*
	 * formData has an entry for each possible concert ordered chronologically
	 * The first element for formData represents the first concert, the second element
	 * represents the second concert etc
	 * The timestamps passed in are concert times in order of preference
	 * The first element in timestamps represents the most desired concert slot,
	 * while the fourth element in timestamps represents the least desired concert slot
	 * The array of timestamps must contain at least one value
	 *
	 */
	for (const [index, value] of timestamps.entries()) {
		if (value) {
			// map the timestamp to a concert in the series
			const concertNumberInSeries = mapTimesToRanks.get(compareReformatISODate(value))
			// set the nth element in the form to the rank conferred by the index
			// for example the first element of timestamps might be the 4th concert in the series
			// that means the 4th concert is the most desirable and should have rank 1
			// index start from zero so we need to add one
			// concert series minus one to map back to array indexes which start at zero
			if (concertNumberInSeries)  {
				formData[concertNumberInSeries-1].rank = index+1
				formData[concertNumberInSeries-1].notSelected = false
			}
		}
	}
	return formData
}

async function retrievePerformerByCode(code: string): Promise<PerformerSearchResultsInterface> {
	try {
		const result: PerformerSearchResultsInterface | null = await lookupByCode(code)
		if (result == null) {
			return {
				status: 'NOTFOUND',
				performer_id: 0,
				performer_name: '',
				musical_piece: '',
				lottery_code: code,
				concert_series: ''
			}
		}
		return {
			status: 'OK',
			performer_id: result.performer_id,
			performer_name: result.performer_name,
			musical_piece: result.musical_piece,
			lottery_code: result.lottery_code,
			concert_series: result.concert_series
		}
	} catch {
		return {
			status: 'ERROR',
			performer_id: 0,
			performer_name: '',
			musical_piece: '',
			lottery_code: '',
			concert_series: ''
		}
	}
}
async function retrievePerformerByDetails(performerLastName:string, grade: string, composerName:string) : Promise<PerformerSearchResultsInterface> {
	try {
		const result: PerformerSearchResultsInterface | null = await lookupByDetails(performerLastName, grade, composerName);
		if (result == null) {
			return {
				status: 'NOTFOUND',
				performer_id: 0,
				performer_name: performerLastName,
				musical_piece: '',
				lottery_code: '',
				concert_series: ''
			}
		}
		return {
			status: 'OK',
			performer_id: result.performer_id,
			performer_name: result.performer_name,
			musical_piece: result.musical_piece,
			lottery_code: result.lottery_code,
			concert_series: result.concert_series
		}
	} catch {
		return {
			status: 'ERROR',
			performer_id: 0,
			performer_name: '',
			musical_piece: '',
			lottery_code: '',
			concert_series: ''
		}
	}
}

export async function load({url}) {
	// setup purify to clean out any injected JS
	const window = new JSDOM('').window;
	const purify = DOMPurify(window);
	let performerSearchResults: PerformerSearchResultsInterface = {
		status: 'ERROR',
		performer_id: 0,
		performer_name: '',
		musical_piece: '',
		lottery_code: '',
		concert_series: ''
	}
	let formValues = null

	if (url.searchParams.get('code') != null && isNonEmptyString(url.searchParams.get('code'))) {
		const code = purify.sanitize(url.searchParams.get('code')!)
		performerSearchResults = await retrievePerformerByCode(code)
		if (performerSearchResults.status != 'OK') {
			return {
				status: performerSearchResults.status,
				performer_id: performerSearchResults.performer_id,
				performer_name: performerSearchResults.performer_name,
				musical_piece: performerSearchResults.musical_piece,
				lottery_code: performerSearchResults.lottery_code,
				concert_series: performerSearchResults.concert_series,
				formValues: null
			}
		}
	} else {
		if (
			url.searchParams.get('performerLastName') != null
			&& isNonEmptyString(url.searchParams.get('performerLastName'))
			&& url.searchParams.get('grade') != null
			&& isNonEmptyString(url.searchParams.get('grade'))
			&& url.searchParams.get('composerName') != null
			&& isNonEmptyString(url.searchParams.get('composerName'))
		) {
			const performerLastName = purify.sanitize(url.searchParams.get('performerLastName')!)
			const grade = purify.sanitize(url.searchParams.get('grade')!)
			const composerName = purify.sanitize(url.searchParams.get('composerName')!)
			performerSearchResults = await retrievePerformerByDetails(performerLastName, grade, composerName)
			if (performerSearchResults.status != 'OK') {
				return {
					status: performerSearchResults.status,
					performer_id: performerSearchResults.performer_id,
					performer_name: performerSearchResults.performer_name,
					musical_piece: performerSearchResults.musical_piece,
					lottery_code: performerSearchResults.lottery_code,
					concert_series: performerSearchResults.concert_series,
					formValues: null
				}
			}
		} else {
			return {
				status: 'NOTFOUND',
				performer_id: 0,
				performer_name: '',
				musical_piece: '',
				lottery_code: '',
				concert_series: '',
				formValues: null
			}
		}
	}

	// found performer id now see if schedule already exists
	try {
		const scheduleRes = await selectDBSchedule(performerSearchResults.performer_id);
		if (scheduleRes.rowCount != null && scheduleRes.rowCount > 0) {
			formValues = timestampsToFormValues(
				[scheduleRes.rows[0].first_choice_time,
					scheduleRes.rows[0].second_choice_time,
					scheduleRes.rows[0].third_choice_time,
					scheduleRes.rows[0].fourth_choice_time]
			);
		}
	} catch {
		// eat the error performer can resubmit
		console.error('Error performing fetchSchedule');
	}
	return {
		status: 'OK',
		performer_id: performerSearchResults.performer_id,
		performer_name: performerSearchResults.performer_name,
		musical_piece: performerSearchResults.musical_piece,
		lottery_code: performerSearchResults.lottery_code,
		concert_series: performerSearchResults.concert_series,
		formValues: formValues
	}
}

export const actions = {
	add: async ({request}) => {
		const formData = await request.formData();

		const performerId = formData.get('performerId')
		const concertSeries = formData.get('concertSeries') ? String(formData.get('concertSeries')) : null

		if (performerId != null
			&& concertSeries != null
			&& isNonEmptyString(concertSeries)
			&& isNonEmptyString(performerId)) {

			const performerIdAsNumber = Number(performerId)
			if (! Number.isInteger(performerIdAsNumber)) {
				return fail(400, {error: "performer id must be an integer"});
			}

			if (concertSeries.toLowerCase() === "concerto") {
				const results = await createDBSchedule(
					performerIdAsNumber,
					concertSeries,pafe_series(),
					"04/27/2025T15:00:00",
					null,
					null,
					null
				);
				if (results.rowCount == null || results.rowCount <= 0 ) {
					return fail(500, {error: "unable to confirm Concerto schedule please try again"})
				}
			} else if (concertSeries.toLowerCase() === "eastside") {

				const notAvailableFirstConcert = !!formData.get('nonviable-sat-first')
				const notAvailableSecondConcert = !!formData.get('nonviable-sat-second')
				const notAvailableThirdConcert = !!formData.get('nonviable-sun-third')
				const notAvailableFourthConcert = !!formData.get('nonviable-sun-fourth')

				// parse is important it validates numbers are between 0 and 3 our array index
				const firstConcertRankChoice: number | null
					= parseRankChoice(formData.get('rank-sat-first') ? String(formData.get('rank-sat-first')) : null)
				const secondConcertRankChoice: number | null
					= parseRankChoice(formData.get('rank-sat-second') ? String(formData.get('rank-sat-second')) : null)
				const thirdConcertRankChoice: number | null
					= parseRankChoice(formData.get('rank-sun-third') ? String(formData.get('rank-sun-third')) : null)
				const fourthConcertRankChoice: number | null
					= parseRankChoice(formData.get('rank-sun-fourth') ? String(formData.get('rank-sun-fourth')) : null)

				const rankedChoiceTimeStamps = createRankedChoiceTimestamps(
					notAvailableFirstConcert,notAvailableSecondConcert,notAvailableThirdConcert,notAvailableFourthConcert,
					firstConcertRankChoice,secondConcertRankChoice,thirdConcertRankChoice,fourthConcertRankChoice
				)
				if (rankedChoiceTimeStamps[0] != null ) {
					const results = await createDBSchedule(
						performerIdAsNumber,
						concertSeries,
						pafe_series(),
						rankedChoiceTimeStamps[0],
						rankedChoiceTimeStamps[1],
						rankedChoiceTimeStamps[2],
						rankedChoiceTimeStamps[3])
					if (results.rowCount != null && results.rowCount > 0 ) {
						throw redirect(303, '/');
					}
				} else {
					return fail(400, {error: "No choices found please submit again with at least one ranked choice"})
				}

			} else {
				return fail(400, {error: `Unknown concert series ${concertSeries} expected Eastside or Concerto`})
			}

		} else {
			// failed param test null or empty parameters
			return fail(400, {error: "performer id or concert series is required"});
		}

		try {
			// do work
		} catch (e) {
			return fail(500, { error: (e as Error).message });
		}
	},
};