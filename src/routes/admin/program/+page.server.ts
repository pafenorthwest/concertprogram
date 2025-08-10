import { getCachedTimeStamps } from '$lib/cache';
import { Program } from '$lib/server/program';
import { pafe_series } from '$lib/server/common';

export async function load({ cookies }) {
	const pafeAuth = cookies.get('pafe_auth');
	const isAuthenticated = !!pafeAuth;

	const concertStartTimes = getCachedTimeStamps();
	const program = new Program(pafe_series());
	await program.build();

	return {
		concert_times: concertStartTimes.data,
		program: program.retrieveAllConcertPrograms(),
		isAuthenticated: isAuthenticated
	};
}
