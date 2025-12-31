import { afterAll, beforeAll, describe, it, assert, expect } from 'vitest';
import { chromium } from 'playwright';
import { Performance } from '$lib/server/import';
import { type ImportPerformanceInterface, year, parseMusicalPiece } from '$lib/server/common';
import { lookupByCode, pool } from '$lib/server/db';
import { ScheduleRepository } from '$lib/server/scheduleRepository';
import { SlotCatalog } from '$lib/server/slotCatalog';

const emmaCarterPerformance =
	'{ "class_name": "QQ.9-10.XE", "performer": "Emma Carter", "age": 12, "lottery": 123, "email": "uFiqpdx@example.com","phone": "999-555-4444","accompanist": "Zhi, Zhou","instrument": "Cello","musical_piece": [ {"title": "Concerto in C minor 3rd movement", "contributors": [ { "name": "Johann Christian Bach", "yearsActive": "None" }  ]  },{ "title": "Scherzo no.2 in B Flat Minor, op.31", "contributors": [  { "name": "Frédéric Chopin", "yearsActive": "None" }  ] } ], "concert_series": "Eastside"}';

const organSonataPerformance =
	'{ "class_name": "ORG.11-12.A", "performer": "Kai Organ", "age": 17, "lottery": 456, "email": "kai.organ@example.com","phone": "222-333-4444","accompanist": "Pat Riley","instrument": "Piano","musical_piece": [ {"title": "Organ Sonata No.6 in G major, BWV 530", "contributors": [ { "name": "Johann Sebastian Bach", "yearsActive": "1685-1750", "role": "Composer" }, { "name": "Béla Bartók", "yearsActive": "1881-1945", "role": "Arranger" } ] } ], "concert_series": "Concerto"}';

const twoSlotSeries = 'TwoSlotTest';
const tenSlotSeries = 'TenSlotTest';

const scheduleRepository = new ScheduleRepository();

async function importPerformance(performanceJson: string) {
	const imported: ImportPerformanceInterface = JSON.parse(performanceJson);
	const singlePerformance: Performance = new Performance();
	return singlePerformance.initialize(imported);
}

function makePerformanceJson({
	className,
	performer,
	age,
	lottery,
	concertSeries,
	musicalPieceTitle
}: {
	className: string;
	performer: string;
	age: number;
	lottery: number;
	concertSeries: string;
	musicalPieceTitle: string;
}) {
	return JSON.stringify({
		class_name: className,
		performer,
		age,
		lottery,
		email: `${performer.toLowerCase().replaceAll(' ', '.')}@example.com`,
		phone: '111-222-3333',
		accompanist: 'Test Accompanist',
		instrument: 'Piano',
		musical_piece: [
			{
				title: musicalPieceTitle,
				contributors: [{ name: 'Ludwig van Beethoven', yearsActive: '1770-1827' }]
			}
		],
		concert_series: concertSeries
	});
}

async function seedConcertTimes(series: string, seedYear: number, slotCount: number) {
	const connection = await pool.connect();
	try {
		await connection.query('DELETE FROM concert_times WHERE concert_series = $1 AND year = $2', [
			series,
			seedYear
		]);

		for (let index = 1; index <= slotCount; index += 1) {
			const startTime = `05/${String(index).padStart(2, '0')}/${seedYear}T10:00:00`;
			await connection.query(
				`INSERT INTO concert_times (concert_series, year, concert_number_in_series, start_time)
         VALUES ($1, $2, $3, $4)`,
				[series, seedYear, index, startTime]
			);
		}
	} finally {
		connection.release();
	}
}

async function cleanupConcertTimes(series: string, cleanupYear: number) {
	const connection = await pool.connect();
	try {
		await connection.query('DELETE FROM concert_times WHERE concert_series = $1 AND year = $2', [
			series,
			cleanupYear
		]);
	} finally {
		connection.release();
	}
}

async function deleteScheduleChoices(
	performerId: number,
	concertSeries: string,
	scheduleYear: number
) {
	const connection = await pool.connect();
	try {
		await connection.query(
			`DELETE FROM schedule_slot_choice
       WHERE performer_id = $1
         AND concert_series = $2
         AND year = $3`,
			[performerId, concertSeries, scheduleYear]
		);
	} finally {
		connection.release();
	}
}

const scheduleYear = year();

beforeAll(async () => {
	await seedConcertTimes(twoSlotSeries, scheduleYear, 2);
	await seedConcertTimes(tenSlotSeries, scheduleYear, 10);
});

afterAll(async () => {
	await cleanupConcertTimes(twoSlotSeries, scheduleYear);
	await cleanupConcertTimes(tenSlotSeries, scheduleYear);
});

describe('Valid Eastside page', () => {
	it('should insert carter', async () => {
		const importResults = await importPerformance(emmaCarterPerformance);
		console.log(
			`Success perfomerId ${importResults.performerId} performanceId ${importResults.performanceId}`
		);
		assert.isAbove(importResults.performerId, 0, 'expected performer ID greater than 0');
	});

	it('should display schedule page with ranked choices (playwright)', async () => {
		const importEmmaCarterResults = await importPerformance(emmaCarterPerformance);
		const EmmaCarterRecord = JSON.parse(emmaCarterPerformance);
		const EmmaCarterMusicPiece = parseMusicalPiece(EmmaCarterRecord.musical_piece[0].title);
		const slotCatalog = await SlotCatalog.load(EmmaCarterRecord.concert_series, scheduleYear);
		const [firstSlot, secondSlot, thirdSlot, fourthSlot] = slotCatalog.slots;

		const browser = await chromium.launch({ headless: true });
		const page = await browser.newPage();
		try {
			await page.goto('http://localhost:8888/schedule?code=123');
			await page.waitForSelector('text=Scheduling for Emma Carter');
			await page.waitForSelector('text=Performing Concerto in C minor');
			await page.waitForSelector('text=Lookup code 123');
			await page.waitForSelector('form#ranked-choice-form');

			const rankSelectIds = [
				`#slot-${firstSlot.id}-rank`,
				`#slot-${secondSlot.id}-rank`,
				`#slot-${thirdSlot.id}-rank`,
				`#slot-${fourthSlot.id}-rank`
			];
			for (const id of rankSelectIds) {
				const tagName = await page.$eval(id, (element) => element.tagName.toLowerCase());
				expect(tagName).toBe('select');
			}

			const durationTagName = await page.$eval('#duration', (element) =>
				element.tagName.toLowerCase()
			);
			expect(durationTagName).toBe('select');

			const commentTagName = await page.$eval('#comment', (element) =>
				element.tagName.toLowerCase()
			);
			expect(commentTagName).toBe('input');

			await page.selectOption(`#slot-${firstSlot.id}-rank`, '1');
			await page.selectOption(`#slot-${secondSlot.id}-rank`, '3');
			await page.selectOption(`#slot-${fourthSlot.id}-rank`, '2');
			await page.check(`#slot-${thirdSlot.id}-not-available`);
			await page.selectOption('#duration', '3');
			await page.fill('#comment', 'Thank you');

			await Promise.all([
				page.waitForURL('**', { waitUntil: 'networkidle' }),
				page.click('form#ranked-choice-form button[type="submit"]')
			]);
			const validateFormValues = async () => {
				await page.waitForSelector('text=Lookup code 123');
				const firstRankValue = await page.$eval(
					`#slot-${firstSlot.id}-rank`,
					(element) => (element as HTMLSelectElement).value
				);
				const secondRankValue = await page.$eval(
					`#slot-${secondSlot.id}-rank`,
					(element) => (element as HTMLSelectElement).value
				);
				const fourthRankValue = await page.$eval(
					`#slot-${fourthSlot.id}-rank`,
					(element) => (element as HTMLSelectElement).value
				);
				const thirdNotAvailableChecked = await page.$eval(
					`#slot-${thirdSlot.id}-not-available`,
					(element) => (element as HTMLInputElement).checked
				);
				const thirdRankDisabled = await page.$eval(
					`#slot-${thirdSlot.id}-rank`,
					(element) => (element as HTMLSelectElement).disabled
				);
				const durationValue = await page.$eval(
					'#duration',
					(element) => (element as HTMLSelectElement).value
				);
				const commentValue = await page.$eval(
					'#comment',
					(element) => (element as HTMLInputElement).value
				);
				expect(firstRankValue).toBe('1');
				expect(secondRankValue).toBe('3');
				expect(fourthRankValue).toBe('2');
				expect(thirdNotAvailableChecked).toBe(true);
				expect(thirdRankDisabled).toBe(true);
				expect(durationValue).toBe('3');
				expect(commentValue).toBe('Thank you');
			};

			await page.goto('http://localhost:8888/schedule?code=123');
			await validateFormValues();

			await page.reload({ waitUntil: 'networkidle' });
			await validateFormValues();
			const performanceResults = await lookupByCode('123');
			expect(performanceResults?.performance_duration).toBe(3);
			expect(performanceResults?.performance_comment).toBe('Thank you');
			expect(performanceResults?.lottery_code).toBe(123);
			expect(performanceResults?.musical_piece).toBe(EmmaCarterMusicPiece.titleWithoutMovement);
			expect(performanceResults?.concert_series).toBe(EmmaCarterRecord.concert_series);

			const performanceSchedule = await scheduleRepository.fetchChoices(
				importEmmaCarterResults.performerId,
				EmmaCarterRecord.concert_series,
				scheduleYear
			);
			expect(performanceSchedule?.slots).toEqual([
				{ slotId: firstSlot.id, rank: 1, notAvailable: false },
				{ slotId: secondSlot.id, rank: 3, notAvailable: false },
				{ slotId: thirdSlot.id, rank: null, notAvailable: true },
				{ slotId: fourthSlot.id, rank: 2, notAvailable: false }
			]);
		} finally {
			await deleteScheduleChoices(
				importEmmaCarterResults.performerId,
				EmmaCarterRecord.concert_series,
				scheduleYear
			);
			await browser.close();
		}
	});

	it('Valid Concerto page', async () => {
		const OrganSonataResults = await importPerformance(organSonataPerformance);
		const OrganSonataRecord = JSON.parse(organSonataPerformance);
		const OrganSonataMusicPeice = parseMusicalPiece(OrganSonataRecord.musical_piece[0].title);
		const slotCatalog = await SlotCatalog.load(OrganSonataRecord.concert_series, scheduleYear);
		const [slot] = slotCatalog.slots;

		const browser = await chromium.launch({ headless: true });
		const page = await browser.newPage();
		try {
			await page.goto('http://localhost:8888/schedule?code=456');
			await page.waitForSelector('text=Scheduling for Kai Organ');
			await page.waitForSelector('text=Performing Organ Sonata No.6 in G major, BWV 530');
			await page.waitForSelector('text=Lookup code 456');

			const checkboxTag = await page.$eval('#concert-confirm', (element) =>
				element.tagName.toLowerCase()
			);
			expect(checkboxTag).toBe('input');

			const durationTag = await page.$eval('#duration', (element) => element.tagName.toLowerCase());
			expect(durationTag).toBe('select');

			const commentTag = await page.$eval('#comment', (element) => element.tagName.toLowerCase());
			expect(commentTag).toBe('input');

			await page.check('#concert-confirm');
			await page.selectOption('#duration', '5');
			await page.fill('#comment', 'See you there');
			await Promise.all([
				page.waitForURL('**', { waitUntil: 'networkidle' }),
				page.click('form#concerto-confirmation button[type="submit"]')
			]);

			// Reload the schedule page to verify confirmation message and absence of form
			await page.goto('http://localhost:8888/schedule?code=456');

			await page.waitForSelector('text=You are all set, thank you for confirming you attendance');
			const concertoFormAfterSubmit = await page.$('form#concerto-confirmation');
			expect(concertoFormAfterSubmit).toBeNull();

			await page.reload();
			await page.waitForSelector('text=You are all set, thank you for confirming you attendance');
			const concertoFormAfterReload = await page.$('form#concerto-confirmation');
			expect(concertoFormAfterReload).toBeNull();

			const performanceResults = await lookupByCode('456');
			expect(performanceResults?.performance_duration).toBe(5);
			expect(performanceResults?.performance_comment).toBe('See you there');
			expect(performanceResults?.lottery_code).toBe(456);
			expect(performanceResults?.musical_piece).toBe(OrganSonataMusicPeice.titleWithoutMovement);
			expect(performanceResults?.concert_series).toBe(OrganSonataRecord.concert_series);

			const performanceSchedule = await scheduleRepository.fetchChoices(
				OrganSonataResults.performerId,
				OrganSonataRecord.concert_series,
				scheduleYear
			);
			expect(performanceSchedule?.slots).toEqual([
				{ slotId: slot.id, rank: 1, notAvailable: false }
			]);
		} finally {
			await deleteScheduleChoices(
				OrganSonataResults.performerId,
				OrganSonataRecord.concert_series,
				scheduleYear
			);
			await browser.close();
		}
	});
});

describe('Rank-choice variants', () => {
	it('supports rank-choice with two slots and partial rankings', async () => {
		const performanceJson = makePerformanceJson({
			className: 'TS.2.A',
			performer: 'Duo Player',
			age: 11,
			lottery: 2345,
			concertSeries: twoSlotSeries,
			musicalPieceTitle: 'Test Sonata in C'
		});
		const importResults = await importPerformance(performanceJson);
		const slotCatalog = await SlotCatalog.load(twoSlotSeries, scheduleYear);
		const [firstSlot, secondSlot] = slotCatalog.slots;

		const browser = await chromium.launch({ headless: true });
		const page = await browser.newPage();
		try {
			await page.goto('http://localhost:8888/schedule?code=2345');
			const rankSelects = page.locator('select[id$="-rank"]');
			const rankSelectCount = await rankSelects.count();
			expect(rankSelectCount).toBe(2);

			await page.selectOption(`#slot-${firstSlot.id}-rank`, '1');
			await Promise.all([
				page.waitForURL('**', { waitUntil: 'networkidle' }),
				page.click('form#ranked-choice-form button[type="submit"]')
			]);

			await page.goto('http://localhost:8888/schedule?code=2345');
			const firstRankValue = await page.$eval(
				`#slot-${firstSlot.id}-rank`,
				(element) => (element as HTMLSelectElement).value
			);
			const secondRankValue = await page.$eval(
				`#slot-${secondSlot.id}-rank`,
				(element) => (element as HTMLSelectElement).value
			);
			expect(firstRankValue).toBe('1');
			expect(secondRankValue).toBe('');

			const stored = await scheduleRepository.fetchChoices(
				importResults.performerId,
				twoSlotSeries,
				scheduleYear
			);
			expect(stored?.slots).toEqual([
				{ slotId: firstSlot.id, rank: 1, notAvailable: false },
				{ slotId: secondSlot.id, rank: null, notAvailable: false }
			]);
		} finally {
			await deleteScheduleChoices(importResults.performerId, twoSlotSeries, scheduleYear);
			await browser.close();
		}
	});

	it('supports rank-choice with ten slots', async () => {
		const performanceJson = makePerformanceJson({
			className: 'TS.10.A',
			performer: 'Ten Slot Performer',
			age: 12,
			lottery: 3456,
			concertSeries: tenSlotSeries,
			musicalPieceTitle: 'Test Suite in D'
		});
		const importResults = await importPerformance(performanceJson);

		const browser = await chromium.launch({ headless: true });
		const page = await browser.newPage();
		try {
			await page.goto('http://localhost:8888/schedule?code=3456');
			const rankSelects = page.locator('select[id$="-rank"]');
			const rankSelectCount = await rankSelects.count();
			expect(rankSelectCount).toBe(10);
			const optionCount = await rankSelects.first().locator('option').count();
			expect(optionCount).toBe(11);
		} finally {
			await deleteScheduleChoices(importResults.performerId, tenSlotSeries, scheduleYear);
			await browser.close();
		}
	});

	it('rejects duplicate rankings', async () => {
		const performanceJson = makePerformanceJson({
			className: 'TS.2.B',
			performer: 'Duplicate Rank',
			age: 13,
			lottery: 3457,
			concertSeries: twoSlotSeries,
			musicalPieceTitle: 'Duplicate Sonata'
		});
		const importResults = await importPerformance(performanceJson);
		const slotCatalog = await SlotCatalog.load(twoSlotSeries, scheduleYear);
		const [firstSlot, secondSlot] = slotCatalog.slots;

		const browser = await chromium.launch({ headless: true });
		const page = await browser.newPage();
		try {
			await page.goto('http://localhost:8888/schedule?code=3457');
			await page.selectOption(`#slot-${firstSlot.id}-rank`, '1');
			await page.selectOption(`#slot-${secondSlot.id}-rank`, '1');

			const [response] = await Promise.all([
				page.waitForResponse(
					(resp) => resp.url().includes('/schedule?/add') && resp.request().method() === 'POST'
				),
				page.$eval('form#ranked-choice-form', (form: HTMLFormElement) => form.submit())
			]);
			expect(response.status()).toBe(400);

			const stored = await scheduleRepository.fetchChoices(
				importResults.performerId,
				twoSlotSeries,
				scheduleYear
			);
			expect(stored).toBeNull();
		} finally {
			await deleteScheduleChoices(importResults.performerId, twoSlotSeries, scheduleYear);
			await browser.close();
		}
	});

	it('rejects submissions missing rank 1', async () => {
		const performanceJson = makePerformanceJson({
			className: 'TS.2.C',
			performer: 'Missing Rank',
			age: 13,
			lottery: 3458,
			concertSeries: twoSlotSeries,
			musicalPieceTitle: 'Missing Rank Sonata'
		});
		const importResults = await importPerformance(performanceJson);
		const slotCatalog = await SlotCatalog.load(twoSlotSeries, scheduleYear);
		const [firstSlot, secondSlot] = slotCatalog.slots;

		const browser = await chromium.launch({ headless: true });
		const page = await browser.newPage();
		try {
			await page.goto('http://localhost:8888/schedule?code=3458');
			console.log(`Waiting for #slot-${firstSlot.id}-rank and #slot-${secondSlot.id}-rank`);
			await page.selectOption(`#slot-${firstSlot.id}-rank`, '2');
			await page.selectOption(`#slot-${secondSlot.id}-rank`, '');

			console.log('Wait for All');
			const [response] = await Promise.all([
				page.waitForResponse(
					(resp) => resp.url().includes('/schedule?/add') && resp.request().method() === 'POST'
				),
				page.$eval('form#ranked-choice-form', (form: HTMLFormElement) => form.submit())
			]);
			expect(response.status()).toBe(400);

			const stored = await scheduleRepository.fetchChoices(
				importResults.performerId,
				twoSlotSeries,
				scheduleYear
			);
			expect(stored).toBeNull();
		} finally {
			await deleteScheduleChoices(importResults.performerId, twoSlotSeries, scheduleYear);
			await browser.close();
		}
	});
});
