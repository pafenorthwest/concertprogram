import { describe, expect, it } from 'vitest';
import { ScheduleMapper, scheduleFieldNames } from '$lib/server/scheduleMapper';
import type { ScheduleChoice, Slot } from '$lib/types/schedule';

const makeSlots = (count: number): Slot[] =>
	Array.from({ length: count }, (_, index) => ({
		id: index + 1,
		concertSeries: 'TestSeries',
		year: 2030,
		concertNumberInSeries: index + 1,
		startTime: `2030-05-${String(index + 1).padStart(2, '0')}T10:00:00`,
		displayTime: `Slot ${index + 1}`
	}));

const baseContext = {
	performerId: 42,
	concertSeries: 'TestSeries',
	year: 2030
};

describe('ScheduleMapper', () => {
	it('maps empty confirm-only state', () => {
		const slots = makeSlots(1);
		const viewModel = ScheduleMapper.toViewModel(slots, null);

		expect(viewModel).toEqual({
			mode: 'confirm-only',
			slotCount: 1,
			slots: [
				{
					slotId: 1,
					displayTime: 'Slot 1',
					confirmed: false,
					notAvailable: false
				}
			]
		});
	});

	it('maps saved confirm-only choice', () => {
		const slots = makeSlots(1);
		const choice: ScheduleChoice = {
			performerId: 42,
			concertSeries: 'TestSeries',
			year: 2030,
			slots: [{ slotId: 1, rank: 1, notAvailable: false }]
		};

		const viewModel = ScheduleMapper.toViewModel(slots, choice);

		expect(viewModel).toEqual({
			mode: 'confirm-only',
			slotCount: 1,
			slots: [
				{
					slotId: 1,
					displayTime: 'Slot 1',
					confirmed: true,
					notAvailable: false
				}
			]
		});
	});

	it('maps rank-choice view model with mixed availability', () => {
		const slots = makeSlots(2);
		const choice: ScheduleChoice = {
			performerId: 42,
			concertSeries: 'TestSeries',
			year: 2030,
			slots: [
				{ slotId: 1, rank: 1, notAvailable: false },
				{ slotId: 2, rank: null, notAvailable: true }
			]
		};

		const viewModel = ScheduleMapper.toViewModel(slots, choice);

		expect(viewModel.mode).toBe('rank-choice');
		expect(viewModel.slotCount).toBe(2);
		expect(viewModel.rankOptions).toEqual(['1', '2']);
		expect(viewModel.slots).toEqual([
			{ slotId: 1, displayTime: 'Slot 1', rank: 1, notAvailable: false },
			{ slotId: 2, displayTime: 'Slot 2', rank: null, notAvailable: true }
		]);
	});

	it('supports rank-choice mapping with four slots', () => {
		const slots = makeSlots(4);
		const viewModel = ScheduleMapper.toViewModel(slots, null);

		expect(viewModel.mode).toBe('rank-choice');
		expect(viewModel.slotCount).toBe(4);
		expect(viewModel.rankOptions).toEqual(['1', '2', '3', '4']);
		expect(viewModel.slots).toHaveLength(4);
	});

	it('supports rank-choice mapping with ten slots', () => {
		const slots = makeSlots(10);
		const viewModel = ScheduleMapper.toViewModel(slots, null);

		expect(viewModel.mode).toBe('rank-choice');
		expect(viewModel.slotCount).toBe(10);
		expect(viewModel.rankOptions).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
		expect(viewModel.slots).toHaveLength(10);
	});

	it('maps confirm-only form payload into submission', () => {
		const slots = makeSlots(1);
		const formData = new FormData();
		formData.set(scheduleFieldNames.confirm(1), 'on');
		formData.set(scheduleFieldNames.notAvailable(1), 'on');

		const submission = ScheduleMapper.fromFormData(formData, {
			...baseContext,
			slots
		});

		expect(submission.slots).toEqual([{ slotId: 1, rank: null, notAvailable: true }]);
	});

	it('maps rank-choice form payload into submission', () => {
		const slots = makeSlots(4);
		const formData = new FormData();
		formData.set(scheduleFieldNames.rank(1), '1');
		formData.set(scheduleFieldNames.rank(2), '');
		formData.set(scheduleFieldNames.rank(3), '2');
		formData.set(scheduleFieldNames.notAvailable(2), 'on');
		formData.set(scheduleFieldNames.rank(4), '99');

		const submission = ScheduleMapper.fromFormData(formData, {
			...baseContext,
			slots
		});

		expect(submission.slots).toEqual([
			{ slotId: 1, rank: 1, notAvailable: false },
			{ slotId: 2, rank: null, notAvailable: true },
			{ slotId: 3, rank: 2, notAvailable: false },
			{ slotId: 4, rank: null, notAvailable: false }
		]);
	});
});
