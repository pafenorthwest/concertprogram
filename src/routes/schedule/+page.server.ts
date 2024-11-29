import {fail, redirect} from '@sveltejs/kit';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import {type PerformerSearchResultsInterface, isNonEmptyString, pafe_series} from '$lib/server/common'
import {createDBSchedule, lookupByCode, lookupByDetails} from "$lib/server/db";

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
		"05/03/2025T04:00:00",
		"05/03/2025T07:00:00",
		"05/04/2025T02:00:00",
		"05/04/2025T05:00:00"
	]

	// filter out nulls and pack into an array
	// not available yields null
	let rankedChoices: number[] = [
		notAvailableFirstConcert ? null: firstConcertRankChoice,
		notAvailableSecondConcert ? null: secondConcertRankChoice,
		notAvailableThirdConcert ? null : thirdConcertRankChoice,
		notAvailableFourthConcert ? null : fourthConcertRankChoice
	].filter((value): value is number => value !== null);

	// dedupe, preserve order
	const noDupesRankedChoices: number[] = Array.from(new Set(rankedChoices));
	// renumber starting at zero, extra safety measure
	// - step 1 sort
	const sortedNumbers: number[] = [...noDupesRankedChoices].sort((a, b) => a - b);
	// - step 2 map old to new, renumber starting at 1
	const mapping = new Map<number, number>();
	sortedNumbers.forEach((num, index) => {
		mapping.set(num, index + 1);
	});
	// - step 3 update using map
	rankedChoices = noDupesRankedChoices.map(num => mapping.get(num)!);

	let rankedOrderTimeStamps: (string|null)[] = [null,null,null,null]
	let timeStampIndex = 0;
	// parse validated rank in range
	for (const rank of rankedChoices) {
		// rank to array index minus 1
		rankedOrderTimeStamps[rank-1] = concertTimeStamps[timeStampIndex]
		timeStampIndex += 1
	}

	return rankedOrderTimeStamps
}

export async function load({url}) {
	// setup purify to clean out any injected JS
	const window = new JSDOM('').window;
	const purify = DOMPurify(window);

	if (url.searchParams.get('code') != null && isNonEmptyString(url.searchParams.get('code'))) {
		// @ts-ignore
		const code = purify.sanitize(url.searchParams.get('code'))
		try {
			const result: PerformerSearchResultsInterface | null = await lookupByCode(code)
			if (result == null) {
				return {
					status: 'NOTFOUND',
					performer_id: '',
					performer_name: '',
					musical_piece: '',
					lottery_code: '',
					concert_series: code
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
				performer_id: '',
				performer_name: '',
				musical_piece: '',
				lottery_code: '',
				concert_series: ''
			}
		}
	} else {
		try {
			if ((url.searchParams.get('performerLastName') == null && isNonEmptyString(url.searchParams.get('performerLastName')))
				|| (url.searchParams.get('grade') == null && isNonEmptyString(url.searchParams.get('grade')))
				|| (url.searchParams.get('composerName') == null && isNonEmptyString(url.searchParams.get('composerName')))) {
				return {
					status: 'ERROR',
					performer_id: '',
					performer_name: '',
					musical_piece: '',
					lottery_code: '',
					concert_series: ''
				}
			}

			// @ts-ignore
			const performerLastName = purify.sanitize(url.searchParams.get('performerLastName'))
			// @ts-ignore
			const grade = purify.sanitize(url.searchParams.get('grade'))
			// @ts-ignore
			const composerName = purify.sanitize(url.searchParams.get('composerName'))

			const result: PerformerSearchResultsInterface | null = await lookupByDetails(performerLastName, grade, composerName);
			if (result == null) {
				return {
					status: 'NOTFOUND',
					performer_id: '',
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
				performer_id: '',
				performer_name: '',
				musical_piece: '',
				lottery_code: '',
				concert_series: ''
			}
		}
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