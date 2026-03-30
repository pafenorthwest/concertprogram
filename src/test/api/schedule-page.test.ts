import { afterAll, beforeAll, describe, it, assert, expect } from 'vitest';
import { chromium } from 'playwright';
import { Performance } from '$lib/server/import';
import { type ImportPerformanceInterface, year, parseMusicalPiece } from '$lib/server/common';
import { fetchPerformancePieces, lookupByCode, pool, selectPerformancePiece } from '$lib/server/db';
import { ScheduleRepository } from '$lib/server/scheduleRepository';
import { SlotCatalog } from '$lib/server/slotCatalog';

const schedulePageTestTimeoutMs = 30_000;
const emmaCarterLottery = Math.floor(10000 + Math.random() * 90000);
const emmaCarterSuffix = Math.random().toString(36).slice(2, 5);
const emmaCarterName = `Emma Carter Scheduler ${emmaCarterSuffix}`;
const emmaCarterEmail = `${emmaCarterName.toLowerCase().replaceAll(' ', '.')}@example.com`;
const emmaCarterClassName = `QQ.9-10.${Math.random().toString(36).slice(2, 5)}`;
const emmaCarterPerformance = `{ "class_name": "${emmaCarterClassName}", "performer": "${emmaCarterName}", "age": 12, "lottery": ${emmaCarterLottery}, "email": "${emmaCarterEmail}","phone": "999-555-4444","accompanist": "Zhi, Zhou","instrument": "Cello","musical_piece": [ {"title": "Concerto in C minor 3rd movement", "contributors": [ { "name": "Johann Christian Bach", "yearsActive": "None" }  ]  },{ "title": "Scherzo no.2 in B Flat Minor, op.31", "contributors": [  { "name": "Frédéric Chopin", "yearsActive": "None" }  ] } ], "concert_series": "Eastside"}`;

const twoSlotSeries = 'TwoSlotTest';
const tenSlotSeries = 'TenSlotTest';

const scheduleRepository = new ScheduleRepository();

async function importPerformance(performanceJson: string) {
	const imported: ImportPerformanceInterface = JSON.parse(performanceJson);
	const singlePerformance: Performance = new Performance();
	return singlePerformance.initialize(imported);
}

async function waitForSchedulePostResponse(
	page: import('playwright').Page,
	status: number | number[]
) {
	const statuses = Array.isArray(status) ? status : [status];
	return page.waitForResponse(
		(response) =>
			response.request().method() === 'POST' &&
			response.url().includes('/schedule') &&
			statuses.includes(response.status())
	);
}

async function submitScheduleForm(
	page: import('playwright').Page,
	formSelector: string,
	status: number | number[]
) {
	await Promise.all([
		waitForSchedulePostResponse(page, status),
		page.waitForURL((url) => url.toString().includes('/schedule?/add'), {
			waitUntil: 'domcontentloaded'
		}),
		page.$eval(formSelector, (form: HTMLFormElement) => form.submit())
	]);
}

async function requestSubmitScheduleForm(
	page: import('playwright').Page,
	formSelector: string,
	status: number | number[]
) {
	await page.waitForFunction((selector) => {
		const submitButton = document.querySelector(
			`${selector} button[type="submit"]`
		) as HTMLButtonElement | null;
		return submitButton != null && submitButton.disabled === false;
	}, formSelector);

	await Promise.all([
		waitForSchedulePostResponse(page, status),
		page.waitForURL((url) => url.toString().includes('/schedule?/add'), {
			waitUntil: 'domcontentloaded'
		}),
		page.$eval(formSelector, (form: HTMLFormElement) => form.requestSubmit())
	]);
}

async function gotoSchedulePage(page: import('playwright').Page, code: number | string) {
	await page.goto(`http://localhost:8888/schedule?code=${code}`, {
		waitUntil: 'domcontentloaded'
	});
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

function makeMultiPiecePerformanceJson({
	className,
	performer,
	age,
	lottery,
	concertSeries
}: {
	className: string;
	performer: string;
	age: number;
	lottery: number;
	concertSeries: string;
}) {
	return JSON.stringify({
		class_name: className,
		performer,
		age,
		lottery,
		email: `${performer.toLowerCase().replaceAll(' ', '.')}@example.com`,
		phone: '999-555-4444',
		accompanist: 'Zhi, Zhou',
		instrument: 'Cello',
		musical_piece: [
			{
				title: 'Concerto in C minor 3rd movement',
				contributors: [{ name: 'Johann Christian Bach', yearsActive: 'None' }]
			},
			{
				title: 'Scherzo no.2 in B Flat Minor, op.31',
				contributors: [{ name: 'Frédéric Chopin', yearsActive: 'None' }]
			}
		],
		concert_series: concertSeries
	});
}

function uniqueTestId(prefix: string) {
	return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
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
	it(
		'should insert carter',
		async () => {
			const importResults = await importPerformance(emmaCarterPerformance);
			console.log(
				`Success perfomerId ${importResults.performerId} performanceId ${importResults.performanceId}`
			);
			assert.isAbove(importResults.performerId, 0, 'expected performer ID greater than 0');
		},
		schedulePageTestTimeoutMs
	);

	it('should display schedule page with ranked choices (playwright)', async () => {
		const lottery = Math.floor(10000 + Math.random() * 90000);
		const performerName = `Emma Carter Scheduler ${Math.random().toString(36).slice(2, 5)}`;
		const performanceJson = makeMultiPiecePerformanceJson({
			className: `QQ.9-10.${Math.random().toString(36).slice(2, 5)}`,
			performer: performerName,
			age: 12,
			lottery,
			concertSeries: tenSlotSeries
		});
		const importEmmaCarterResults = await importPerformance(performanceJson);
		const EmmaCarterRecord = JSON.parse(performanceJson);
		const EmmaCarterFirstPiece = parseMusicalPiece(EmmaCarterRecord.musical_piece[0].title);
		const expectedSelectedPiece = EmmaCarterFirstPiece.titleWithoutMovement;
		const performancePieces = await fetchPerformancePieces(importEmmaCarterResults.performanceId);
		const firstPerformancePieceId = Number(performancePieces.rows[0]?.musical_piece_id);
		expect(Number.isInteger(firstPerformancePieceId)).toBe(true);
		await selectPerformancePiece(importEmmaCarterResults.performanceId, firstPerformancePieceId);
		const slotCatalog = await SlotCatalog.load(EmmaCarterRecord.concert_series, scheduleYear);
		const [firstSlot, secondSlot, thirdSlot, fourthSlot] = slotCatalog.slots;

		const browser = await chromium.launch({ headless: true });
		const page = await browser.newPage();
		try {
			await gotoSchedulePage(page, lottery);
			await page.getByRole('heading', { name: 'Step 1: Review concert information' }).waitFor();
			await page.getByText(performerName).waitFor();
			await page.locator('.review-card .review-label', { hasText: 'Lookup code' }).waitFor();
			await page.locator('form#ranked-choice-form').waitFor();
			await page.getByRole('heading', { name: 'How to complete this form' }).waitFor();
			await page
				.locator('.help-panel')
				.getByText('If more than one song is listed, choose one piece below.')
				.waitFor();
			await page.getByRole('heading', { name: 'Step 2: Choose one performance piece' }).waitFor();
			const pieceOptions = page.locator('input[name="performancePiece"]');
			expect(await pieceOptions.count()).toBe(2);
			expect(await pieceOptions.first().isChecked()).toBe(true);
			await page.waitForSelector(`text=${expectedSelectedPiece}`);
			await page.getByText('Step 3: Rank concert times').waitFor();
			await page.waitForSelector('text=The limit is 8 minutes.');
			await page.waitForSelector(
				'text=You can come back and edit this page later if anything changes.'
			);

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

			await submitScheduleForm(page, 'form#ranked-choice-form', 200);
			const validateFormValues = async () => {
				await page.waitForSelector('text=Lookup code');
				await page.waitForFunction(
					([firstSlotId, secondSlotId, thirdSlotId, fourthSlotId]) => {
						const firstRank = document.querySelector(
							`#slot-${firstSlotId}-rank`
						) as HTMLSelectElement | null;
						const secondRank = document.querySelector(
							`#slot-${secondSlotId}-rank`
						) as HTMLSelectElement | null;
						const thirdNotAvailable = document.querySelector(
							`#slot-${thirdSlotId}-not-available`
						) as HTMLInputElement | null;
						const fourthRank = document.querySelector(
							`#slot-${fourthSlotId}-rank`
						) as HTMLSelectElement | null;
						return (
							firstRank?.value === '1' &&
							secondRank?.value === '3' &&
							fourthRank?.value === '2' &&
							thirdNotAvailable?.checked === true
						);
					},
					[firstSlot.id, secondSlot.id, thirdSlot.id, fourthSlot.id]
				);
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

			await gotoSchedulePage(page, lottery);
			await validateFormValues();

			await page.reload({ waitUntil: 'domcontentloaded' });
			await validateFormValues();
			const performanceResults = await lookupByCode(String(lottery));
			expect(performanceResults?.performance_duration).toBe(3);
			expect(performanceResults?.performance_comment).toBe('Thank you');
			expect(performanceResults?.lottery_code).toBe(lottery);
			expect(performanceResults?.musical_piece).toBe(expectedSelectedPiece);
			expect(performanceResults?.concert_series).toBe(EmmaCarterRecord.concert_series);

			const performanceSchedule = await scheduleRepository.fetchChoices(
				importEmmaCarterResults.performerId,
				EmmaCarterRecord.concert_series,
				scheduleYear
			);
			expect(performanceSchedule?.slots).toEqual(
				slotCatalog.slots.map((slot) => {
					if (slot.id === firstSlot.id) {
						return { slotId: slot.id, rank: 1, notAvailable: false };
					}
					if (slot.id === secondSlot.id) {
						return { slotId: slot.id, rank: 3, notAvailable: false };
					}
					if (slot.id === thirdSlot.id) {
						return { slotId: slot.id, rank: null, notAvailable: true };
					}
					if (slot.id === fourthSlot.id) {
						return { slotId: slot.id, rank: 2, notAvailable: false };
					}
					return { slotId: slot.id, rank: null, notAvailable: false };
				})
			);
		} finally {
			await deleteScheduleChoices(
				importEmmaCarterResults.performerId,
				EmmaCarterRecord.concert_series,
				scheduleYear
			);
			await browser.close();
		}
	}, 45000);

	it(
		'Valid Concerto page',
		async () => {
			const lottery = Math.floor(20000 + Math.random() * 70000);
			const performerName = uniqueTestId('Kai Organ');
			const organSonataTitle = 'Organ Sonata No.6 in G major, BWV 530';
			const organSonataPerformance = makePerformanceJson({
				className: uniqueTestId('ORG-11-12-A'),
				performer: performerName,
				age: 17,
				lottery,
				concertSeries: 'Concerto',
				musicalPieceTitle: organSonataTitle
			});
			const organPerformance = new Performance();
			const OrganSonataResults = await organPerformance.initialize(
				JSON.parse(organSonataPerformance)
			);
			const OrganSonataRecord = JSON.parse(organSonataPerformance);
			const OrganSonataMusicPeice = parseMusicalPiece(OrganSonataRecord.musical_piece[0].title);
			const slotCatalog = await SlotCatalog.load(OrganSonataRecord.concert_series, scheduleYear);
			const [slot] = slotCatalog.slots;

			const browser = await chromium.launch({ headless: true });
			const page = await browser.newPage();
			try {
				await gotoSchedulePage(page, lottery);
				await page.getByRole('heading', { name: 'Step 1: Review concert information' }).waitFor();
				await page.locator('.review-card').getByText(performerName).waitFor();
				await page.locator('.review-card').getByText(organSonataTitle).waitFor();
				await page.locator('.review-card .review-label', { hasText: 'Lookup code' }).waitFor();
				await page
					.locator('.help-panel')
					.getByText('If only one eligible piece is listed, it stays selected for you by default.')
					.waitFor();
				await page.getByRole('heading', { name: 'Step 3: Confirm your concert time' }).waitFor();
				await page.locator('label[for="duration"]').getByText('Step 4: Duration').waitFor();
				await page.locator('label[for="comment"]').getByText('Step 5: Comments').waitFor();

				const checkboxTag = await page.$eval('#concert-confirm', (element) =>
					element.tagName.toLowerCase()
				);
				expect(checkboxTag).toBe('input');

				const durationTag = await page.$eval('#duration', (element) =>
					element.tagName.toLowerCase()
				);
				expect(durationTag).toBe('select');

				const commentTag = await page.$eval('#comment', (element) => element.tagName.toLowerCase());
				expect(commentTag).toBe('input');

				await page.check('#concert-confirm');
				await page.selectOption('#duration', '5');
				await page.fill('#comment', 'See you there');
				await requestSubmitScheduleForm(page, 'form#concerto-confirmation', 200);

				// Reload the schedule page to verify confirmation message and absence of form
				await gotoSchedulePage(page, lottery);

				await page
					.getByRole('heading', {
						name: /You are all set, thank you for confirming your attendance/
					})
					.waitFor();
				const concertoFormAfterSubmit = await page.$('form#concerto-confirmation');
				expect(concertoFormAfterSubmit).toBeNull();

				await page.reload({ waitUntil: 'domcontentloaded' });
				await page
					.getByRole('heading', {
						name: /You are all set, thank you for confirming your attendance/
					})
					.waitFor();
				const concertoFormAfterReload = await page.$('form#concerto-confirmation');
				expect(concertoFormAfterReload).toBeNull();

				const performanceResults = await lookupByCode(String(lottery));
				expect(performanceResults?.performance_duration).toBe(5);
				expect(performanceResults?.performance_comment).toBe('See you there');
				expect(performanceResults?.lottery_code).toBe(lottery);
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
				await organPerformance.deleteAll();
				await browser.close();
			}
		},
		schedulePageTestTimeoutMs
	);
});

describe('Rank-choice variants', () => {
	it(
		'supports rank-choice with two slots and partial rankings',
		async () => {
			const lottery = Math.floor(20000 + Math.random() * 70000);
			const performanceJson = makePerformanceJson({
				className: uniqueTestId('TS-2-A'),
				performer: uniqueTestId('Duo Player'),
				age: 11,
				lottery,
				concertSeries: twoSlotSeries,
				musicalPieceTitle: 'Test Sonata in C'
			});
			const importResults = await importPerformance(performanceJson);
			const slotCatalog = await SlotCatalog.load(twoSlotSeries, scheduleYear);
			const [firstSlot, secondSlot] = slotCatalog.slots;

			const browser = await chromium.launch({ headless: true });
			const page = await browser.newPage();
			try {
				await gotoSchedulePage(page, lottery);
				const rankSelects = page.locator('select[id$="-rank"]');
				const rankSelectCount = await rankSelects.count();
				expect(rankSelectCount).toBe(2);

				await page.selectOption(`#slot-${firstSlot.id}-rank`, '1');
				await submitScheduleForm(page, 'form#ranked-choice-form', 200);

				await gotoSchedulePage(page, lottery);
				await page.waitForFunction((slotId) => {
					const rankSelect = document.querySelector(
						`#slot-${slotId}-rank`
					) as HTMLSelectElement | null;
					return rankSelect?.value === '1';
				}, firstSlot.id);
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
		},
		schedulePageTestTimeoutMs
	);

	it(
		'supports rank-choice with ten slots',
		async () => {
			const lottery = Math.floor(20000 + Math.random() * 70000);
			const performanceJson = makePerformanceJson({
				className: uniqueTestId('TS-10-A'),
				performer: uniqueTestId('Ten Slot Performer'),
				age: 12,
				lottery,
				concertSeries: tenSlotSeries,
				musicalPieceTitle: 'Test Suite in D'
			});
			const importResults = await importPerformance(performanceJson);

			const browser = await chromium.launch({ headless: true });
			const page = await browser.newPage();
			try {
				await gotoSchedulePage(page, lottery);
				const rankSelects = page.locator('select[id$="-rank"]');
				const rankSelectCount = await rankSelects.count();
				expect(rankSelectCount).toBe(10);
				const optionCount = await rankSelects.first().locator('option').count();
				expect(optionCount).toBe(11);
			} finally {
				await deleteScheduleChoices(importResults.performerId, tenSlotSeries, scheduleYear);
				await browser.close();
			}
		},
		schedulePageTestTimeoutMs
	);

	it(
		'rejects duplicate rankings',
		async () => {
			const lottery = Math.floor(20000 + Math.random() * 70000);
			const performanceJson = makePerformanceJson({
				className: uniqueTestId('TS-2-B'),
				performer: uniqueTestId('Duplicate Rank'),
				age: 13,
				lottery,
				concertSeries: twoSlotSeries,
				musicalPieceTitle: 'Duplicate Sonata'
			});
			const importResults = await importPerformance(performanceJson);
			const slotCatalog = await SlotCatalog.load(twoSlotSeries, scheduleYear);
			const [firstSlot, secondSlot] = slotCatalog.slots;

			const browser = await chromium.launch({ headless: true });
			const page = await browser.newPage();
			try {
				await gotoSchedulePage(page, lottery);
				await page.selectOption(`#slot-${firstSlot.id}-rank`, '1');
				await page.selectOption(`#slot-${secondSlot.id}-rank`, '1');

				const [response] = await Promise.all([
					waitForSchedulePostResponse(page, 400),
					page.waitForURL((url) => url.toString().includes('/schedule?/add'), {
						waitUntil: 'domcontentloaded'
					}),
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
		},
		schedulePageTestTimeoutMs
	);

	it(
		'rejects submissions missing rank 1',
		async () => {
			const lottery = Math.floor(20000 + Math.random() * 70000);
			const performanceJson = makePerformanceJson({
				className: uniqueTestId('TS-2-C'),
				performer: uniqueTestId('Missing Rank'),
				age: 13,
				lottery,
				concertSeries: twoSlotSeries,
				musicalPieceTitle: 'Missing Rank Sonata'
			});
			const importResults = await importPerformance(performanceJson);
			const slotCatalog = await SlotCatalog.load(twoSlotSeries, scheduleYear);
			const [firstSlot, secondSlot] = slotCatalog.slots;

			const browser = await chromium.launch({ headless: true });
			const page = await browser.newPage();
			try {
				await gotoSchedulePage(page, lottery);
				await page.selectOption(`#slot-${firstSlot.id}-rank`, '2');
				await page.selectOption(`#slot-${secondSlot.id}-rank`, '');

				const [response] = await Promise.all([
					waitForSchedulePostResponse(page, 400),
					page.waitForURL((url) => url.toString().includes('/schedule?/add'), {
						waitUntil: 'domcontentloaded'
					}),
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
		},
		schedulePageTestTimeoutMs
	);
});
