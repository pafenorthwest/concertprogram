import { queryTable } from '$lib/server/db';
import { compareReformatISODate, displayReformatISODate, year } from '$lib/server/common';

export type ConcertRow = {
	concert_series: string;
	year: number;
	concert_number_in_series: number;
	start_time: string;
	normalizedStartTime: string;
	displayStartTime: string;
};

export type ConcertStartTime = {
	data: ConcertRow[];
	timestamp: string;
};

let concertStartTimes: ConcertStartTime | null = null;

export async function initializeCache() {
	concertStartTimes = {
		data: await fetchTimeStamps(),
		timestamp: new Date().toISOString()
	};
}

export function getCachedTimeStamps(): ConcertStartTime | null {
	return concertStartTimes;
}

async function fetchTimeStamps(): Promise<ConcertRow[]> {
	const res = await queryTable('concert_times');
	// Iterate through rows and update format on concert_time
	return res.rows
		.filter((row) => row.year === year())
		.map((row) => {
			row.normalizedStartTime = compareReformatISODate(row.start_time);
			row.displayStartTime = displayReformatISODate(row.start_time);
			return row;
		});
}
