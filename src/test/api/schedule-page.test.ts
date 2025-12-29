import { describe, it, assert, expect } from 'vitest';
import { chromium } from 'playwright';
import { Performance } from '$lib/server/import';
import { type ImportPerformanceInterface, year } from '$lib/server/common';
import { deleteDBSchedule, getDBSchedule, lookupByCode, selectDBSchedule } from '$lib/server/db';

const emmaCarterPerformance =
	'{ "class_name": "QQ.9-10.XE", "performer": "Emma Carter", "age": 12, "lottery": 123, "email": "uFiqpdx@example.com","phone": "999-555-4444","accompanist": "Zhi, Zhou","instrument": "Cello","musical_piece": [ {"title": "Concerto in C minor 3rd movement", "contributors": [ { "name": "Johann Christian Bach", "yearsActive": "None" }  ]  },{ "title": "Scherzo no.2 in B Flat Minor, op.31", "contributors": [  { "name": "Frédéric Chopin", "yearsActive": "None" }  ] } ], "concert_series": "Eastside"}';

const organSonataPerformance =
	'{ "class_name": "ORG.11-12.A", "performer": "Kai Organ", "age": 17, "lottery": 456, "email": "kai.organ@example.com","phone": "222-333-4444","accompanist": "Pat Riley","instrument": "Piano","musical_piece": [ {"title": "Organ Sonata No.6 in G major, BWV 530", "contributors": [ { "name": "Johann Sebastian Bach", "yearsActive": "1685-1750", "role": "Composer" }, { "name": "Béla Bartók", "yearsActive": "1881-1945", "role": "Arranger" } ] } ], "concert_series": "Concerto"}';

async function importEmmaCarterPerformance() {
	const imported: ImportPerformanceInterface = JSON.parse(emmaCarterPerformance);
	const singlePerformance: Performance = new Performance();
	return singlePerformance.initialize(imported);
}

export async function importOrganSonataPerformance() {
	const imported: ImportPerformanceInterface = JSON.parse(organSonataPerformance);
	const singlePerformance: Performance = new Performance();
	return singlePerformance.initialize(imported);
}

describe('Valid Eastside page', () => {
	it('should insert carter', async () => {
		const importResults = await importEmmaCarterPerformance();
		console.log(
			`Success perfomerId ${importResults.performerId} performanceId ${importResults.performanceId}`
		);
		assert.isAbove(importResults.performerId, 0, 'expected performer ID greater than 0');
	});

	it('should display schedule page with ranked choices (playwright)', async () => {
		const importEmmaCarterResults = await importEmmaCarterPerformance();
		const EmmaCarterRecord = JSON.parse(emmaCarterPerformance);

		const browser = await chromium.launch({ headless: true });
		const page = await browser.newPage();
		try {
			await page.goto('http://localhost:8888/schedule?code=123');
			await page.waitForSelector('text=Scheduling for Emma Carter');
			await page.waitForSelector('text=Performing Concerto in C minor');
			await page.waitForSelector('text=Lookup code 123');
			await page.waitForSelector('form#ranked-choice-form');

			const rankSelectIds = [
				'#rank-sat-first',
				'#rank-sat-second',
				'#rank-sun-third',
				'#rank-sun-fourth'
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
		} finally {
			deleteDBSchedule(
				importEmmaCarterResults.performerId,
				EmmaCarterRecord.concert_series,
				year()
			);
			await browser.close();
		}
	});

	it('Valid Concerto page', async () => {
		const OrganSonataResults = await importOrganSonataPerformance();
		const OrganSonataRecord = JSON.parse(organSonataPerformance);

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
			expect(performanceResults?.musical_piece).toBe(OrganSonataRecord.musical_piece[0].title);
			expect(performanceResults?.concert_series).toBe(OrganSonataRecord.concert_series);

			const performanceSchedule = await getDBSchedule(
				OrganSonataResults.performerId,
				OrganSonataRecord.concert_series,
				year()
			);
			expect(performanceSchedule.rows[0].first_choice_time).toBeTruthy();
			expect(performanceSchedule.rows[0].second_choice_time).not.toBeTruthy();
			expect(performanceSchedule.rows[0].third_choice_time).not.toBeTruthy();
			expect(performanceSchedule.rows[0].forth_choice_time).not.toBeTruthy();
		} finally {
			deleteDBSchedule(OrganSonataResults.performerId, OrganSonataRecord.concert_series, year());
			await browser.close();
		}
	});
});
