import { lookupByCode, lookupByDetails } from '$lib/server/db';
import {json} from "@sveltejs/kit";
import { isNonEmptyString, type PerformerSearchResultsInterface } from '$lib/server/common';
import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

export async function GET({params, url}) {

	// setup purify to clean out any injected JS
	const window = new JSDOM('').window;
	const purify = DOMPurify(window);

	if (url.searchParams.get('code') != null && isNonEmptyString(url.searchParams.get('code'))) {
		// @ts-ignore
		const code = purify.sanitize(url.searchParams.get('code'))
		try {
			const result: PerformerSearchResultsInterface | null = await lookupByCode(code)
			if (result == null) {
				return json({ status: 'error', message: 'Not Found' }, { status: 404 });
			}
			return json({ status: 200, body: { message: 'Update successful',
					result: {
						performer_id: result.performer_id,
						performer_name: result.performer_name,
						musical_piece: result.musical_piece,
						lottery_code: result.lottery_code,
						concert_series: result.concert_series
					}
				} });
		} catch {
			return json({ status: 'error', message: 'Failed to process the request' }, { status: 500 });
		}
	} else {
		try {
			if ((url.searchParams.get('performerLastName') == null && isNonEmptyString(url.searchParams.get('performerLastName')))
				|| (url.searchParams.get('grade') == null && isNonEmptyString(url.searchParams.get('grade')))
				|| (url.searchParams.get('composerName') == null && isNonEmptyString(url.searchParams.get('composerName')))) {
				return json({ status: 'error', message: 'Not enough parameters' }, { status: 400 });
			}

			// @ts-ignore
			const performerLastName = purify.sanitize(url.searchParams.get('performerLastName'))
			// @ts-ignore
			const grade = purify.sanitize(url.searchParams.get('grade'))
			// @ts-ignore
			const composerName = purify.sanitize(url.searchParams.get('composerName'))

			const result: PerformerSearchResultsInterface | null = await lookupByDetails(performerLastName, grade, composerName);
			if (result == null) {
				return json({ status: 'error', message: 'Not Found' }, { status: 404 });
			}
			return json({ status: 200, body: { message: 'Update successful',
					result: {
						performer_id: result.performer_id,
						performer_name: result.performer_name,
						musical_piece: result.musical_piece,
						lottery_code: result.lottery_code,
						concert_series: result.concert_series
					}
			} });
		} catch {
			return json({ status: 'error', message: 'Failed to process the request' }, { status: 500 });
		}
	}
}