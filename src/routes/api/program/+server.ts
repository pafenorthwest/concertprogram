import { json } from '@sveltejs/kit';
import { getCachedTimeStamps, refreshCachedTimeStamps, type ConcertRow } from '$lib/cache';
import {
	type MusicalTitleInterface,
	type OrderedPerformanceInterface,
	Program,
	type ProgramCSVExportInterface
} from '$lib/server/program';
import { year } from '$lib/server/common';
import { buildProgramDocx, DOCX_MIME_TYPE } from '$lib/server/programDocx';
import Papa from 'papaparse';

export async function GET({ url }) {
	try {
		const program = new Program(year());
		await program.build();

		if (!program) {
			return json({ status: 'error', message: 'Not Found' }, { status: 404 });
		}

		const exportFormat = url.searchParams.get('format');
		if (exportFormat === 'docx') {
			return await buildDocxResponse(program, url);
		}

		const flattenedArray: ProgramCSVExportInterface[] = program
			.retrieveAllConcertPrograms()
			.map(flattenProgram);

		const csv = Papa.unparse(flattenedArray);
		return new Response(csv, {
			headers: {
				'Content-Disposition': 'attachment; filename="pafeprogram.csv"',
				'Content-Type': 'text/csv'
			}
		});
	} catch (error) {
		console.error('Failed to process the program request', error);
		return json(
			{ status: 'error', message: `Failed to process the request ${(error as Error).message}` },
			{ status: 500 }
		);
	}
}

async function buildDocxResponse(program: Program, url: URL): Promise<Response> {
	const concertSeries = url.searchParams.get('concertSeries');
	const concertNum = Number(url.searchParams.get('concertNum'));
	if (!concertSeries || !Number.isInteger(concertNum) || concertSeries === 'Waitlist') {
		return json(
			{ status: 'error', message: 'Program export requires a specific concert selection' },
			{ status: 400 }
		);
	}

	await refreshCachedTimeStamps();
	const concertTimes = getCachedTimeStamps();
	const selectedConcert = concertTimes?.data.find(
		(concert) =>
			concert.concert_series === concertSeries && concert.concert_number_in_series === concertNum
	);
	if (!selectedConcert) {
		return json({ status: 'error', message: 'Concert not found' }, { status: 404 });
	}

	const programEntries = program
		.retrieveAllConcertPrograms()
		.filter(
			(entry) => entry.concertSeries === concertSeries && entry.concertNumberInSeries === concertNum
		);
	if (programEntries.length === 0) {
		return json({ status: 'error', message: 'Program entries not found' }, { status: 404 });
	}

	const docx = await buildProgramDocx({
		concertName: concertSeries,
		concertNumberInSeries: concertNum,
		concertSeries,
		concertTime: formatConcertTime(selectedConcert),
		entries: programEntries
	});
	const fileBaseName = `${concertSeries.toLowerCase()}-${concertNum}-program.docx`;

	return new Response(docx, {
		headers: {
			'Content-Disposition': `attachment; filename="${fileBaseName}"`,
			'Content-Type': DOCX_MIME_TYPE
		}
	});
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

function formatConcertTime(concert: ConcertRow): string {
	return concert.displayStartTime;
}
