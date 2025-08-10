import { describe, it, expect } from 'vitest';
import { createDBSchedule, getDBSchedule } from '$lib/server/db';
import { displayReformatISODate } from '$lib/server/common';

describe('Database Schedule Operations', () => {
	it('should create and retrieve schedule with specified parameters', async () => {
		const performer_id = 10000;
		const concert_series = 'testing';
		const year = 2033;
		const first_concert_time = '04/07/2033 7:00:00 PM';
		const expected_date_string = '07 Apr 2033, 07 pm';

		// Create a schedule entry
		await createDBSchedule(
			performer_id,
			concert_series,
			year,
			first_concert_time,
			null,
			null,
			null
		);

		// Retrieve the schedule entry
		const result = await getDBSchedule(performer_id, concert_series, year);
		const db_first_choice_time = displayReformatISODate(result.rows[0].first_choice_time);

		// Verify the result
		expect(result).toBeDefined();
		expect(result.rowCount).toBe(1);
		expect(result.rows[0].performer_id).toBe(performer_id);
		expect(result.rows[0].concert_series).toBe(concert_series);
		expect(result.rows[0].year).toBe(year);
		expect(db_first_choice_time).toBe(expected_date_string);
	});
});
