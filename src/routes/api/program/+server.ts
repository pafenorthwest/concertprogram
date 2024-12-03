import { fail, json } from '@sveltejs/kit';
import { isAuthorized } from '$lib/server/apiAuth';
import type { OrderedPerformanceInterface } from '$lib/server/program';
import { updateProgramOrder } from '$lib/server/db';
import {auth_code} from '$env/static/private';

export async function POST({ request, cookies }) {
	// Get the Authorization header
	const pafeAuth = cookies.get('pafe_auth')
	if (pafeAuth != auth_code && !isAuthorized(request.headers.get('Authorization'))) {
		return new Response('Unauthorized', { status: 401 });
	}

	const access_control_headers = {
		'Access-Control-Allow-Origin': '*', // Allow all hosts
		'Access-Control-Allow-Methods': 'POST' // Specify allowed methods
	};

	try {
		const program: OrderedPerformanceInterface[]  = await request.json()

		if (!program) {
			fail(400, {error: 'No Data Passed in, Try Again'})
		}

		// loop over and send updates to db
		const updatePromises = program.map((program) =>
			updateProgramOrder(program.id, program.concertSeries, program.order)
		);

		// Execute all updates
		await Promise.all(updatePromises);
		return json({status: 200, body: {message: 'Update successful'}, headers: access_control_headers});

	} catch (error) {
		fail(500, {error: `Failed to process the request ${(error as Error).message}`})
	}
}
