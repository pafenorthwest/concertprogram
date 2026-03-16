export type ProgramSelection = {
	concertNumberInSeries: number;
	concertSeries: string;
};

export function parseProgramSelection(value: string): ProgramSelection | null {
	if (!value.includes('-')) {
		return null;
	}

	const [concertSeries, concertNum] = value.split('-', 2);
	const concertNumberInSeries = Number(concertNum);
	if (!concertSeries || !Number.isInteger(concertNumberInSeries)) {
		return null;
	}

	return {
		concertSeries,
		concertNumberInSeries
	};
}

export function canExportProgram(value: string): boolean {
	const selection = parseProgramSelection(value);
	if (!selection) {
		return false;
	}

	return selection.concertSeries !== 'Waitlist';
}

export function buildProgramExportUrl(value: string): string | null {
	const selection = parseProgramSelection(value);
	if (!selection || !canExportProgram(value)) {
		return null;
	}

	const params = new URLSearchParams({
		concertNum: String(selection.concertNumberInSeries),
		concertSeries: selection.concertSeries,
		format: 'docx'
	});
	return `/api/program/?${params.toString()}`;
}
