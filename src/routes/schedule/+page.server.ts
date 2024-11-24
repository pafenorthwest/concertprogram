import { fail } from '@sveltejs/kit';
import type { ImportPerformanceInterface } from '$lib/server/common';

export const actions = {
	add: async ({request}) => {
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