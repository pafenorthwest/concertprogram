import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import type { OrderedPerformanceInterface, ProgramComposerInterface } from '$lib/server/program';

const execFileAsync = promisify(execFile);

const DOCX_TEMPLATE_PATH = resolve(
	process.cwd(),
	'static/templates/pafe-eastside-concerts-template.docx'
);

const DOCX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

type ProgramDocxInput = {
	concertName: string;
	concertNumberInSeries: number;
	concertSeries: string;
	concertTime: string;
	entries: OrderedPerformanceInterface[];
};

type PieceRow = {
	leftText: string;
	leftWeight: 'bold' | 'plain';
	rightComposer: ProgramComposerInterface | null;
};

const PIECE_PARAGRAPH_PROPERTIES =
	'<w:pPr><w:tabs><w:tab w:val="left" w:leader="none" w:pos="5310"/></w:tabs><w:spacing w:after="0" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Arial" w:cs="Arial" w:eastAsia="Arial" w:hAnsi="Arial"/><w:sz w:val="23"/><w:szCs w:val="23"/></w:rPr></w:pPr>';
const PIECE_BOLD_RUN_PROPERTIES =
	'<w:rPr><w:rFonts w:ascii="Arial" w:cs="Arial" w:eastAsia="Arial" w:hAnsi="Arial"/><w:b w:val="1"/><w:bCs w:val="1"/><w:sz w:val="23"/><w:szCs w:val="23"/><w:rtl w:val="0"/></w:rPr>';
const PIECE_PLAIN_RUN_PROPERTIES =
	'<w:rPr><w:rFonts w:ascii="Arial" w:cs="Arial" w:eastAsia="Arial" w:hAnsi="Arial"/><w:sz w:val="23"/><w:szCs w:val="23"/><w:rtl w:val="0"/></w:rPr>';
const PERFORMER_PARAGRAPH_PROPERTIES =
	'<w:pPr><w:tabs><w:tab w:val="left" w:leader="none" w:pos="5310"/></w:tabs><w:spacing w:after="0" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Arial" w:cs="Arial" w:eastAsia="Arial" w:hAnsi="Arial"/><w:sz w:val="23"/><w:szCs w:val="23"/></w:rPr></w:pPr>';
const PERFORMER_LABEL_RUN_PROPERTIES =
	'<w:rPr><w:rFonts w:ascii="Arial" w:cs="Arial" w:eastAsia="Arial" w:hAnsi="Arial"/><w:sz w:val="23"/><w:szCs w:val="23"/><w:rtl w:val="0"/></w:rPr>';
const PERFORMER_VALUE_RUN_PROPERTIES =
	'<w:rPr><w:rFonts w:ascii="Arial" w:cs="Arial" w:eastAsia="Arial" w:hAnsi="Arial"/><w:b w:val="1"/><w:bCs w:val="1"/><w:sz w:val="23"/><w:szCs w:val="23"/><w:rtl w:val="0"/></w:rPr>';
const BLANK_PARAGRAPH =
	'<w:p w:rsidR="00000000" w:rsidDel="00000000" w:rsidP="00000000" w:rsidRDefault="00000000" w:rsidRPr="00000000" w14:paraId="00000007"><w:pPr><w:tabs><w:tab w:val="left" w:leader="none" w:pos="5310"/></w:tabs><w:spacing w:after="0" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Arial" w:cs="Arial" w:eastAsia="Arial" w:hAnsi="Arial"/><w:b w:val="1"/><w:bCs w:val="1"/></w:rPr></w:pPr><w:r w:rsidDel="00000000" w:rsidR="00000000" w:rsidRPr="00000000"><w:rPr><w:rtl w:val="0"/></w:rPr></w:r></w:p>';

export { DOCX_MIME_TYPE };

export function buildConcertHeading(input: ProgramDocxInput): string {
	if (input.concertSeries === 'Concerto') {
		return `38th ${input.concertName} Playoff Concert`;
	}

	return `38th ${input.concertName} Artists Concert #${input.concertNumberInSeries}`;
}

export function buildProgramHeaderXml(templateHeaderXml: string, input: ProgramDocxInput): string {
	return templateHeaderXml
		.replace(
			'Eastside Artists Concert #{{NumInSeries}}',
			escapeXml(buildConcertHeading(input)).slice(5)
		)
		.replace('{{ConcertTime}}', escapeXml(input.concertTime));
}

export function buildProgramDocumentXml(
	templateDocumentXml: string,
	input: ProgramDocxInput
): string {
	const documentStartMatch = templateDocumentXml.match(/^[\s\S]*?<w:body>/);
	const sectionMatch = templateDocumentXml.match(/<w:sectPr[\s\S]*<\/w:sectPr>/);
	if (!documentStartMatch || !sectionMatch) {
		throw new Error('DOCX template document is missing required body structure');
	}

	const bodyParagraphs = [
		BLANK_PARAGRAPH,
		BLANK_PARAGRAPH,
		BLANK_PARAGRAPH,
		...input.entries.flatMap((entry, entryIndex) => {
			const entryParagraphs = entry.musicalTitles.flatMap((piece) => {
				const rows = buildPieceRows(piece.title, piece.movement, piece.contributors);
				return rows.map(renderPieceParagraph);
			});

			entryParagraphs.push(
				renderPerformerParagraph(
					`Soloist on ${entry.instrument}: `,
					entry.performerName,
					String(entry.age)
				)
			);

			if (entry.accompanist !== '') {
				entryParagraphs.push(renderSingleTextParagraph(`Pianist: ${entry.accompanist}`));
			}

			if (entryIndex !== input.entries.length - 1) {
				entryParagraphs.push(BLANK_PARAGRAPH);
			}

			return entryParagraphs;
		})
	];

	return `${documentStartMatch[0]}${bodyParagraphs.join('')}${sectionMatch[0]}</w:body></w:document>`;
}

export async function buildProgramDocx(
	input: ProgramDocxInput,
	templatePath = DOCX_TEMPLATE_PATH
): Promise<Buffer> {
	const workDir = await mkdtemp(join(tmpdir(), 'program-docx-'));
	const outputPath = `${workDir}.docx`;

	try {
		await execFileAsync('unzip', ['-q', templatePath, '-d', workDir]);

		const headerPath = join(workDir, 'word/header1.xml');
		const documentPath = join(workDir, 'word/document.xml');
		const [templateHeaderXml, templateDocumentXml] = await Promise.all([
			readFile(headerPath, 'utf8'),
			readFile(documentPath, 'utf8')
		]);

		const [headerXml, documentXml] = [
			buildProgramHeaderXml(templateHeaderXml, input),
			buildProgramDocumentXml(templateDocumentXml, input)
		];

		await Promise.all([writeFile(headerPath, headerXml), writeFile(documentPath, documentXml)]);
		await execFileAsync('zip', ['-qr', outputPath, '.'], { cwd: workDir });

		return await readFile(outputPath);
	} catch (error) {
		throw new Error(`Failed to build program DOCX ${(error as Error).message}`);
	} finally {
		await rm(workDir, { force: true, recursive: true });
		await rm(outputPath, { force: true });
	}
}

function buildPieceRows(
	title: string,
	movement: string,
	contributors: ProgramComposerInterface[]
): PieceRow[] {
	const leftLines = [title, movement].filter((line) => line.trim() !== '');
	const rightLines = contributors.length > 0 ? contributors : [null];
	const totalLines = Math.max(leftLines.length, rightLines.length);

	return Array.from({ length: totalLines }, (_, index) => ({
		leftText: leftLines[index] ?? '',
		leftWeight: index === 0 ? 'bold' : 'plain',
		rightComposer: rightLines[index] ?? null
	}));
}

function escapeXml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

function renderPieceParagraph(row: PieceRow): string {
	const leftRunProperties =
		row.leftWeight === 'bold' ? PIECE_BOLD_RUN_PROPERTIES : PIECE_PLAIN_RUN_PROPERTIES;
	const leftRuns =
		row.leftText !== ''
			? `<w:r w:rsidDel="00000000" w:rsidR="00000000" w:rsidRPr="00000000">${leftRunProperties}<w:t xml:space="preserve">${escapeXml(row.leftText)}</w:t></w:r>`
			: '';

	const needsTab = row.leftText !== '' || row.rightComposer !== null;
	const tabRun = needsTab
		? `<w:r w:rsidDel="00000000" w:rsidR="00000000" w:rsidRPr="00000000">${PIECE_PLAIN_RUN_PROPERTIES}<w:tab/></w:r>`
		: '';
	const rightRuns =
		row.rightComposer == null
			? ''
			: `<w:r w:rsidDel="00000000" w:rsidR="00000000" w:rsidRPr="00000000">${PIECE_BOLD_RUN_PROPERTIES}<w:t xml:space="preserve">${escapeXml(row.rightComposer.printedName)}</w:t></w:r><w:r w:rsidDel="00000000" w:rsidR="00000000" w:rsidRPr="00000000">${PIECE_PLAIN_RUN_PROPERTIES}<w:t xml:space="preserve"> (${escapeXml(row.rightComposer.yearsActive)})</w:t></w:r>`;

	return `<w:p w:rsidR="00000000" w:rsidDel="00000000" w:rsidP="00000000" w:rsidRDefault="00000000" w:rsidRPr="00000000" w14:paraId="00000004">${PIECE_PARAGRAPH_PROPERTIES}${leftRuns}${tabRun}${rightRuns}</w:p>`;
}

function renderPerformerParagraph(label: string, performerName: string, age: string): string {
	const escapedPerformerName = escapeXml(performerName);
	const escapedAge = escapeXml(age);
	const ageRun =
		escapedAge === ''
			? ''
			: `<w:r w:rsidDel="00000000" w:rsidR="00000000" w:rsidRPr="00000000">${PERFORMER_LABEL_RUN_PROPERTIES}<w:t xml:space="preserve"> ${escapedAge}</w:t></w:r>`;

	return `<w:p w:rsidR="00000000" w:rsidDel="00000000" w:rsidP="00000000" w:rsidRDefault="00000000" w:rsidRPr="00000000" w14:paraId="00000005">${PERFORMER_PARAGRAPH_PROPERTIES}<w:r w:rsidDel="00000000" w:rsidR="00000000" w:rsidRPr="00000000">${PERFORMER_LABEL_RUN_PROPERTIES}<w:t xml:space="preserve">${escapeXml(label)}</w:t></w:r><w:r w:rsidDel="00000000" w:rsidR="00000000" w:rsidRPr="00000000">${PERFORMER_VALUE_RUN_PROPERTIES}<w:t xml:space="preserve">${escapedPerformerName}</w:t></w:r>${ageRun}</w:p>`;
}

function renderSingleTextParagraph(value: string): string {
	return `<w:p w:rsidR="00000000" w:rsidDel="00000000" w:rsidP="00000000" w:rsidRDefault="00000000" w:rsidRPr="00000000" w14:paraId="00000006">${PERFORMER_PARAGRAPH_PROPERTIES}<w:r w:rsidDel="00000000" w:rsidR="00000000" w:rsidRPr="00000000">${PERFORMER_LABEL_RUN_PROPERTIES}<w:t xml:space="preserve">${escapeXml(value)}</w:t></w:r></w:p>`;
}
