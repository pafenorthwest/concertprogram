import { pool } from '$lib/server/db';
import type { ScheduleChoice } from '$lib/types/schedule';

type ScheduleSlotChoiceRow = { slot_id: number; rank: number | null; not_available: boolean };

export class ScheduleRepository {
	async fetchChoices(
		performerId: number,
		concertSeries: string,
		year: number
	): Promise<ScheduleChoice | null> {
		const connection = await pool.connect();
		try {
			const result = await connection.query<ScheduleSlotChoiceRow>(
				`SELECT slot_id, rank, not_available
         FROM schedule_slot_choice
         WHERE performer_id = $1
           AND concert_series = $2
           AND year = $3
         ORDER BY slot_id`,
				[performerId, concertSeries, year]
			);

			if (!result.rowCount) {
				return null;
			}

			return {
				performerId,
				concertSeries,
				year,
				slots: result.rows.map((row) => ({
					slotId: Number(row.slot_id),
					rank: row.rank == null ? null : Number(row.rank),
					notAvailable: row.not_available
				}))
			};
		} finally {
			connection.release();
		}
	}

	async upsertChoices(choice: ScheduleChoice): Promise<void> {
		const connection = await pool.connect();
		try {
			await connection.query('BEGIN');
			await connection.query(
				`DELETE FROM schedule_slot_choice
         WHERE performer_id = $1
           AND concert_series = $2
           AND year = $3`,
				[choice.performerId, choice.concertSeries, choice.year]
			);

			const insertSQL = `INSERT INTO schedule_slot_choice
        (performer_id, concert_series, year, slot_id, rank, not_available)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (performer_id, concert_series, year, slot_id)
       DO UPDATE SET rank = EXCLUDED.rank,
                    not_available = EXCLUDED.not_available,
                    updated_at = NOW()`;

			for (const slot of choice.slots) {
				await connection.query(insertSQL, [
					choice.performerId,
					choice.concertSeries,
					choice.year,
					slot.slotId,
					slot.rank,
					slot.notAvailable
				]);
			}

			await connection.query('COMMIT');
		} catch (error) {
			await connection.query('ROLLBACK');
			throw error;
		} finally {
			connection.release();
		}
	}
}
