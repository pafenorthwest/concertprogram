import { describe, expect, it } from 'vitest';
import { SlotCatalog, type SlotSourceRow } from '$lib/server/slotCatalog';
import { compareReformatISODate, displayReformatISODate } from '$lib/server/common';

const baseYear = 2026;
const series = 'Eastside';

const makeRow = (id: number, concertNumber: number, startTime: string): SlotSourceRow => ({
	id,
	concert_series: series,
	year: baseYear,
	concert_number_in_series: concertNumber,
	start_time: startTime
});

describe('SlotCatalog', () => {
	it('loads and normalizes a single slot', async () => {
		const startTime = '05/03/2026T16:00:00';
		const catalog = await SlotCatalog.load(series, baseYear, {
			loader: async () => [makeRow(10, 1, startTime)]
		});

		expect(catalog.slotCount).toBe(1);
		expect(catalog.slots).toHaveLength(1);
		expect(catalog.slots[0]).toMatchObject({
			id: 10,
			concertSeries: series,
			year: baseYear,
			concertNumberInSeries: 1,
			startTime: compareReformatISODate(startTime),
			displayTime: displayReformatISODate(startTime)
		});
	});

	it('loads multiple slots sorted by concert number', async () => {
		const rows = [
			makeRow(3, 3, '05/04/2026T14:00:00'),
			makeRow(1, 1, '05/03/2026T16:00:00'),
			makeRow(2, 2, '05/03/2026T19:00:00')
		];

		const catalog = await SlotCatalog.load(series, baseYear, {
			loader: async () => rows
		});

		expect(catalog.slotCount).toBe(3);
		expect(catalog.slots.map((slot) => slot.concertNumberInSeries)).toEqual([1, 2, 3]);
	});

	it('supports loading up to 10 slots', async () => {
		const rows = Array.from({ length: 10 }, (_, index) =>
			makeRow(
				index + 1,
				index + 1,
				`05/${String(index + 1).padStart(2, '0')}/2026T10:00:00`
			)
		).reverse();

		const catalog = await SlotCatalog.load(series, baseYear, {
			loader: async () => rows
		});

		expect(catalog.slotCount).toBe(10);
		expect(catalog.slots.map((slot) => slot.concertNumberInSeries)).toEqual(
			Array.from({ length: 10 }, (_, index) => index + 1)
		);
	});

	it('throws when duplicate slot ids are loaded', async () => {
		const rows = [
			makeRow(1, 1, '05/03/2026T16:00:00'),
			makeRow(1, 2, '05/03/2026T19:00:00')
		];

		await expect(
			SlotCatalog.load(series, baseYear, {
				loader: async () => rows
			})
		).rejects.toThrow('Duplicate slot ids detected during slot catalog load.');
	});
});
