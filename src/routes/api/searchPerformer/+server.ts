import { lookupByCode, lookupByDetails } from '$lib/server/db';
import {json} from "@sveltejs/kit";
import { isNonEmptyString, type PerformerSearchResultsInterface } from '$lib/server/common';
import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

export async function GET({params, url}) {

	// setup purify to clean out any injected JS
	const window = new JSDOM('').window;
	const purify = DOMPurify(window);
	const code = purify.sanitize(url.searchParams.get('code'))

	if (code != null && isNonEmptyString(code)) {
		try {
			const result: PerformerSearchResultsInterface | null = await lookupByCode(code)
			if (result == null) {
				return json({ status: 'error', message: 'Not Found' }, { status: 404 });
			}
			return json({ status: 200, body: { message: 'Update successful', result } });
		} catch {
			return json({ status: 'error', message: 'Failed to process the request' }, { status: 500 });
		}
	} else {
		try {
			const performerLastName = purify.sanitize(url.searchParams.get('performerLastName'))
			const grade = purify.sanitize(url.searchParams.get('grade'))
			const composerName = purify.sanitize(url.searchParams.get('composerName'))

			if (performerLastName == null || grade == null || composerName == null) {
				return json({ status: 'error', message: 'Not enough parameters' }, { status: 400 });
			}
			const result: PerformerSearchResultsInterface | null = await lookupByDetails(performerLastName, grade, composerName);
			if (result == null) {
				return json({ status: 'error', message: 'Not Found' }, { status: 404 });
			}
			return json({ status: 200, body: { message: 'Update successful', result: { performer_id: result.performer_id, concert_series: result.concert_series } } });
		} catch {
			return json({ status: 'error', message: 'Failed to process the request' }, { status: 500 });
		}
	}
}