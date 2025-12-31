import { describe, expect, it } from 'vitest';
import { ScheduleValidator } from '$lib/server/scheduleValidator';
import type { ScheduleSubmission } from '$lib/types/schedule';

const baseSubmission: ScheduleSubmission = {
	performerId: 101,
	concertSeries: 'TestSeries',
	year: 2030,
	slots: []
};

describe('ScheduleValidator', () => {
	it('accepts confirm-only submissions when confirmed', () => {
		const submission: ScheduleSubmission = {
			...baseSubmission,
			slots: [{ slotId: 1, rank: 1, notAvailable: false }]
		};

		const result = ScheduleValidator.validate(submission, 1);

		expect(result.valid).toBe(true);
	});

	it('accepts confirm-only submissions when marked not available', () => {
		const submission: ScheduleSubmission = {
			...baseSubmission,
			slots: [{ slotId: 1, rank: null, notAvailable: true }]
		};

		const result = ScheduleValidator.validate(submission, 1);

		expect(result.valid).toBe(true);
	});

	it('rejects confirm-only submissions without a selection', () => {
		const submission: ScheduleSubmission = {
			...baseSubmission,
			slots: [{ slotId: 1, rank: null, notAvailable: false }]
		};

		const result = ScheduleValidator.validate(submission, 1);

		expect(result.valid).toBe(false);
		expect(result.errors).toContain('Confirmation selection is required.');
	});

	it('accepts partial rankings when rank 1 is present', () => {
		const submission: ScheduleSubmission = {
			...baseSubmission,
			slots: [
				{ slotId: 1, rank: 1, notAvailable: false },
				{ slotId: 2, rank: null, notAvailable: false },
				{ slotId: 3, rank: 2, notAvailable: false }
			]
		};

		const result = ScheduleValidator.validate(submission, 3);

		expect(result.valid).toBe(true);
	});

	it('rejects duplicate rankings', () => {
		const submission: ScheduleSubmission = {
			...baseSubmission,
			slots: [
				{ slotId: 1, rank: 1, notAvailable: false },
				{ slotId: 2, rank: 1, notAvailable: false }
			]
		};

		const result = ScheduleValidator.validate(submission, 2);

		expect(result.valid).toBe(false);
		expect(result.errors).toContain('Duplicate rankings selected.');
	});

	it('rejects submissions missing a first-choice rank', () => {
		const submission: ScheduleSubmission = {
			...baseSubmission,
			slots: [
				{ slotId: 1, rank: 2, notAvailable: false },
				{ slotId: 2, rank: null, notAvailable: false }
			]
		};

		const result = ScheduleValidator.validate(submission, 2);

		expect(result.valid).toBe(false);
		expect(result.errors).toContain('At least one slot must be ranked as first choice.');
	});

	it('rejects not-available entries that include a rank', () => {
		const submission: ScheduleSubmission = {
			...baseSubmission,
			slots: [
				{ slotId: 1, rank: 1, notAvailable: false },
				{ slotId: 2, rank: 2, notAvailable: true }
			]
		};

		const result = ScheduleValidator.validate(submission, 2);

		expect(result.valid).toBe(false);
		expect(result.errors).toContain('Not-available selections cannot include a rank.');
	});
});
