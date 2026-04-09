import { afterEach, describe, expect, it } from 'vitest';
import { PUT as moveProgramEntry } from '../../routes/api/program/[id]/+server';
import { type ImportPerformanceInterface, year } from '$lib/server/common';
import { pool } from '$lib/server/db';
import { Performance } from '$lib/server/import';
import { Program } from '$lib/server/program';

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

	it('accepts the admin force-move payload for an eastside destination', async () => {
		const entry = await importTestPerformance({ concertSeries: eastsideSeries, lottery: 701 });

		const response = await moveProgramEntry({
			url: new URL(`http://localhost:8888/api/program/${entry.performanceId}`),
			request: new Request(`http://localhost:8888/api/program/${entry.performanceId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					origin: 'http://localhost:8888'
				},
				body: JSON.stringify({
					concertSeries: eastsideSeries,
					concertNum: 3,
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
});
