import { describe, expect, it, vi } from 'vitest';
import { refreshCachedTimeStamps } from '$lib/cache';
import { Performance } from '$lib/server/import';
import { parseMusicalPiece, type ImportPerformanceInterface, year } from '$lib/server/common';
import { lookupByCode, pool } from '$lib/server/db';
import { SlotCatalog } from '$lib/server/slotCatalog';
import { ScheduleMapper } from '$lib/server/scheduleMapper';
import { ScheduleRepository } from '$lib/server/scheduleRepository';

vi.mock('$lib/server/common', async () => {
	const actual = await vi.importActual<typeof import('$lib/server/common')>('$lib/server/common');
	return {
		...actual,
		year: () => TEST_YEAR
	};
});

import { load } from '../../routes/schedule/+page.server';

const TEST_YEAR = 2026;

async function fetchPerformerEmail(performerId: number) {
	const result = await pool.query('SELECT id, email, full_name FROM performer WHERE id = $1', [
		performerId
	]);
	return result.rows[0];
}

async function fetchPieceAndComposer(performanceId: number) {
	const result = await pool.query(
		`SELECT mp.printed_name, c.full_name AS composer_name
     FROM performance_pieces pp
     JOIN musical_piece mp ON mp.id = pp.musical_piece_id
     JOIN contributor c ON c.id = mp.first_contributor_id
     WHERE pp.performance_id = $1`,
		[performanceId]
	);
	return result.rows[0];
}

async function cleanupDb({
	performanceIds,
	musicalPieceIds,
	classNames,
	concertSeries,
	scheduleYear,
	performerId
}: {
	performanceIds: number[];
	musicalPieceIds: number[];
	classNames: string[];
	concertSeries: string[];
	scheduleYear: number;
	performerId: number | null;
}) {
	const client = await pool.connect();
	try {
		if (performanceIds.length > 0) {
			await client.query('DELETE FROM performance_pieces WHERE performance_id = ANY($1)', [
				performanceIds
			]);
			await client.query('DELETE FROM performance WHERE id = ANY($1)', [performanceIds]);
		}
		if (classNames.length > 0) {
			await client.query('DELETE FROM class_lottery WHERE class_name = ANY($1)', [classNames]);
		}
		if (musicalPieceIds.length > 0) {
			await client.query('DELETE FROM musical_piece WHERE id = ANY($1)', [musicalPieceIds]);
		}
		if (concertSeries.length > 0) {
			await client.query('DELETE FROM concert_times WHERE concert_series = ANY($1) AND year = $2', [
				concertSeries,
				scheduleYear
			]);
			if (performerId != null) {
				await client.query(
					`DELETE FROM schedule_slot_choice
           WHERE performer_id = $1
             AND concert_series = ANY($2)
             AND year = $3`,
					[performerId, concertSeries, scheduleYear]
				);
			}
		}
		if (performerId != null) {
			await client.query('DELETE FROM performer WHERE id = $1', [performerId]);
		}
	} finally {
		client.release();
	}
}

async function seedConcertTimes(seriesList: string[], scheduleYear: number) {
	const client = await pool.connect();
	try {
		for (const series of seriesList) {
			await client.query('DELETE FROM concert_times WHERE concert_series = $1 AND year = $2', [
				series,
				scheduleYear
			]);
			await client.query(
				`INSERT INTO concert_times (concert_series, year, concert_number_in_series, start_time)
         VALUES ($1, $2, 1, $3),
                ($1, $2, 2, $4)
         ON CONFLICT (concert_series, year, concert_number_in_series) DO NOTHING`,
				[series, scheduleYear, `${scheduleYear}-05-01 10:00:00`, `${scheduleYear}-05-02 10:00:00`]
			);
		}
	} finally {
		client.release();
	}
	await refreshCachedTimeStamps();
}

async function setupMultiClassFixtures() {
	const basePerformer = {
		fullName: 'Lookup Code Performer',
		age: 16,
		instrument: 'Piano',
		email: 'lookup.code.performer@example.com',
		phone: '555-0101'
	};

	const firstImport: ImportPerformanceInterface = {
		class_name: 'TST.LOOKUP.1',
		performer: basePerformer.fullName,
		lottery: 43210,
		age: basePerformer.age,
		email: basePerformer.email,
		phone: basePerformer.phone,
		accompanist: 'First Accompanist',
		instrument: basePerformer.instrument,
		musical_piece: [
			{
				title: 'Midnight Rhapsody in G minor',
				contributors: [{ name: 'Composer Alpha', yearsActive: '1900-1980' }]
			}
		],
		concert_series: 'LookupSeriesA'
	};

	const secondImport: ImportPerformanceInterface = {
		class_name: 'TST.LOOKUP.2',
		performer: basePerformer.fullName,
		lottery: 98765,
		age: basePerformer.age,
		email: basePerformer.email,
		phone: basePerformer.phone,
		accompanist: 'Second Accompanist',
		instrument: basePerformer.instrument,
		musical_piece: [
			{
				title: 'Dawn Etude in D major',
				contributors: [{ name: 'Composer Beta', yearsActive: '1880-1950' }]
			}
		],
		concert_series: 'LookupSeriesB'
	};

	const firstPerformance = new Performance();
	const secondPerformance = new Performance();
	const performanceIds: number[] = [];
	const musicalPieceIds: number[] = [];
	const classNames: string[] = [firstImport.class_name, secondImport.class_name];
	const concertSeries = [firstImport.concert_series!, secondImport.concert_series!];
	const scheduleYear = year();
	let performerId: number | null = null;

	await seedConcertTimes(concertSeries, scheduleYear);

	await firstPerformance.initialize(firstImport);
	await secondPerformance.initialize(secondImport);

	if (firstPerformance.performer?.id != null) {
		performerId = firstPerformance.performer.id;
	}
	if (secondPerformance.performer?.id != null && performerId == null) {
		performerId = secondPerformance.performer.id;
	}
	if (firstPerformance.performance?.id != null) {
		performanceIds.push(firstPerformance.performance.id);
	}
	if (secondPerformance.performance?.id != null) {
		performanceIds.push(secondPerformance.performance.id);
	}
	if (firstPerformance.musical_piece_1?.id != null) {
		musicalPieceIds.push(firstPerformance.musical_piece_1.id);
	}
	if (secondPerformance.musical_piece_1?.id != null) {
		musicalPieceIds.push(secondPerformance.musical_piece_1.id);
	}

	const firstLookup = await lookupByCode(String(firstImport.lottery));
	const secondLookup = await lookupByCode(String(secondImport.lottery));

	if (firstLookup == null || secondLookup == null) {
		throw new Error('Failed to look up performer by lottery code.');
	}

	const performerRow = await fetchPerformerEmail(firstLookup.performer_id);
	const expectedFirstTitle = parseMusicalPiece(
		firstImport.musical_piece[0].title
	).titleWithoutMovement;
	const expectedSecondTitle = parseMusicalPiece(
		secondImport.musical_piece[0].title
	).titleWithoutMovement;

	return {
		basePerformer,
		firstImport,
		secondImport,
		firstLookup,
		secondLookup,
		performerRow,
		expectedFirstTitle,
		expectedSecondTitle,
		performanceIds,
		musicalPieceIds,
		classNames,
		concertSeries,
		scheduleYear,
		performerId
	};
}

describe('dbOnly lookupByCode with performer in multiple classes', () => {
	it('returns performer and musical details for each class lottery', async () => {
		const fixtures = await setupMultiClassFixtures();
		const scheduleRepository = new ScheduleRepository();

		try {
			expect(fixtures.firstLookup).not.toBeNull();
			expect(fixtures.secondLookup).not.toBeNull();

			expect(fixtures.firstLookup!.performer_id).toBe(fixtures.performerRow.id);
			expect(fixtures.secondLookup!.performer_id).toBe(fixtures.performerRow.id);
			expect(fixtures.performerRow.full_name).toBe(fixtures.basePerformer.fullName);
			expect(fixtures.performerRow.email).toBe(fixtures.basePerformer.email);
			expect(fixtures.firstLookup!.lottery_code).toBe(fixtures.firstImport.lottery);
			expect(fixtures.secondLookup!.lottery_code).toBe(fixtures.secondImport.lottery);

			expect(fixtures.firstLookup!.performer_name).toBe(fixtures.basePerformer.fullName);
			expect(fixtures.firstLookup!.musical_piece).toBe(fixtures.expectedFirstTitle);
			expect(fixtures.secondLookup!.performer_name).toBe(fixtures.basePerformer.fullName);
			expect(fixtures.secondLookup!.musical_piece).toBe(fixtures.expectedSecondTitle);

			const firstSlotCatalog = await SlotCatalog.load(
				fixtures.firstLookup!.concert_series,
				fixtures.scheduleYear
			);
			const firstScheduleChoice = await scheduleRepository.fetchChoices(
				fixtures.performerRow.id,
				fixtures.firstLookup!.concert_series,
				fixtures.scheduleYear
			);
			const firstViewModel = ScheduleMapper.toViewModel(
				firstSlotCatalog.slots,
				firstScheduleChoice
			);
			expect(firstViewModel.mode).toBe('rank-choice');
			expect(firstViewModel.slotCount).toBe(firstSlotCatalog.slots.length);
			expect(firstViewModel.slots.every((slot) => slot.rank === null)).toBe(true);
			expect(firstViewModel.slots.every((slot) => slot.notAvailable === false)).toBe(true);

			const secondSlotCatalog = await SlotCatalog.load(
				fixtures.secondLookup!.concert_series,
				fixtures.scheduleYear
			);
			const secondScheduleChoice = await scheduleRepository.fetchChoices(
				fixtures.performerRow.id,
				fixtures.secondLookup!.concert_series,
				fixtures.scheduleYear
			);
			const secondViewModel = ScheduleMapper.toViewModel(
				secondSlotCatalog.slots,
				secondScheduleChoice
			);
			expect(secondViewModel.mode).toBe('rank-choice');
			expect(secondViewModel.slotCount).toBe(secondSlotCatalog.slots.length);
			expect(secondViewModel.slots.every((slot) => slot.rank === null)).toBe(true);
			expect(secondViewModel.slots.every((slot) => slot.notAvailable === false)).toBe(true);

			const firstPieceRow = await fetchPieceAndComposer(fixtures.firstLookup!.performance_id);
			const secondPieceRow = await fetchPieceAndComposer(fixtures.secondLookup!.performance_id);

			expect(firstPieceRow.printed_name).toBe(fixtures.expectedFirstTitle);
			expect(firstPieceRow.composer_name).toBe(
				fixtures.firstImport.musical_piece[0].contributors[0].name
			);
			expect(secondPieceRow.printed_name).toBe(fixtures.expectedSecondTitle);
			expect(secondPieceRow.composer_name).toBe(
				fixtures.secondImport.musical_piece[0].contributors[0].name
			);
		} finally {
			await cleanupDb({
				performanceIds: fixtures.performanceIds,
				musicalPieceIds: fixtures.musicalPieceIds,
				classNames: fixtures.classNames,
				concertSeries: fixtures.concertSeries,
				scheduleYear: fixtures.scheduleYear,
				performerId: fixtures.performerId
			});
		}
	});

	it.each([
		{ which: 'first', pick: (f: any) => ({ imp: f.firstImport, lookup: f.firstLookup }) },
		{ which: 'second', pick: (f: any) => ({ imp: f.secondImport, lookup: f.secondLookup }) }
	])(
		'returns status OK and view model for schedule load with lookup code (%s)',
		async ({ which, pick }) => {
			const fixtures = await setupMultiClassFixtures();
			const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

			try {
				const { imp, lookup } = pick(fixtures);

				const url = new URL(`http://localhost:8888/schedule?code=${imp.lottery}`);
				const data = await load({
					url,
					params: {},
					locals: {},
					parent: async () => ({}),
					depends: () => {}
				} as any);

				// Core gate
				expect(data.status).toBe('OK');
				expect(data.viewModel).toBeTruthy();
				expect(errSpy).not.toHaveBeenCalled();

				// Diagnostics / correctness
				expect(data.lottery_code).toBe(imp.lottery);
				expect(data.concert_series).toBe(imp.concert_series);
				expect(data.performance_id).toBe(lookup.performance_id);
				expect(data.performer_name).toBe(fixtures.basePerformer.fullName);

				expect(Array.isArray(data.concertTimes)).toBe(true);
				expect(data.concertTimes.length).toBeGreaterThan(0);

				expect(data.slotCount).toBeGreaterThan(0);
				expect(data.slots.length).toBe(data.slotCount);
				expect(data.viewModel.slotCount).toBe(data.slotCount);
				expect(data.viewModel.slots.length).toBe(data.slotCount);
			} finally {
				errSpy.mockRestore();
				await cleanupDb({
					performanceIds: fixtures.performanceIds,
					musicalPieceIds: fixtures.musicalPieceIds,
					classNames: fixtures.classNames,
					concertSeries: fixtures.concertSeries,
					scheduleYear: fixtures.scheduleYear,
					performerId: fixtures.performerId
				});
			}
		}
	);
});
