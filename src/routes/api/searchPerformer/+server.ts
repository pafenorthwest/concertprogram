import { lookupByCode, lookupByDetails } from '$lib/server/db';
import { json } from '@sveltejs/kit';
import { isNonEmptyString, type PerformerSearchResultsInterface } from '$lib/server/common';
import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

async function retrievePerformerByCode(code: string): Promise<PerformerSearchResultsInterface> {
	try {
		const result: PerformerSearchResultsInterface | null = await lookupByCode(code);
		if (result == null) {
			return {
				status: 'NOTFOUND',
				performer_id: 0,
				performer_name: '',
				musical_piece: '',
				lottery_code: code,
				concert_series: ''
			};
		}
		return {
			status: 'OK',
			performer_id: result.performer_id,
			performer_name: result.performer_name,
			musical_piece: result.musical_piece,
			lottery_code: result.lottery_code,
			concert_series: result.concert_series
		};
	} catch {
		return {
			status: 'ERROR',
			performer_id: 0,
			performer_name: '',
			musical_piece: '',
			lottery_code: '',
			concert_series: ''
		};
	}
}

async function retrievePerformerByDetails(
	performerLastName: string,
	age: number,
	composerName: string
): Promise<PerformerSearchResultsInterface> {
	try {
		const result: PerformerSearchResultsInterface | null = await lookupByDetails(
			performerLastName,
			age,
			composerName
		);
		if (result == null) {
			return {
				status: 'NOTFOUND',
				performer_id: 0,
				performer_name: performerLastName,
				musical_piece: '',
				lottery_code: '',
				concert_series: ''
			};
		}
		return {
			status: 'OK',
			performer_id: result.performer_id,
			performer_name: result.performer_name,
			musical_piece: result.musical_piece,
			lottery_code: result.lottery_code,
			concert_series: result.concert_series
		};
	} catch {
		return {
			status: 'ERROR',
			performer_id: 0,
			performer_name: '',
			musical_piece: '',
			lottery_code: '',
			concert_series: ''
		};
	}
}

export async function GET({ url }) {
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
	};

	try {
		if (url.searchParams.get('code') != null && isNonEmptyString(url.searchParams.get('code'))) {
			const code = purify.sanitize(url.searchParams.get('code')!);
			performerSearchResults = await retrievePerformerByCode(code);
			if (performerSearchResults.status != 'OK') {
				return json({
					status: 200,
					body: {
						message: 'Update successful',
						result: {
							status: performerSearchResults.status,
							performer_id: performerSearchResults.performer_id,
							performer_name: performerSearchResults.performer_name,
							musical_piece: performerSearchResults.musical_piece,
							lottery_code: performerSearchResults.lottery_code,
							concert_series: performerSearchResults.concert_series
						}
					}
				});
			} else {
				return json({ status: 'error', message: 'Not Found' }, { status: 404 });
			}
		} else {
			if (
				url.searchParams.get('performerLastName') != null &&
				isNonEmptyString(url.searchParams.get('performerLastName')) &&
				url.searchParams.get('age') != null &&
				isNonEmptyString(url.searchParams.get('age')) &&
				url.searchParams.get('composerName') != null &&
				isNonEmptyString(url.searchParams.get('composerName'))
			) {
				const performerLastName = purify.sanitize(url.searchParams.get('performerLastName')!);
				const age = purify.sanitize(url.searchParams.get('age')!);
				const composerName = purify.sanitize(url.searchParams.get('composerName')!);
				performerSearchResults = await retrievePerformerByDetails(
					performerLastName,
					age,
					composerName
				);
				if (performerSearchResults.status != 'OK') {
					return json({
						status: 200,
						body: {
							message: 'Update successful',
							result: {
								status: performerSearchResults.status,
								performer_id: performerSearchResults.performer_id,
								performer_name: performerSearchResults.performer_name,
								musical_piece: performerSearchResults.musical_piece,
								lottery_code: performerSearchResults.lottery_code,
								concert_series: performerSearchResults.concert_series
							}
						}
					});
				}
			} else {
				return json({ status: 'error', message: 'Not Found' }, { status: 404 });
			}
		}
	} catch {
		return json({ status: 'error', message: 'Error searchPerformer' }, { status: 500 });
	}
}