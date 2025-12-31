import type {
	ScheduleChoice,
	ScheduleSubmission,
	ScheduleViewModel,
	Slot
} from '$lib/types/schedule';

type ScheduleContext = { performerId: number; concertSeries: string; year: number; slots: Slot[] };

const fieldNames = {
	rank: (slotId: number) => `slot-${slotId}-rank`,
	notAvailable: (slotId: number) => `slot-${slotId}-not-available`,
	confirm: (slotId: number) => `slot-${slotId}-confirm`
};

function coerceRank(value: FormDataEntryValue | null, slotCount: number): number | null {
	if (typeof value !== 'string' || value.trim() === '') {
		return null;
	}
	const numeric = Number(value);
	if (!Number.isInteger(numeric)) {
		return null;
	}
	if (numeric < 1 || numeric > slotCount) {
		return null;
	}
	return numeric;
}

function buildSlotLookup(
	choice: ScheduleChoice | null
): Map<number, ScheduleChoice['slots'][number]> {
	const lookup = new Map<number, ScheduleChoice['slots'][number]>();
	if (!choice) {
		return lookup;
	}
	for (const slot of choice.slots) {
		lookup.set(slot.slotId, slot);
	}
	return lookup;
}

export class ScheduleMapper {
	static toViewModel(slots: Slot[], choice: ScheduleChoice | null): ScheduleViewModel {
		const slotCount = slots.length;
		const slotLookup = buildSlotLookup(choice);

		if (slotCount === 1) {
			return {
				mode: 'confirm-only',
				slotCount: 1,
				slots: slots.map((slot) => {
					const saved = slotLookup.get(slot.id);
					const notAvailable = saved?.notAvailable ?? false;
					const confirmed = !notAvailable && (saved?.rank ?? null) === 1;
					return { slotId: slot.id, displayTime: slot.displayTime, confirmed, notAvailable };
				})
			};
		}

		const rankOptions = Array.from({ length: slotCount }, (_, index) => String(index + 1));

		return {
			mode: 'rank-choice',
			slotCount,
			slots: slots.map((slot) => {
				const saved = slotLookup.get(slot.id);
				const notAvailable = saved?.notAvailable ?? false;
				return {
					slotId: slot.id,
					displayTime: slot.displayTime,
					rank: notAvailable ? null : (saved?.rank ?? null),
					notAvailable
				};
			}),
			rankOptions
		};
	}

	static fromFormData(formData: FormData, context: ScheduleContext): ScheduleSubmission {
		const slotCount = context.slots.length;
		const confirmOnly = slotCount === 1;

		return {
			performerId: context.performerId,
			concertSeries: context.concertSeries,
			year: context.year,
			slots: context.slots.map((slot) => {
				const notAvailable = formData.get(fieldNames.notAvailable(slot.id)) !== null;
				if (confirmOnly) {
					const confirmed = formData.get(fieldNames.confirm(slot.id)) !== null;
					return { slotId: slot.id, rank: !notAvailable && confirmed ? 1 : null, notAvailable };
				}

				const rankValue = coerceRank(formData.get(fieldNames.rank(slot.id)), slotCount);
				return { slotId: slot.id, rank: notAvailable ? null : rankValue, notAvailable };
			})
		};
	}
}

export const scheduleFieldNames = fieldNames;
