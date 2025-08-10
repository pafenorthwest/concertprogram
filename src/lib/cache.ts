import { queryTable } from '$lib/server/db';
import { compareReformatISODate, displayReformatISODate, pafe_series } from '$lib/server/common';

let concertStartTimes;

export async function initializeCache() {
	concertStartTimes = {
		data: await fetchTimeStamps(),
		timestamp: new Date().toISOString()
	};
}

export function getCachedTimeStamps() {
	return concertStartTimes;
}

async function fetchTimeStamps() {
	const res = await queryTable('concert_times');
	// Iterate through rows and update format on concert_time
	return res.rows
		.filter((row) => row.pafe_series === pafe_series())
		.map((row) => {
			row.normalizedStartTime = compareReformatISODate(row.start_time);
			row.displayStartTime = displayReformatISODate(row.start_time);
			return row;
		});
}
