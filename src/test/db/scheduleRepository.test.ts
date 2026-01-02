import { afterEach, describe, expect, it } from 'vitest';
import { pool } from '$lib/server/db';
import { ScheduleRepository } from '$lib/server/scheduleRepository';

const repository = new ScheduleRepository();

const performerId = 99991;
const concertSeries = 'RepoTestSeries';
const year = 2099;

async function cleanup() {
	const connection = await pool.connect();
	try {
		await connection.query(
			`DELETE FROM schedule_slot_choice
       WHERE performer_id = $1
         AND concert_series = $2
         AND year = $3`,
			[performerId, concertSeries, year]
		);
	} finally {
		connection.release();
	}
}

describe('ScheduleRepository', () => {
	afterEach(async () => {
		await cleanup();
	});

	it('persists partial ranks', async () => {
		await repository.upsertChoices({
			performerId,
			concertSeries,
			year,
			slots: [
				{ slotId: 1, rank: 1, notAvailable: false },
				{ slotId: 2, rank: null, notAvailable: false },
				{ slotId: 3, rank: 2, notAvailable: false }
			]
		});

		const stored = await repository.fetchChoices(performerId, concertSeries, year);
		expect(stored).not.toBeNull();
		expect(stored?.slots).toEqual([
			{ slotId: 1, rank: 1, notAvailable: false },
			{ slotId: 2, rank: null, notAvailable: false },
			{ slotId: 3, rank: 2, notAvailable: false }
		]);
	});

	it('persists not_available independently of rank', async () => {
		await repository.upsertChoices({
			performerId,
			concertSeries,
			year,
			slots: [
				{ slotId: 1, rank: 1, notAvailable: false },
				{ slotId: 2, rank: null, notAvailable: true }
			]
		});

		const stored = await repository.fetchChoices(performerId, concertSeries, year);
		expect(stored?.slots).toEqual([
			{ slotId: 1, rank: 1, notAvailable: false },
			{ slotId: 2, rank: null, notAvailable: true }
		]);
	});

	it('replaces prior rows when updating rankings', async () => {
		await repository.upsertChoices({
			performerId,
			concertSeries,
			year,
			slots: [
				{ slotId: 1, rank: 1, notAvailable: false },
				{ slotId: 2, rank: 2, notAvailable: false },
				{ slotId: 3, rank: null, notAvailable: true }
			]
		});

		await repository.upsertChoices({
			performerId,
			concertSeries,
			year,
			slots: [
				{ slotId: 1, rank: 1, notAvailable: false },
				{ slotId: 2, rank: null, notAvailable: false }
			]
		});

		const stored = await repository.fetchChoices(performerId, concertSeries, year);
		expect(stored?.slots).toEqual([
			{ slotId: 1, rank: 1, notAvailable: false },
			{ slotId: 2, rank: null, notAvailable: false }
		]);
	});
});
