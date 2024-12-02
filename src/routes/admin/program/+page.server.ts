import { getCachedTimeStamps } from '$lib/cache';

export async function load({ cookies }) {
	const pafeAuth = cookies.get('pafe_auth')
	const isAuthenticated =  !!pafeAuth;

	const concertStartTimes = getCachedTimeStamps()
	return {concert_times: concertStartTimes.data, isAuthenticated: isAuthenticated};
}