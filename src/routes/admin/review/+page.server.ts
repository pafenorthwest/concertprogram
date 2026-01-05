import type { PageServerLoad } from './$types';
import type { ContributorInterface } from '$lib/server/common';
import { queryTable } from '$lib/server/db';

export const load: PageServerLoad = async () => {
	try {
		const result = await queryTable('contributor');
		const contributors = (result.rows as ContributorInterface[])
			.filter(
				(contributor): contributor is ContributorInterface & { id: number } =>
					contributor.id != null
			)
			.map((contributor) => ({
				...contributor,
				display_label: `${contributor.role}: ${contributor.full_name} (#${contributor.id})`
			}))
			.sort((a, b) => a.display_label.localeCompare(b.display_label));

		return { contributors };
	} catch (error) {
		console.error('Failed to load contributors for review page', error);
		return { contributors: [] };
	}
};
