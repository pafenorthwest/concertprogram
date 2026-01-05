import { describe, expect, it } from 'vitest';
import { Performance } from '$lib/server/import';
import { parseMusicalPiece, type ImportPerformanceInterface, year } from '$lib/server/common';
import { lookupByCode, pool } from '$lib/server/db';
import { SlotCatalog } from '$lib/server/slotCatalog';
import { ScheduleMapper } from '$lib/server/scheduleMapper';
import { ScheduleRepository } from '$lib/server/scheduleRepository';

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

describe('lookupByCode with performer in multiple classes', () => {
	it('returns performer and musical details for each class lottery', async () => {
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
		const scheduleRepository = new ScheduleRepository();

		try {
			await firstPerformance.initialize(firstImport);
			await secondPerformance.initialize(secondImport);

			if (firstPerformance.performer?.id != null) {
				performerId = firstPerformance.performer.id;
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

			expect(firstLookup).not.toBeNull();
			expect(secondLookup).not.toBeNull();

			const performerRow = await fetchPerformerEmail(firstLookup!.performer_id);
			expect(firstLookup!.performer_id).toBe(performerRow.id);
			expect(secondLookup!.performer_id).toBe(performerRow.id);
			expect(performerRow.full_name).toBe(basePerformer.fullName);
			expect(performerRow.email).toBe(basePerformer.email);
			expect(firstLookup!.lottery_code).toBe(firstImport.lottery);
			expect(secondLookup!.lottery_code).toBe(secondImport.lottery);

			const expectedFirstTitle = parseMusicalPiece(
				firstImport.musical_piece[0].title
			).titleWithoutMovement;
			const expectedSecondTitle = parseMusicalPiece(
				secondImport.musical_piece[0].title
			).titleWithoutMovement;

			expect(firstLookup!.performer_name).toBe(basePerformer.fullName);
			expect(firstLookup!.musical_piece).toBe(expectedFirstTitle);
			expect(secondLookup!.performer_name).toBe(basePerformer.fullName);
			expect(secondLookup!.musical_piece).toBe(expectedSecondTitle);

			const firstSlotCatalog = await SlotCatalog.load(firstLookup!.concert_series, scheduleYear);
			const firstScheduleChoice = await scheduleRepository.fetchChoices(
				performerRow.id,
				firstLookup!.concert_series,
				scheduleYear
			);
			const firstViewModel = ScheduleMapper.toViewModel(
				firstSlotCatalog.slots,
				firstScheduleChoice
			);
			expect(firstViewModel.mode).toBe('rank-choice');
			expect(firstViewModel.slotCount).toBe(firstSlotCatalog.slots.length);
			expect(firstViewModel.slots.every((slot) => slot.rank === null)).toBe(true);
			expect(firstViewModel.slots.every((slot) => slot.notAvailable === false)).toBe(true);

			const secondSlotCatalog = await SlotCatalog.load(secondLookup!.concert_series, scheduleYear);
			const secondScheduleChoice = await scheduleRepository.fetchChoices(
				performerRow.id,
				secondLookup!.concert_series,
				scheduleYear
			);
			const secondViewModel = ScheduleMapper.toViewModel(
				secondSlotCatalog.slots,
				secondScheduleChoice
			);
			expect(secondViewModel.mode).toBe('rank-choice');
			expect(secondViewModel.slotCount).toBe(secondSlotCatalog.slots.length);
			expect(secondViewModel.slots.every((slot) => slot.rank === null)).toBe(true);
			expect(secondViewModel.slots.every((slot) => slot.notAvailable === false)).toBe(true);

			const firstPieceRow = await fetchPieceAndComposer(firstLookup!.performance_id);
			const secondPieceRow = await fetchPieceAndComposer(secondLookup!.performance_id);

			expect(firstPieceRow.printed_name).toBe(expectedFirstTitle);
			expect(firstPieceRow.composer_name).toBe(firstImport.musical_piece[0].contributors[0].name);
			expect(secondPieceRow.printed_name).toBe(expectedSecondTitle);
			expect(secondPieceRow.composer_name).toBe(secondImport.musical_piece[0].contributors[0].name);
		} finally {
			await cleanupDb({
				performanceIds,
				musicalPieceIds,
				classNames,
				concertSeries,
				scheduleYear,
				performerId
			});
		}
	});
});
