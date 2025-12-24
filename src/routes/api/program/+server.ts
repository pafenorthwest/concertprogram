import { fail, json } from '@sveltejs/kit';
import {
	type MusicalTitleInterface,
	type OrderedPerformanceInterface,
	Program,
	type ProgramCSVExportInterface
} from '$lib/server/program';
import { year } from '$lib/server/common';
import Papa from 'papaparse';

export async function GET() {
	const download_headers = {
		'Content-Type': 'text/csv',
		'Content-Disposition': 'attachment; filename="pafeprogram.csv"'
	};

	try {
		const program = new Program(year());
		await program.build();

		if (!program) {
			return json({ status: 'error', message: 'Not Found' }, { status: 404 });
		}

		const flattenedArray: ProgramCSVExportInterface[] = program
			.retrieveAllConcertPrograms()
			.map(flattenProgram);

		const csv = Papa.unparse(flattenedArray);
		return new Response(csv, { headers: download_headers });
	} catch (error) {
		fail(500, { error: `Failed to process the request ${(error as Error).message}` });
	}
}

function flattenProgram(input: OrderedPerformanceInterface): ProgramCSVExportInterface {
	return {
		concertSeries: input.concertSeries,
		concertNum: input.concertNumberInSeries,
		id: input.id ? input.id : 0,
		performerId: input.performerId ? input.performerId : 0,
		performerName: input.performerName ? input.performerName : '',
		instrument: input.instrument ? input.instrument : '',
		age: input.age ? input.age : 0,
		accompanist: input.accompanist ? input.accompanist : '',

		musicalPieceOneTitle: safeStringTitle(input.musicalTitles[0]),
		musicalPieceOneMovement: safeStringMovement(input.musicalTitles[0]),
		musicalPieceOneComposer1: safeStringComposer(
			input.musicalTitles[0] ? input.musicalTitles[0] : null,
			0
		),
		musicalPieceOneComposer2: safeStringComposer(
			input.musicalTitles[0] ? input.musicalTitles[0] : null,
			1
		),
		musicalPieceOneComposer3: safeStringComposer(
			input.musicalTitles[0] ? input.musicalTitles[0] : null,
			2
		),

		musicalPieceTwoTitle: safeStringTitle(input.musicalTitles[1]),
		musicalPieceTwoMovement: safeStringMovement(input.musicalTitles[1]),
		musicalPieceTwoComposer1: safeStringComposer(
			input.musicalTitles[1] ? input.musicalTitles[1] : null,
			0
		),
		musicalPieceTwoComposer2: safeStringComposer(
			input.musicalTitles[1] ? input.musicalTitles[1] : null,
			1
		),
		musicalPieceTwoComposer3: safeStringComposer(
			input.musicalTitles[1] ? input.musicalTitles[1] : null,
			2
		),

		duration: input.duration,
		comment: input.comment
	};
}

function safeStringComposer(input: MusicalTitleInterface | null, referenceLoc: number): string {
	if (input == null) {
		return '';
	}
	if (input.contributors == null || input.contributors.length <= referenceLoc) {
		return '';
	}
	if (input.contributors[referenceLoc] == null) {
		return '';
	}
	return (
		input.contributors[referenceLoc].printedName +
		' (' +
		input.contributors[referenceLoc].yearsActive +
		')'
	);
}

function safeStringMovement(input: MusicalTitleInterface | null): string {
	if (input == null) {
		return '';
	}
	if (input.movement == null) {
		return '';
	}
	return input.movement;
}

function safeStringTitle(input: MusicalTitleInterface | null): string {
	if (input == null) {
		return '';
	}
	if (input.title == null) {
		return '';
	}
	return input.title;
}
