import { DataParser, Performance } from '$lib/server/import';
import type {
	ImportContributorInterface,
	ImportMusicalTitleInterface,
	ImportPerformanceInterface
} from '$lib/server/common';
import { normalizeContributorRole, isNonEmptyString } from '$lib/server/common';
import { fail } from '@sveltejs/kit';

export async function load({ cookies }) {
	const pafeAuth = cookies.get('pafe_auth');
	const isAuthenticated = !!pafeAuth;

	return { isAuthenticated: isAuthenticated };
}

export const actions = {
	add: async ({ request }) => {
		const formData = await request.formData();
		if (formData.has('bigtext')) {
			const csvData = formData.get('bigtext');
			const concertSeries = formData.get('concert-series');
			const importedData = new DataParser();
			if (csvData != null && concertSeries != null) {
				await importedData.initialize(csvData.toString(), 'CSV', concertSeries.toString());
				if (importedData.failedImports.length > 0) {
					return fail(500, { error: JSON.stringify(importedData.failedImports) });
				}
			}
		} else {
			const first_contributor_role = normalizeContributorRole(
				formData.get('contributor-1-role') as string
			);
			const composerPieceOne: ImportContributorInterface = {
				name: formData.get('composer-name-piece-1'),
				yearsActive: formData.get('composer-years-piece-1'),
				role: first_contributor_role,
				notes: 'Web Admin Import'
			};

			const importMusicalTitle: ImportMusicalTitleInterface[] = [];
			if (formData.has('musical-piece-1')) {
				importMusicalTitle.push({
					title: formData.get('musical-piece-1'),
					contributors: [composerPieceOne]
				});
			}

			let composerPieceTwo: ImportContributorInterface;
			if (
				formData.has('musical-piece-2') &&
				formData.has('composer-name-piece-2') &&
				formData.has('composer-years-piece-2') &&
				isNonEmptyString(formData.get('musical-piece-2')) &&
				isNonEmptyString(formData.get('composer-name-piece-2')) &&
				isNonEmptyString(formData.get('composer-years-piece-2'))
			) {
				const second_contributor_role = normalizeContributorRole(
					formData.get('contributor-2-role') as string
				);
				composerPieceTwo = {
					name: formData.get('composer-name-piece-2'),
					yearsActive: formData.get('composer-years-piece-2'),
					role: second_contributor_role,
					notes: 'Web Admin Import'
				};
				importMusicalTitle.push({
					title: formData.get('musical-piece-2'),
					contributors: [composerPieceTwo]
				});
			}

			const rawClassName = formData.get('class');
			if (rawClassName == null || rawClassName === '') {
				throw new Error('Class Name is required');
			}
			const className = String(rawClassName).trim();

			const rawPerformer = formData.get('performer-name');
			if (rawPerformer == null || rawPerformer === '') {
				throw new Error('Performer  is required');
			}
			const performer = String(rawPerformer).trim();

			const rawAge = formData.get('age');
			if (rawAge == null || rawAge === '') {
				throw new Error('Age is required');
			}
			const age = Number(rawAge);

			const rawLottery = formData.get('lottery');
			if (rawLottery == null || rawLottery === '') {
				throw new Error('Lottery is required');
			}
			const lottery = Number(rawLottery);

			const rawConcertSeries = formData.get('concert-series');
			if (rawConcertSeries == null || rawConcertSeries == '') {
				throw new Error('Concert Series is required');
			}
			const concertSeries = String(rawConcertSeries).trim();

			const rawInstrument = formData.get('instrument');
			if (rawInstrument == null || rawInstrument == '') {
				throw new Error('Instrument is required');
			}
			const instrument = String(rawInstrument).trim();

			const imported: ImportPerformanceInterface = {
				class_name: className,
				performer: performer,
				age: age,
				lottery: lottery,
				instrument: instrument,
				concert_series: concertSeries,
				musical_piece: importMusicalTitle,
				...(formData.get('accompanist') != null && formData.get('accompanist') !== ''
					? { accompanist: formData.get('accompanist') }
					: { accompanist: null }),
				...(formData.get('performer-email') != null && formData.get('performer-email') !== ''
					? { email: formData.get('performer-email') }
					: { email: null }),
				...(formData.get('performer-phone') != null && formData.get('performer-phone') !== ''
					? { phone: formData.get('performer-phone') }
					: { phone: null })
			};

			const singlePerformance: Performance = new Performance();
			try {
				await singlePerformance.initialize(imported);
			} catch (e) {
				return fail(500, { error: (e as Error).message });
			}
		}
	}
};
