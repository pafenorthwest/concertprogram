import { fail, json } from '@sveltejs/kit';
import { isAuthorized } from '$lib/server/apiAuth';
import {
	type ComposerInterface, type MusicalTitleInterface,
	type OrderedPerformanceInterface,
	Program,
	type ProgramCSVExportInterface
} from '$lib/server/program';
import { updateProgramOrder } from '$lib/server/db';
import {auth_code} from '$env/static/private';
import { pafe_series } from '$lib/server/common';
import Papa from 'papaparse';

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

export async function GET({ request, cookies }) {
	// Get the Authorization header
	const pafeAuth = cookies.get('pafe_auth')
	if (pafeAuth != auth_code && !isAuthorized(request.headers.get('Authorization'))) {
		return new Response('Unauthorized', { status: 401 });
	}

	const download_headers = {
		'Content-Type': 'text/csv',
		'Content-Disposition': 'attachment; filename="pafeprogram.csv"'
	};

	try {
		const program = new Program(pafe_series())
		await program.build()

		if (!program) {
			fail(400, {error: 'No Data Passed in, Try Again'})
		}

		const flattenedArray: ProgramCSVExportInterface[] = program.retrieveAllConcertPrograms().map(flattenProgram);

		const csv = Papa.unparse(flattenedArray);
		return new Response(csv, { headers: download_headers });

	} catch (error) {
		fail(500, {error: `Failed to process the request ${(error as Error).message}`})
	}

}

function flattenProgram(input: OrderedPerformanceInterface): ProgramCSVExportInterface {
	return {
		id: input.id,
		performerId: input.performerId,
		performerName: input.performerName,
		instrument: input.instrument,
		grade: input.grade,
		accompanist: input.accompanist,

		musicalPieceOneTitle: input.musicalTitles[0].title,
		musicalPieceOneMovement: input.musicalTitles[0].movement,
		musicalPieceOneComposer1: safeStringComposer(input.musicalTitles[0]? input.musicalTitles[0] : null,0),
		musicalPieceOneComposer2: safeStringComposer(input.musicalTitles[0]? input.musicalTitles[0] : null,1),
		musicalPieceOneComposer3: safeStringComposer(input.musicalTitles[0]? input.musicalTitles[0] : null,2),

		musicalPieceTwoTitle: input.musicalTitles[1] ? input.musicalTitles[1].title : '',
		musicalPieceTwoMovement:input.musicalTitles[1] ? input.musicalTitles[1].movement : '',
		musicalPieceTwoComposer1: safeStringComposer(input.musicalTitles[1]? input.musicalTitles[1] : null,0),
		musicalPieceTwoComposer2: safeStringComposer(input.musicalTitles[1]? input.musicalTitles[1] : null,1),
		musicalPieceTwoComposer3: safeStringComposer(input.musicalTitles[1]? input.musicalTitles[1] : null,2)
	}
}

function safeStringComposer(input: MusicalTitleInterface | null , referenceLoc: number ): string {
	if (input == null) { return '' }
	if (input.composers == null || input.composers.length <= referenceLoc) { return '' }
	if (input.composers[referenceLoc] == null) { return '' }
	return input.composers[referenceLoc].printedName + ' (' + input.composers[referenceLoc].yearsActive + ')';
}
