import type { PageServerLoad } from './$types';
import type { ContributorInterface } from '$lib/server/common';
import { queryTable } from '$lib/server/db';

export const load: PageServerLoad = async () => {
	try {
		const result = await queryTable('contributor');
		const composers = (result.rows as ContributorInterface[])
			.filter(
				(contributor): contributor is ContributorInterface & { id: number } =>
					contributor.role === 'Composer' && contributor.id != null
			)
			.sort((a, b) => a.full_name.localeCompare(b.full_name));

		return { composers };
	} catch (error) {
		console.error('Failed to load composers for review page', error);
		return { composers: [] };
	}
};
