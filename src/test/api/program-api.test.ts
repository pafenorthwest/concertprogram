import { afterEach, describe, expect, it } from 'vitest';
import {
	GET as getProgramExport,
	POST as saveProgramOrder
} from '../../routes/api/program/+server';
import { PUT as moveProgramEntry } from '../../routes/api/program/[id]/+server';
import { type ImportPerformanceInterface, year } from '$lib/server/common';
import { DOCX_MIME_TYPE } from '$lib/server/programDocx';
import { pool } from '$lib/server/db';
import { Performance } from '$lib/server/import';
import { Program } from '$lib/server/program';
import { readZipEntryText } from '$lib/server/zip';

const testYear = year();
const eastsideSeries = 'Eastside';

const importedPerformances: Performance[] = [];
let uniqueCounter = 1;

async function importTestPerformance({
	concertSeries,
	lottery
}: {
	concertSeries: string;
	lottery: number;
}): Promise<{ performerId: number; performanceId: number; performance: Performance }> {
	const className = `PA.${uniqueCounter}.${Math.random().toString(36).slice(2, 8)}`;
	const performerName = `Program API Performer ${uniqueCounter}`;
	uniqueCounter += 1;
	const imported: ImportPerformanceInterface = {
		class_name: className,
		performer: performerName,
		age: 12,
		lottery,
		email: `program.api.${uniqueCounter}@example.com`,
		phone: '111-222-3333',
		accompanist: 'Test Accompanist',
		instrument: 'Piano',
		musical_piece: [
			{
				title: `Program API Piece ${className}`,
				contributors: [{ name: 'Test Composer', yearsActive: '1900-2000' }]
			}
		],
		concert_series: concertSeries
	};
	const performance = new Performance();
	const results = await performance.initialize(imported);
	importedPerformances.push(performance);
	return { performerId: results.performerId, performanceId: results.performanceId, performance };
}

async function cleanupScheduleChoices(
	performerId: number,
	concertSeries: string,
	scheduleYear: number
) {
	const connection = await pool.connect();
	try {
		await connection.query(
			`DELETE FROM schedule_slot_choice
       WHERE performer_id = $1
         AND concert_series = $2
         AND year = $3`,
			[performerId, concertSeries, scheduleYear]
		);
	} finally {
		connection.release();
	}
}

async function fetchProgramOrders(performanceIds: number[]) {
	const connection = await pool.connect();
	try {
		const result = await connection.query(
			`SELECT id, concert_series, performance_order
       FROM performance
       WHERE id = ANY($1::int[])`,
			[performanceIds]
		);
		return new Map(
			result.rows.map((row) => [
				Number(row.id),
				{
					concertSeries: String(row.concert_series),
					order: Number(row.performance_order)
				}
			])
		);
	} finally {
		connection.release();
	}
}

async function forceMoveEntry(performanceId: number, performerId: number, concertNum: number) {
	return moveProgramEntry({
		url: new URL(`http://localhost:8888/api/program/${performanceId}`),
		request: new Request(`http://localhost:8888/api/program/${performanceId}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				origin: 'http://localhost:8888'
			},
			body: JSON.stringify({
				concertSeries: eastsideSeries,
				concertNum,
				performerId
			})
		}),
		cookies: { get: () => '' },
		params: { id: String(performanceId) }
	} as Parameters<typeof moveProgramEntry>[0]);
}

afterEach(async () => {
	const performerIds = importedPerformances
		.map((performance) => performance.performer?.id)
		.filter((performerId): performerId is number => performerId != null);
	for (const performerId of performerIds) {
		await cleanupScheduleChoices(performerId, eastsideSeries, testYear);
	}

	while (importedPerformances.length > 0) {
		const performance = importedPerformances.pop();
		if (performance) {
			await performance.deleteAll();
		}
	}
});

describe('Program move API', () => {
	it('returns the current program export', async () => {
		const program = new Program(testYear);
		await program.build();
		expect(Array.isArray(program.retrieveAllConcertPrograms())).toBe(true);
	});

	it('returns a docx export for a selected concert', async () => {
		const entry = await importTestPerformance({ concertSeries: eastsideSeries, lottery: 700 });

		const moveResponse = await forceMoveEntry(entry.performanceId, entry.performerId, 3);

		expect(moveResponse.status).toBe(200);

		const exportResponse = await getProgramExport({
			url: new URL(
				'http://localhost:8888/api/program/?concertNum=3&concertSeries=Eastside&format=docx'
			)
		} as Parameters<typeof getProgramExport>[0]);

		expect(exportResponse.status).toBe(200);
		expect(exportResponse.headers.get('Content-Type')).toBe(DOCX_MIME_TYPE);
		expect(exportResponse.headers.get('Content-Disposition')).toContain(
			'filename="eastside-3-program.docx"'
		);

		const docx = Buffer.from(await exportResponse.arrayBuffer());
		expect(readZipEntryText(docx, 'word/document.xml')).toContain('Program API Performer');
		expect(readZipEntryText(docx, 'word/header1.xml')).toContain('Eastside Artists Concert #3');
	});

	it('accepts the admin force-move payload for an eastside destination', async () => {
		const entry = await importTestPerformance({ concertSeries: eastsideSeries, lottery: 701 });

		const response = await forceMoveEntry(entry.performanceId, entry.performerId, 3);

		expect(response.status).toBe(200);

		const program = new Program(testYear);
		await program.build();
		const placement = program.orderedPerformance.find(
			(performance) => performance.id === entry.performanceId
		);
		expect(placement?.concertSeries).toBe(eastsideSeries);
		expect(placement?.concertNumberInSeries).toBe(3);
	});

	it('accepts the admin force-move payload for the waitlist destination', async () => {
		const entry = await importTestPerformance({ concertSeries: eastsideSeries, lottery: 702 });

		const response = await moveProgramEntry({
			url: new URL(`http://localhost:8888/api/program/${entry.performanceId}`),
			request: new Request(`http://localhost:8888/api/program/${entry.performanceId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					origin: 'http://localhost:8888'
				},
				body: JSON.stringify({
					concertSeries: 'Waitlist',
					concertNum: 1,
					performerId: entry.performerId
				})
			}),
			cookies: { get: () => '' },
			params: { id: String(entry.performanceId) }
		} as Parameters<typeof moveProgramEntry>[0]);

		expect(response.status).toBe(200);

		const program = new Program(testYear);
		await program.build();
		const placement = program.orderedPerformance.find(
			(performance) => performance.id === entry.performanceId
		);
		expect(placement?.concertSeries).toBe('Waitlist');
		expect(placement?.concertNumberInSeries).toBe(1);
	});

	it('persists reordered program entries from the admin drag payload', async () => {
		const performerA = await importTestPerformance({ concertSeries: eastsideSeries, lottery: 703 });
		const performerB = await importTestPerformance({ concertSeries: eastsideSeries, lottery: 704 });
		const performerC = await importTestPerformance({ concertSeries: eastsideSeries, lottery: 705 });

		for (const entry of [performerA, performerB, performerC]) {
			const moveResponse = await forceMoveEntry(entry.performanceId, entry.performerId, 3);
			expect(moveResponse.status).toBe(200);
		}

		const saveResponse = await saveProgramOrder({
			url: new URL('http://localhost:8888/api/program'),
			request: new Request('http://localhost:8888/api/program', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					origin: 'http://localhost:8888'
				},
				body: JSON.stringify([
					{
						id: performerA.performanceId,
						concertSeries: eastsideSeries,
						order: 30,
						performerId: performerA.performerId
					},
					{
						id: performerB.performanceId,
						concertSeries: eastsideSeries,
						order: 10,
						performerId: performerB.performerId
					},
					{
						id: performerC.performanceId,
						concertSeries: eastsideSeries,
						order: 20,
						performerId: performerC.performerId
					}
				])
			}),
			cookies: { get: () => '' }
		} as Parameters<typeof saveProgramOrder>[0]);

		expect(saveResponse.status).toBe(200);

		const savedOrders = await fetchProgramOrders([
			performerA.performanceId,
			performerB.performanceId,
			performerC.performanceId
		]);
		expect(savedOrders.get(performerA.performanceId)).toEqual({
			concertSeries: eastsideSeries,
			order: 30
		});
		expect(savedOrders.get(performerB.performanceId)).toEqual({
			concertSeries: eastsideSeries,
			order: 10
		});
		expect(savedOrders.get(performerC.performanceId)).toEqual({
			concertSeries: eastsideSeries,
			order: 20
		});

		const program = new Program(testYear);
		await program.build();
		const orderedIds = program
			.retrieveAllConcertPrograms()
			.filter(
				(entry) =>
					entry.concertSeries === eastsideSeries &&
					entry.concertNumberInSeries === 3 &&
					[performerA.performanceId, performerB.performanceId, performerC.performanceId].includes(
						entry.id
					)
			)
			.map((entry) => entry.id);

		expect(orderedIds).toEqual([
			performerB.performanceId,
			performerC.performanceId,
			performerA.performanceId
		]);
	});
});
