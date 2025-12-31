import { getCachedTimeStamps, type ConcertRow } from '$lib/cache';
import { compareReformatISODate, displayReformatISODate } from '$lib/server/common';
import { queryTable } from '$lib/server/db';
import type { Slot } from '$lib/types/schedule';

export type SlotSourceRow = {
	id: number | string;
	concert_series: string;
	year: number;
	concert_number_in_series: number;
	start_time: string;
	normalizedStartTime?: string;
	displayStartTime?: string;
};

export type SlotLoader = (concertSeries: string, year: number) => Promise<SlotSourceRow[]>;

const defaultSlotLoader: SlotLoader = async () => {
	const cached = getCachedTimeStamps();
	if (cached?.data?.length) {
		return cached.data;
	}

	const res = await queryTable('concert_times');
	return (res.rows as ConcertRow[]).map((row) => ({
		...row,
		normalizedStartTime: compareReformatISODate(String(row.start_time)),
		displayStartTime: displayReformatISODate(String(row.start_time))
	}));
};

function normalizeSlot(row: SlotSourceRow): Slot {
	const slotId = Number(row.id);
	if (!Number.isInteger(slotId)) {
		throw new Error('Invalid slot id received during slot catalog load.');
	}
	const normalizedStartTime =
		row.normalizedStartTime ?? compareReformatISODate(String(row.start_time));
	const displayStartTime = row.displayStartTime ?? displayReformatISODate(String(row.start_time));

	return {
		id: slotId,
		concertSeries: row.concert_series,
		year: row.year,
		concertNumberInSeries: row.concert_number_in_series,
		startTime: normalizedStartTime,
		displayTime: displayStartTime
	};
}

export class SlotCatalog {
	readonly slots: Slot[];

	constructor(slots: Slot[]) {
		this.slots = slots;
	}

	get slotCount(): number {
		return this.slots.length;
	}

	static async load(
		concertSeries: string,
		year: number,
		options?: { loader?: SlotLoader }
	): Promise<SlotCatalog> {
		const loader = options?.loader ?? defaultSlotLoader;
		const rows = await loader(concertSeries, year);

		const slots = rows
			.filter((row) => row.concert_series === concertSeries && row.year === year)
			.slice()
			.sort((a, b) => a.concert_number_in_series - b.concert_number_in_series)
			.map((row) => normalizeSlot(row));

		const ids = new Set(slots.map((slot) => slot.id));
		if (ids.size !== slots.length) {
			throw new Error('Duplicate slot ids detected during slot catalog load.');
		}

		return new SlotCatalog(slots);
	}
}
