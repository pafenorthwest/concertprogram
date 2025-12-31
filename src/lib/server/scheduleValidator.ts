import type { ScheduleSubmission } from '$lib/types/schedule';

export type ScheduleValidationResult = {
	valid: boolean;
	errors: string[];
};

export class ScheduleValidator {
	static validate(submission: ScheduleSubmission, slotCount: number): ScheduleValidationResult {
		const errors: string[] = [];

		if (slotCount <= 0) {
			errors.push('No schedule slots available.');
			return { valid: false, errors };
		}

		if (submission.slots.length !== slotCount) {
			errors.push('Schedule payload does not match available slots.');
		}

		if (slotCount === 1) {
			const slot = submission.slots[0];
			if (!slot) {
				errors.push('Confirmation selection is required.');
				return { valid: false, errors };
			}

			if (slot.notAvailable) {
				return { valid: errors.length === 0, errors };
			}

			if (slot.rank !== 1) {
				errors.push('Confirmation selection is required.');
			}

			return { valid: errors.length === 0, errors };
		}

		const ranks: number[] = [];
		for (const slot of submission.slots) {
			if (slot.notAvailable) {
				if (slot.rank != null) {
					errors.push('Not-available selections cannot include a rank.');
				}
				continue;
			}

			if (slot.rank == null) {
				continue;
			}

			if (!Number.isInteger(slot.rank)) {
				errors.push('Rank selections must be integers.');
				continue;
			}

			if (slot.rank < 1 || slot.rank > slotCount) {
				errors.push('Rank selections must be within the available slot range.');
				continue;
			}

			ranks.push(slot.rank);
		}

		if (ranks.length === 0) {
			errors.push('No choices found please submit again with at least one ranked choice');
		}

		const uniqueRanks = new Set(ranks);
		if (uniqueRanks.size !== ranks.length) {
			errors.push('Duplicate rankings selected.');
		}

		if (!uniqueRanks.has(1)) {
			errors.push('At least one slot must be ranked as first choice.');
		}

		return { valid: errors.length === 0, errors };
	}
}
