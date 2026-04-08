import { describe, expect, it } from 'vitest';
import { buildProgramExportUrl, canExportProgram, parseProgramSelection } from '$lib/programExport';

describe('program export helpers', () => {
	it('parses a concrete concert selection', () => {
		expect(parseProgramSelection('Eastside-2')).toEqual({
			concertNumberInSeries: 2,
			concertSeries: 'Eastside'
		});
	});

	it('rejects non-concert selections for Word export', () => {
		expect(canExportProgram('All')).toBe(false);
		expect(canExportProgram('Waitlist')).toBe(false);
		expect(buildProgramExportUrl('Waitlist')).toBeNull();
	});

	it('builds the selected-concert program export url', () => {
		expect(buildProgramExportUrl('Concerto-0')).toBe(
			'/api/program/?concertNum=0&concertSeries=Concerto&format=docx'
		);
	});
});
