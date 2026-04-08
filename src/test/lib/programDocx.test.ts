import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildProgramDocx, DOCX_MIME_TYPE } from '$lib/server/programDocx';
import type { OrderedPerformanceInterface } from '$lib/server/program';

describe('program docx export', () => {
	it('builds an eastside program with stacked contributors and performer lines', async () => {
		const docx = await buildProgramDocx({
			concertName: 'Eastside',
			concertNumberInSeries: 2,
			concertSeries: 'Eastside',
			concertTime: 'Saturday, May 3, 2025 - 4:00 PM',
			entries: [buildEntry()]
		});

		expect(docx.byteLength).toBeGreaterThan(0);
		expect(DOCX_MIME_TYPE).toContain('wordprocessingml.document');

		const { documentXml, headerXml } = inspectDocx(docx);
		expect(headerXml).toContain('>38<');
		expect(headerXml).toContain('>th<');
		expect(headerXml).toContain('Eastside Artists Concert #2');
		expect(headerXml).toContain('Saturday, May 3, 2025 - 4:00 PM');
		expect(documentXml).toContain('Concerto in C minor');
		expect(documentXml).toContain('3rd movement');
		expect(documentXml).toContain('Johann Christian Bach');
		expect(documentXml).toContain('Librettist Example');
		expect(documentXml).toContain('Soloist on Cello: ');
		expect(documentXml).toContain('>Example Performer<');
		expect(documentXml).toContain('> 14<');
		expect(documentXml).toContain('Pianist: Example Accompanist');
	});

	it('uses the concerto header wording without a concert number suffix', async () => {
		const docx = await buildProgramDocx({
			concertName: 'Concerto',
			concertNumberInSeries: 0,
			concertSeries: 'Concerto',
			concertTime: 'Sunday, May 4, 2025 - 7:00 PM',
			entries: [buildEntry()]
		});

		const { headerXml } = inspectDocx(docx);
		expect(headerXml).toContain('Concerto Playoff Concert');
		expect(headerXml).not.toContain('Concert #0');
	});
});

function buildEntry(): OrderedPerformanceInterface {
	return {
		accompanist: 'Example Accompanist',
		age: 14,
		chairOverride: false,
		comment: null,
		concertNumberInSeries: 2,
		concertSeries: 'Eastside',
		duration: 5,
		id: 1,
		instrument: 'Cello',
		lottery: '12345',
		musicalTitles: [
			{
				contributors: [
					{ printedName: 'Johann Christian Bach', yearsActive: '1735 - 1782' },
					{ printedName: 'Librettist Example', yearsActive: '1900 - 1950' }
				],
				movement: '3rd movement',
				title: 'Concerto in C minor'
			}
		],
		order: 0,
		performerId: 2,
		performerName: 'Example Performer'
	};
}

function inspectDocx(docx: Buffer): { documentXml: string; headerXml: string } {
	const tempDir = mkdtempSync(join(tmpdir(), 'program-docx-test-'));
	const docxPath = join(tempDir, 'program.docx');

	try {
		writeFileSync(docxPath, docx);
		const headerXml = execFileSync('unzip', ['-p', docxPath, 'word/header1.xml'], {
			encoding: 'utf8'
		});
		const documentXml = execFileSync('unzip', ['-p', docxPath, 'word/document.xml'], {
			encoding: 'utf8'
		});
		return { documentXml, headerXml };
	} finally {
		rmSync(tempDir, { force: true, recursive: true });
	}
}
