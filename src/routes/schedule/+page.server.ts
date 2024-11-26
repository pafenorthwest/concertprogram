import { fail } from '@sveltejs/kit';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import {unpackBody, type PerformerSearchResultsInterface} from '$lib/server/common'

export async function load({ fetch, url }) {
	// setup purify to clean out any injected JS
	const window = new JSDOM('').window;
	const purify = DOMPurify(window);
	const performerLastName = purify.sanitize(url.searchParams.get('performerLastName'))
	const grade = purify.sanitize(url.searchParams.get('grade'))
	const composerName = purify.sanitize(url.searchParams.get('composerName'));

	const searchURL = `/api/searchPerformer?performerLastName=${performerLastName}&grade=${grade}&composerName=${composerName}`
	console.log(`Fetching URL ${searchURL}`);
	const searchResponse =
		await fetch(searchURL, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json'
		}
	});

	// parse stream to get body
	if (searchResponse.status == 200 && searchResponse.body != null) {
		const bodyFromRequest = await unpackBody(searchResponse.body);
		try {
			// create object from parsed stream to get id of newly created accompanist
			const resultObject = JSON.parse(bodyFromRequest)
			const performerSearchRes: PerformerSearchResultsInterface
				= resultObject.body.result as PerformerSearchResultsInterface
			return { performer_id: performerSearchRes.performer_id, concert_series: performerSearchRes.concert_series }
		} catch {
			return { status: 500, body: { message: 'Exception parsing results from /searchPerformer' } };
		}
	} else {
		return { status: 500, body: { message: 'Bad request to /searchPerformer' } };
	}
}

export const actions = {
	schedule: async ({request}) => {
		const formData = await request.formData();

		formData.get('rank-sat-first')
		formData.get('nonviable-sat-first')
		formData.get('rank-sat-second')
		formData.get('nonviable-sat-second')
		formData.get('rank-sun-third')
		formData.get('nonviable-sun-third')
		formData.get('rank-sun-fourth')
		formData.get('nonviable-sun-fourth')

		try {
			// do work
		} catch (e) {
			return fail(500, { error: (e as Error).message });
		}
	},
};