import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { Performance } from '$lib/server/import';
import { type ImportPerformanceInterface, year } from '$lib/server/common';
import { pool } from '$lib/server/db';
import { Program } from '$lib/server/program';

const testYear = year();
const eastsideSeries = 'Eastside';
const concertoSeries = 'Concerto';

const importedPerformances: Performance[] = [];
let uniqueCounter = 1;

async function seedConcertTimes(series: string, seedYear: number, slotCount: number) {
	const connection = await pool.connect();
	try {
		await connection.query('DELETE FROM concert_times WHERE concert_series = $1 AND year = $2', [
			series,
			seedYear
		]);

		for (let index = 1; index <= slotCount; index += 1) {
			const startTime = `05/${String(index).padStart(2, '0')}/${seedYear}T10:00:00`;
			await connection.query(
				`INSERT INTO concert_times (concert_series, year, concert_number_in_series, start_time)
         VALUES ($1, $2, $3, $4)`,
				[series, seedYear, index, startTime]
			);
		}
	} finally {
		connection.release();
	}
}

async function seedConcertoTimes(series: string, seedYear: number) {
	const connection = await pool.connect();
	try {
		await connection.query('DELETE FROM concert_times WHERE concert_series = $1 AND year = $2', [
			series,
			seedYear
		]);
		await connection.query(
			`INSERT INTO concert_times (concert_series, year, concert_number_in_series, start_time)
       VALUES ($1, $2, $3, $4)`,
			[series, seedYear, 0, `05/01/${seedYear}T18:00:00`]
		);
	} finally {
		connection.release();
	}
}

async function cleanupConcertTimes(series: string, cleanupYear: number) {
	const connection = await pool.connect();
	try {
		await connection.query('DELETE FROM concert_times WHERE concert_series = $1 AND year = $2', [
			series,
			cleanupYear
		]);
	} finally {
		connection.release();
	}
}

async function fetchSlotIdByNumber(series: string, scheduleYear: number): Promise<Map<number, number>> {
	const connection = await pool.connect();
	try {
		const result = await connection.query(
			`SELECT id, concert_number_in_series
       FROM concert_times
       WHERE concert_series = $1 AND year = $2
       ORDER BY concert_number_in_series`,
			[series, scheduleYear]
		);
		return new Map(
			result.rows.map((row) => [row.concert_number_in_series as number, row.id as number])
		);
	} finally {
		connection.release();
	}
}

async function insertScheduleChoices(
	performerId: number,
	concertSeries: string,
	scheduleYear: number,
	choices: { slotId: number; rank: number | null; notAvailable: boolean }[]
) {
	const connection = await pool.connect();
	try {
		for (const choice of choices) {
			await connection.query(
				`INSERT INTO schedule_slot_choice
         (performer_id, concert_series, year, slot_id, rank, not_available)
         VALUES ($1, $2, $3, $4, $5, $6)`,
				[
					performerId,
					concertSeries,
					scheduleYear,
					choice.slotId,
					choice.rank,
					choice.notAvailable
				]
			);
		}
	} finally {
		connection.release();
	}
}

async function importTestPerformance({
	concertSeries,
	lottery
}: {
	concertSeries: string;
	lottery: number;
}): Promise<{ performerId: number; performanceId: number; performance: Performance }> {
	const className = `PT.${uniqueCounter}.A`;
	const performerName = `Program Test Performer ${uniqueCounter}`;
	uniqueCounter += 1;
	const imported: ImportPerformanceInterface = {
		class_name: className,
		performer: performerName,
		age: 12,
		lottery,
		email: `program.${uniqueCounter}@example.com`,
		phone: '111-222-3333',
		accompanist: 'Test Accompanist',
		instrument: 'Piano',
		musical_piece: [
			{
				title: `Program Piece ${className}`,
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

async function updatePerformance(performanceId: number, updates: Record<string, unknown>) {
	const entries = Object.entries(updates);
	if (entries.length === 0) {
		return;
	}
	const fields = entries.map(([key], index) => `${key} = $${index + 2}`).join(', ');
	const values = entries.map(([, value]) => value);
	const connection = await pool.connect();
	try {
		await connection.query(`UPDATE performance SET ${fields} WHERE id = $1`, [
			performanceId,
			...values
		]);
	} finally {
		connection.release();
	}
}

beforeAll(async () => {
	await seedConcertTimes(eastsideSeries, testYear, 4);
	await seedConcertoTimes(concertoSeries, testYear);
});

afterAll(async () => {
	await cleanupConcertTimes(eastsideSeries, testYear);
	await cleanupConcertTimes(concertoSeries, testYear);
});

afterEach(async () => {
	const connection = await pool.connect();
	try {
		await connection.query(
			`DELETE FROM schedule_slot_choice
       WHERE year = $1
         AND concert_series = ANY($2::text[])`,
			[testYear, [eastsideSeries, concertoSeries]]
		);
	} finally {
		connection.release();
	}

	while (importedPerformances.length > 0) {
		const performance = importedPerformances.pop();
		if (performance) {
			await performance.deleteAll();
		}
	}
});

describe('Program integration scheduling', () => {
	it('schedules all concerto performers into the single slot', async () => {
		const slotMap = await fetchSlotIdByNumber(concertoSeries, testYear);
		const concertoSlot = slotMap.get(0);
		expect(concertoSlot).toBeTypeOf('number');

		const performers = [] as { performanceId: number; performerId: number; lottery: number }[];
		for (let index = 1; index <= 15; index += 1) {
			const entry = await importTestPerformance({ concertSeries: concertoSeries, lottery: index });
			performers.push({
				performanceId: entry.performanceId,
				performerId: entry.performerId,
				lottery: index
			});
			await insertScheduleChoices(entry.performerId, concertoSeries, testYear, [
				{ slotId: concertoSlot!, rank: 1, notAvailable: false }
			]);
		}

		const program = new Program(testYear);
		await program.build();
		const scheduled = program.orderedPerformance.filter(
			(entry) => entry.concertSeries === concertoSeries
		);
		expect(scheduled).toHaveLength(15);
		const placements = new Map(scheduled.map((entry) => [entry.id, entry.concertNumberInSeries]));
		for (const performer of performers) {
			expect(placements.get(performer.performanceId)).toBe(0);
		}
	});

	it('fills eastside rank-1 seats by lowest lottery', async () => {
		const slotMap = await fetchSlotIdByNumber(eastsideSeries, testYear);
		const eastsideSlot = slotMap.get(1);
		expect(eastsideSlot).toBeTypeOf('number');

		const placements = new Map<number, number>();
		for (let index = 1; index <= 12; index += 1) {
			const entry = await importTestPerformance({ concertSeries: eastsideSeries, lottery: index });
			await insertScheduleChoices(entry.performerId, eastsideSeries, testYear, [
				{ slotId: eastsideSlot!, rank: 1, notAvailable: false }
			]);
			placements.set(entry.performanceId, index);
		}

		const program = new Program(testYear);
		await program.build();
		const eastsideOne = program.orderedPerformance.filter(
			(entry) => entry.concertSeries === eastsideSeries && entry.concertNumberInSeries === 1
		);
		expect(eastsideOne).toHaveLength(10);
		const lotteriesInConcert = eastsideOne.map((entry) => Number(entry.lottery)).sort((a, b) => a - b);
		expect(lotteriesInConcert).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

		const waitlist = program.orderedPerformance.filter(
			(entry) => entry.concertSeries === 'Waitlist'
		);
		const waitlistLotteries = waitlist.map((entry) => Number(entry.lottery)).sort((a, b) => a - b);
		expect(waitlistLotteries).toEqual([11, 12]);
	});

	it('does not allow rank-2 candidates to displace rank-1 assignments', async () => {
		const slotMap = await fetchSlotIdByNumber(eastsideSeries, testYear);
		const slotOne = slotMap.get(1);
		const slotTwo = slotMap.get(2);
		expect(slotOne).toBeTypeOf('number');
		expect(slotTwo).toBeTypeOf('number');

		const groupALotteries: number[] = [];
		for (let index = 0; index < 10; index += 1) {
			const lottery = 100 + index;
			groupALotteries.push(lottery);
			const entry = await importTestPerformance({ concertSeries: eastsideSeries, lottery });
			await insertScheduleChoices(entry.performerId, eastsideSeries, testYear, [
				{ slotId: slotOne!, rank: 1, notAvailable: false }
			]);
		}

		const groupBLotteries: number[] = [];
		for (let index = 0; index < 5; index += 1) {
			const lottery = 1 + index;
			groupBLotteries.push(lottery);
			const entry = await importTestPerformance({ concertSeries: eastsideSeries, lottery });
			await insertScheduleChoices(entry.performerId, eastsideSeries, testYear, [
				{ slotId: slotTwo!, rank: 1, notAvailable: false },
				{ slotId: slotOne!, rank: 2, notAvailable: false }
			]);
		}

		const program = new Program(testYear);
		await program.build();
		const eastsideOne = program.orderedPerformance.filter(
			(entry) => entry.concertSeries === eastsideSeries && entry.concertNumberInSeries === 1
		);
		const eastsideOneLotteries = eastsideOne.map((entry) => Number(entry.lottery)).sort((a, b) => a - b);
		expect(eastsideOneLotteries).toEqual(groupALotteries.sort((a, b) => a - b));

		const eastsideTwoLotteries = program.orderedPerformance
			.filter(
				(entry) => entry.concertSeries === eastsideSeries && entry.concertNumberInSeries === 2
			)
			.map((entry) => Number(entry.lottery))
			.sort((a, b) => a - b);
		expect(eastsideTwoLotteries).toEqual(groupBLotteries.sort((a, b) => a - b));
	});

	it('assigns overflow to rank-2 choices by lottery order', async () => {
		const slotMap = await fetchSlotIdByNumber(eastsideSeries, testYear);
		const slotOne = slotMap.get(1);
		const slotTwo = slotMap.get(2);
		expect(slotOne).toBeTypeOf('number');
		expect(slotTwo).toBeTypeOf('number');

		for (let index = 1; index <= 15; index += 1) {
			const entry = await importTestPerformance({ concertSeries: eastsideSeries, lottery: index });
			await insertScheduleChoices(entry.performerId, eastsideSeries, testYear, [
				{ slotId: slotOne!, rank: 1, notAvailable: false },
				{ slotId: slotTwo!, rank: 2, notAvailable: false }
			]);
		}

		const program = new Program(testYear);
		await program.build();
		const eastsideOneLotteries = program.orderedPerformance
			.filter(
				(entry) => entry.concertSeries === eastsideSeries && entry.concertNumberInSeries === 1
			)
			.map((entry) => Number(entry.lottery))
			.sort((a, b) => a - b);
		const eastsideTwoLotteries = program.orderedPerformance
			.filter(
				(entry) => entry.concertSeries === eastsideSeries && entry.concertNumberInSeries === 2
			)
			.map((entry) => Number(entry.lottery))
			.sort((a, b) => a - b);

		expect(eastsideOneLotteries).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
		expect(eastsideTwoLotteries).toEqual([11, 12, 13, 14, 15]);
	});

	it('waitlists performers once all ranked concerts are full', async () => {
		const slotMap = await fetchSlotIdByNumber(eastsideSeries, testYear);
		const slotOne = slotMap.get(1);
		const slotTwo = slotMap.get(2);
		expect(slotOne).toBeTypeOf('number');
		expect(slotTwo).toBeTypeOf('number');

		for (let index = 1; index <= 22; index += 1) {
			const entry = await importTestPerformance({ concertSeries: eastsideSeries, lottery: index });
			await insertScheduleChoices(entry.performerId, eastsideSeries, testYear, [
				{ slotId: slotOne!, rank: 1, notAvailable: false },
				{ slotId: slotTwo!, rank: 2, notAvailable: false }
			]);
		}

		const program = new Program(testYear);
		await program.build();
		const waitlistLotteries = program.orderedPerformance
			.filter((entry) => entry.concertSeries === 'Waitlist')
			.map((entry) => Number(entry.lottery))
			.sort((a, b) => a - b);
		expect(waitlistLotteries).toEqual([21, 22]);
	});

	it('ignores not-available ranked slots', async () => {
		const slotMap = await fetchSlotIdByNumber(eastsideSeries, testYear);
		const slotOne = slotMap.get(1);
		const slotTwo = slotMap.get(2);
		expect(slotOne).toBeTypeOf('number');
		expect(slotTwo).toBeTypeOf('number');

		const entry = await importTestPerformance({ concertSeries: eastsideSeries, lottery: 77 });
		await insertScheduleChoices(entry.performerId, eastsideSeries, testYear, [
			{ slotId: slotOne!, rank: 1, notAvailable: true },
			{ slotId: slotTwo!, rank: 2, notAvailable: false }
		]);

		const program = new Program(testYear);
		await program.build();
		const placement = program.orderedPerformance.find((performance) => performance.id === entry.performanceId);
		expect(placement?.concertSeries).toBe(eastsideSeries);
		expect(placement?.concertNumberInSeries).toBe(2);
	});

	it('overbooks eastside when chair override is set', async () => {
		const slotMap = await fetchSlotIdByNumber(eastsideSeries, testYear);
		const slotOne = slotMap.get(1);
		expect(slotOne).toBeTypeOf('number');

		for (let index = 1; index <= 10; index += 1) {
			const entry = await importTestPerformance({ concertSeries: eastsideSeries, lottery: index });
			await insertScheduleChoices(entry.performerId, eastsideSeries, testYear, [
				{ slotId: slotOne!, rank: 1, notAvailable: false }
			]);
		}

		const overrideEntry = await importTestPerformance({ concertSeries: eastsideSeries, lottery: 999 });
		await updatePerformance(overrideEntry.performanceId, { chair_override: true });
		await insertScheduleChoices(overrideEntry.performerId, eastsideSeries, testYear, [
			{ slotId: slotOne!, rank: 1, notAvailable: false }
		]);

		const program = new Program(testYear);
		await program.build();
		const eastsideOne = program.orderedPerformance.filter(
			(entry) => entry.concertSeries === eastsideSeries && entry.concertNumberInSeries === 1
		);
		expect(eastsideOne).toHaveLength(11);
		const overridePlacement = eastsideOne.find((entry) => entry.id === overrideEntry.performanceId);
		expect(overridePlacement).toBeDefined();
	});

	it('preserves performance_order within a concert program', async () => {
		const slotMap = await fetchSlotIdByNumber(eastsideSeries, testYear);
		const slotOne = slotMap.get(1);
		expect(slotOne).toBeTypeOf('number');

		const performerA = await importTestPerformance({ concertSeries: eastsideSeries, lottery: 201 });
		const performerB = await importTestPerformance({ concertSeries: eastsideSeries, lottery: 202 });
		const performerC = await importTestPerformance({ concertSeries: eastsideSeries, lottery: 203 });

		await updatePerformance(performerA.performanceId, { performance_order: 30 });
		await updatePerformance(performerB.performanceId, { performance_order: 10 });
		await updatePerformance(performerC.performanceId, { performance_order: 20 });

		for (const entry of [performerA, performerB, performerC]) {
			await insertScheduleChoices(entry.performerId, eastsideSeries, testYear, [
				{ slotId: slotOne!, rank: 1, notAvailable: false }
			]);
		}

		const program = new Program(testYear);
		await program.build();
		const ordered = program
			.retrieveAllConcertPrograms()
			.filter((entry) => entry.concertSeries === eastsideSeries && entry.concertNumberInSeries === 1);

		const orderedIds = ordered.map((entry) => entry.id);
		expect(orderedIds).toEqual([
			performerB.performanceId,
			performerC.performanceId,
			performerA.performanceId
		]);
	});
});
