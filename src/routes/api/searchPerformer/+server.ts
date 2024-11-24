import { lookupByCode, lookupByDetails } from '$lib/server/db';
import {json} from "@sveltejs/kit";
import type { PerformerSearchResultsInterface } from '$lib/server/common';

export async function GET({params, url}) {

	const code = url.searchParams.get('code');

	if (code != null) {
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
			const performerLastName = url.searchParams.get('performerLastName');
			const grade = url.searchParams.get('grade');
			const composerName = url.searchParams.get('composerName');

			if (performerLastName == null || grade == null || composerName == null) {
				return json({ status: 'error', message: 'Not enough parameters' }, { status: 400 });
			}
			const result: PerformerSearchResultsInterface | null = await lookupByDetails(performerLastName, grade, composerName);
			if (result == null) {
				return json({ status: 'error', message: 'Not Found' }, { status: 404 });
			}
			return json({ status: 200, body: { message: 'Update successful', result } });
		} catch {
			return json({ status: 'error', message: 'Failed to process the request' }, { status: 500 });
		}
	}
}