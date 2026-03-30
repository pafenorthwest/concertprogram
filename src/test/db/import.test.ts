import { describe, it, assert, expect } from 'vitest';
import { Performance } from '$lib/server/import';
import {
	type ImportMusicalTitleInterface,
	type ImportPerformanceInterface,
	year,
	parseMusicalPiece
} from '$lib/server/common';
import { lookupByCode, pool, searchPerformanceByPerformerAndClass } from '$lib/server/db';

describe('Test Import Code', () => {
	it('should parse music titles with movements', async () => {
		const testTitlesWithMovements: readonly [string, string, string][] = [
			['J.C.Bach Concerto in C minor 3rd movement', 'J.C.Bach Concerto in C minor', '3rd movement'],
			[
				'Pelléas et Mélisande, Op. 80 III. Sicilienne: Allegretto molto moderato',
				'Pelléas et Mélisande, Op. 80',
				'III. Sicilienne: Allegretto molto moderato'
			],
			[
				' Sonata for Flute, H. 306 I. Allegro moderato',
				'Sonata for Flute, H. 306',
				'I. Allegro moderato'
			],
			[
				'Concerto No.4 in D minor, Opus 31, 1st movement',
				'Concerto No.4 in D minor, Opus 31',
				'1st movement'
			]
		];

		const results = testTitlesWithMovements.map((entry) => parseMusicalPiece(entry[0]));

		assert.isAbove(results.length, 0, 'Expected results from parsedMusicPieces and found none');
		results.forEach((musicalPiece, index) => {
			assert.equal(
				musicalPiece.titleWithoutMovement,
				testTitlesWithMovements[index][1],
				'Expected titles to match'
			);

			assert.equal(
				musicalPiece.movements!,
				testTitlesWithMovements[index][2],
				'Expected movements to match'
			);
		});
	});
	it('should parse music titles with out movements', async () => {
		const testTitlesWithOutMovements: readonly [string, string, null][] = [
			['Bolero', 'Bolero', null],
			['Prelude & Fugue in B minor', 'Prelude & Fugue in B minor', null],
			['Sonata in F minor, D. 625', 'Sonata in F minor, D. 625', null],
			[' Caprice Basque, Opus 24', 'Caprice Basque, Opus 24', null],
			[' Piano Sonata No. 3 in F minor, Op. 14', 'Piano Sonata No. 3 in F minor, Op. 14', null]
		];

		const results = testTitlesWithOutMovements.map((entry) => parseMusicalPiece(entry[0]));
		assert.isAbove(results.length, 0, 'Expected results from parsedMusicPieces and found none');
		results.forEach((musicalPiece) => {
			assert.isAbove(
				musicalPiece.titleWithoutMovement.length,
				5,
				'Music title of length 12 or more'
			);
			assert.isNull(musicalPiece.movements, 'Expected no movement');
		});
	});

	it('should insert single performance', async () => {
		const musicalTitle: ImportMusicalTitleInterface = {
			title: 'J.C.Bach Concerto in C minor 3rd movement',
			contributors: [{ name: 'Johann Christian Bach', yearsActive: 'none' }]
		};

		const imported: ImportPerformanceInterface = {
			class_name: 'CC.P-4.A',
			performer: 'Nymphodoros Sýkorová',
			age: 6,
			lottery: 12345,
			email: 'QFnl@example.com',
			phone: '999-555-4444',
			accompanist: 'Zhi, Zhou',
			instrument: 'Cello',
			musical_piece: [musicalTitle],
			concert_series: 'Eastside'
		};
		const singlePerformance: Performance = new Performance();
		await singlePerformance.initialize(imported);
		await singlePerformance.deleteAll();

		assert.isDefined(singlePerformance.musical_piece_1, 'Expected musical piece to be defined');
		assert.isNotNull(singlePerformance.musical_piece_1.id, 'Expected non null musical_piece id');
		assert.isAbove(
			singlePerformance.musical_piece_1.id,
			0,
			' Expected musical piece id positive integer'
		);
		assert.equal(singlePerformance.accompanist?.full_name, 'Zhou Zhi', 'Expected accompanist ');
		assert.equal(
			singlePerformance.performer.full_name,
			'Nymphodoros Sýkorová',
			'Expected performer name'
		);
		assert.equal(singlePerformance.performer.email, 'QFnl@example.com', 'Expected performer email');
		assert.isDefined(singlePerformance.contributor_1[0], 'Expected first composer to be defined');
		assert.equal(
			singlePerformance.contributor_1[0].full_name,
			'Johann Christian Bach',
			'Expected composer'
		);
	});
	it('refreshes selected performance pieces for single-performance reimports', async () => {
		const lottery = 65432;
		const initialPerformance: ImportPerformanceInterface = {
			class_name: 'RN.REIMPORT.1',
			performer: 'Single Performance Refresh',
			age: 14,
			lottery,
			email: 'refresh.single.performance@example.com',
			phone: '555-0303',
			accompanist: null,
			instrument: 'Violin',
			musical_piece: [
				{
					title: 'Original Refresh Piece',
					contributors: [{ name: 'Refresh Composer One', yearsActive: '1900-1950' }]
				}
			],
			concert_series: 'Eastside'
		};
		const updatedImport: ImportPerformanceInterface = {
			...initialPerformance,
			musical_piece: [
				{
					title: 'Updated Refresh Piece',
					contributors: [{ name: 'Refresh Composer Two', yearsActive: '1910-1960' }]
				}
			]
		};

		const firstPerformance = new Performance();
		const updatedPerformance = new Performance();

		await firstPerformance.initialize(initialPerformance);
		await updatedPerformance.initialize(updatedImport);

		const lookupResult = await lookupByCode(String(lottery));
		await updatedPerformance.deleteAll();

		assert.isNotNull(lookupResult, 'Expected lookup result after reimport');
		assert.equal(
			lookupResult?.musical_piece,
			'Updated Refresh Piece',
			'Expected lookup to return the refreshed selected piece'
		);
	});
	it('reuses a partially imported performance row when a corrected retry succeeds', async () => {
		const lottery = 753251;
		const className = 'WEP.9-13.A';
		const performerName = 'Ivy Qi';
		const concertSeries = 'Eastside';
		const correctedTitle = 'Various Trouts - First Set for Three Flutes';
		const malformedImport = {
			class_name: className,
			performer: performerName,
			age: 12,
			lottery,
			email: 'keaijiazi@gmail.com',
			phone: '757-240-8239',
			instrument: 'Flute',
			musical_piece: [
				{
					title: correctedTitle,
					composers: [{ name: 'Sefton Cottom', yearsActive: 'None' }]
				}
			],
			concert_series: concertSeries
		} as unknown as ImportPerformanceInterface;
		const correctedImport: ImportPerformanceInterface = {
			class_name: className,
			performer: performerName,
			age: 12,
			lottery,
			email: 'keaijiazi@gmail.com',
			phone: '757-240-8239',
			instrument: 'Flute',
			musical_piece: [
				{
					title: correctedTitle,
					contributors: [{ name: 'Sefton Cottom', yearsActive: 'None' }]
				}
			],
			concert_series: concertSeries
		};

		const failedPerformance = new Performance();
		const recoveredPerformance = new Performance();

		try {
			await expect(failedPerformance.initialize(malformedImport)).rejects.toBeInstanceOf(Error);

			const partialRowResult = await pool.query(
				`SELECT p.id
				   FROM performance p
				   JOIN performer perf ON perf.id = p.performer_id
				  WHERE LOWER(perf.full_name) = LOWER($1)
				    AND p.class_name = $2
				    AND LOWER(p.concert_series) = LOWER($3)
				    AND p.year = $4`,
				[performerName, className, concertSeries, year()]
			);

			assert.equal(partialRowResult.rowCount, 1, 'Expected one partial performance row');

			const recoveredResults = await recoveredPerformance.initialize(correctedImport);
			const recoveredRowResult = await pool.query(
				`SELECT p.id
				   FROM performance p
				   JOIN performer perf ON perf.id = p.performer_id
				  WHERE LOWER(perf.full_name) = LOWER($1)
				    AND p.class_name = $2
				    AND LOWER(p.concert_series) = LOWER($3)
				    AND p.year = $4`,
				[performerName, className, concertSeries, year()]
			);
			const lookupResult = await lookupByCode(String(lottery));

			assert.isFalse(recoveredResults.new, 'Expected corrected retry to update existing data');
			assert.equal(
				recoveredResults.performanceId,
				partialRowResult.rows[0].id,
				'Expected retry to reuse the original performance row'
			);
			assert.equal(recoveredRowResult.rowCount, 1, 'Expected a single performance row after retry');
			assert.equal(
				lookupResult?.musical_piece,
				correctedTitle,
				'Expected corrected retry to restore the selected piece'
			);
		} finally {
			await recoveredPerformance.deleteAll();
			await failedPerformance.deleteAll();
		}
	});
	it('normalizes contributor role before lookup', async () => {
		const imported: ImportPerformanceInterface = {
			class_name: 'RN.ROLE.1',
			performer: 'Role Normalization',
			age: 15,
			lottery: 54321,
			email: null,
			phone: null,
			accompanist: null,
			instrument: 'Violin',
			musical_piece: [
				{
					title: 'Normalization Piece',
					contributors: [
						{
							name: 'Casey Composer',
							yearsActive: 'None',
							role: 'composer' as unknown as ImportMusicalTitleInterface['contributors'][number]['role']
						}
					]
				}
			],
			concert_series: 'Eastside'
		};
		const performance: Performance = new Performance();
		try {
			await performance.initialize(imported);
			assert.equal(performance.contributor_1[0].role, 'Composer');
		} finally {
			await performance.deleteAll();
		}
	});
	it('should insert multiple performances', async () => {
		const musicalTitles: ImportMusicalTitleInterface[] = [];

		musicalTitles.push({
			title: 'Random Title 3rd movement',
			contributors: [{ name: 'Johann Christian Bach', yearsActive: 'none' }]
		});
		musicalTitles.push({
			title: 'Another Title 3rd movement',
			contributors: [{ name: 'NewNewNew', yearsActive: '1970 - 1999' }]
		});

		const imported: ImportPerformanceInterface = {
			class_name: 'CC.P-4.A',
			performer: 'Nymphodoros Sýkorová',
			age: 6,
			lottery: 12345,
			email: 'QFnl@example.com',
			phone: '999-555-4444',
			accompanist: 'Zhi, Zhou',
			instrument: 'Cello',
			musical_piece: musicalTitles,
			concert_series: 'Eastside'
		};
		const singlePerformance: Performance = new Performance();
		await singlePerformance.initialize(imported);
		await singlePerformance.deleteAll();

		assert.isDefined(singlePerformance.musical_piece_1, 'Expected musical piece to be defined');
		assert.isNotNull(singlePerformance.musical_piece_1.id, 'Expected non null musical_piece id');
		assert.isAbove(
			singlePerformance.musical_piece_1.id,
			0,
			' Expected musical piece id positive integer'
		);

		assert.isDefined(singlePerformance.musical_piece_2, 'Expected musical piece to be defined');
		assert.isNotNull(singlePerformance.musical_piece_2.id, 'Expected non null musical_piece id');
		assert.isAbove(
			singlePerformance.musical_piece_2.id,
			0,
			' Expected musical piece id positive integer'
		);

		assert.equal(singlePerformance.accompanist?.full_name, 'Zhou Zhi', 'Expected accompanist ');
		assert.equal(
			singlePerformance.performer.full_name,
			'Nymphodoros Sýkorová',
			'Expected performer name'
		);
		assert.equal(singlePerformance.performer.email, 'QFnl@example.com', 'Expected performer email');

		assert.isDefined(singlePerformance.contributor_1[0], 'Expected first composer to be defined');
		assert.equal(
			singlePerformance.contributor_1[0].full_name,
			'Johann Christian Bach',
			'Expected composer'
		);

		assert.isDefined(singlePerformance.contributor_2[0], 'Expected first composer to be defined');
		assert.equal(singlePerformance.contributor_2[0].full_name, 'NewNewNew', 'Expected composer');
	});

	it('should update multiple performances', async () => {
		const musicalTitles: ImportMusicalTitleInterface[] = [];

		musicalTitles.push({
			title: 'Random Title 3rd movement',
			contributors: [{ name: 'Johann Christian Bach', yearsActive: 'none' }]
		});
		musicalTitles.push({
			title: 'Another Title 3rd movement',
			contributors: [{ name: 'NewNewNew', yearsActive: '1970 - 1999' }]
		});

		const imported: ImportPerformanceInterface = {
			class_name: 'CC.P-4.A',
			performer: 'Nymphodoros Sýkorová',
			age: 6,
			lottery: 12345,
			email: 'QFnl@example.com',
			phone: '999-555-4444',
			accompanist: 'Zhi, Zhou',
			instrument: 'Cello',
			musical_piece: musicalTitles,
			concert_series: 'Eastside'
		};
		const singlePerformance: Performance = new Performance();
		const firstResults = await singlePerformance.initialize(imported);

		// count rows in DB for this performer only to avoid interference from other tests
		const performerId = singlePerformance.performer?.id;
		assert.isDefined(performerId, 'Expected performer id for first import');
		const concertSeries = 'Eastside';
		let res = await searchPerformanceByPerformerAndClass(
			performerId!,
			imported.class_name,
			concertSeries,
			year()
		);
		const firstCount = res.rowCount;

		assert.isDefined(singlePerformance.musical_piece_1, 'Expected musical piece to be defined');
		assert.isNotNull(singlePerformance.musical_piece_1?.id, 'Expected non null musical_piece id');
		assert.isAbove(
			singlePerformance.musical_piece_1?.id,
			0,
			' Expected musical piece id positive integer'
		);
		assert.equal(
			singlePerformance.musical_piece_1?.printed_name,
			'Random Title',
			'Expected musical title to match update'
		);
		assert.equal(
			singlePerformance.musical_piece_1?.all_movements,
			'3rd movement',
			'Expected musical title movement to match update'
		);

		assert.isDefined(singlePerformance.musical_piece_2, 'Expected musical piece to be defined');
		assert.isNotNull(singlePerformance.musical_piece_2?.id, 'Expected non null musical_piece id');
		assert.isAbove(
			singlePerformance.musical_piece_2?.id,
			0,
			' Expected musical piece id positive integer'
		);
		assert.equal(
			singlePerformance.musical_piece_2?.printed_name,
			'Another Title',
			'Expected musical title to match update'
		);
		assert.equal(
			singlePerformance.musical_piece_2?.all_movements,
			'3rd movement',
			'Expected musical title movement to match update'
		);

		assert.equal(singlePerformance.accompanist?.full_name, 'Zhou Zhi', 'Expected accompanist ');
		assert.equal(
			singlePerformance.performer?.full_name,
			'Nymphodoros Sýkorová',
			'Expected performer name'
		);
		assert.equal(
			singlePerformance.performer?.email,
			'QFnl@example.com',
			'Expected performer email'
		);

		assert.isDefined(singlePerformance.contributor_1[0], 'Expected first composer to be defined');
		assert.equal(
			singlePerformance.contributor_1[0].full_name,
			'Johann Christian Bach',
			'Expected composer'
		);

		assert.isDefined(singlePerformance.contributor_2?.[0], 'Expected first composer to be defined');
		assert.equal(singlePerformance.contributor_2?.[0].full_name, 'NewNewNew', 'Expected composer');

		assert.isTrue(firstResults.new);

		const updatedMusicalTitles: ImportMusicalTitleInterface[] = [];

		updatedMusicalTitles.push({
			title: 'Updated Title 3rd Movement',
			contributors: [{ name: 'Johann Christian Bach', yearsActive: 'none' }]
		});
		updatedMusicalTitles.push({
			title: 'Second Updated Title',
			contributors: [{ name: 'NewNewNew', yearsActive: '1970 - 1999' }]
		});

		const updatedEntries: ImportPerformanceInterface = {
			class_name: 'CC.P-4.A',
			performer: 'Nymphodoros Sýkorová',
			age: 6,
			lottery: 12345,
			email: 'QFnl@example.com',
			phone: '999-555-4444',
			accompanist: 'Zhi, Zhou',
			instrument: 'Cello',
			musical_piece: updatedMusicalTitles,
			concert_series: 'Eastside'
		};
		const updatedPerformance: Performance = new Performance();
		const secondResults = await updatedPerformance.initialize(updatedEntries);

		// count rows in DB for this performer only to avoid interference from other tests
		assert.isDefined(updatedPerformance.performer?.id, 'Expected performer id for update');
		res = await searchPerformanceByPerformerAndClass(
			updatedPerformance.performer!.id!,
			updatedEntries.class_name,
			concertSeries,
			year()
		);
		const secondCount = res.rowCount;

		await updatedPerformance.deleteAll();

		assert.isDefined(updatedPerformance.musical_piece_1, 'Expected musical piece to be defined');
		assert.isNotNull(updatedPerformance.musical_piece_1.id, 'Expected non null musical_piece id');
		assert.isAbove(
			updatedPerformance.musical_piece_1.id,
			0,
			' Expected musical piece id positive integer'
		);
		assert.equal(
			updatedPerformance.musical_piece_1?.printed_name,
			'Updated Title',
			'Expected musical title to match update'
		);
		assert.equal(
			updatedPerformance.musical_piece_1?.all_movements,
			'3rd Movement',
			'Expected musical title movement to match update'
		);

		assert.isDefined(updatedPerformance.musical_piece_2, 'Expected musical piece to be defined');
		assert.isNotNull(updatedPerformance.musical_piece_2.id, 'Expected non null musical_piece id');
		assert.isAbove(
			updatedPerformance.musical_piece_2.id,
			0,
			' Expected musical piece id positive integer'
		);
		assert.equal(
			updatedPerformance.musical_piece_2?.printed_name,
			'Second Updated Title',
			'Expected musical title to match update'
		);
		assert.isNull(
			updatedPerformance.musical_piece_2?.all_movements,
			'Expected musical title movement to be Null'
		);

		assert.equal(updatedPerformance.accompanist?.full_name, 'Zhou Zhi', 'Expected accompanist ');
		assert.equal(
			updatedPerformance.performer.full_name,
			'Nymphodoros Sýkorová',
			'Expected performer name'
		);
		assert.equal(
			updatedPerformance.performer.email,
			'QFnl@example.com',
			'Expected performer email'
		);

		assert.isDefined(updatedPerformance.contributor_1[0], 'Expected first composer to be defined');
		assert.equal(
			updatedPerformance.contributor_1[0].full_name,
			'Johann Christian Bach',
			'Expected composer'
		);

		assert.isDefined(updatedPerformance.contributor_2[0], 'Expected first composer to be defined');
		assert.equal(updatedPerformance.contributor_2[0].full_name, 'NewNewNew', 'Expected composer');

		assert.isFalse(secondResults.new);

		assert.equal(firstCount, secondCount, 'Expected rowcount to be the same');
	});
	it('should insert multiple composers', async () => {
		const musicalTitles: ImportMusicalTitleInterface[] = [];

		musicalTitles.push({
			title: 'Many Composers 3rd movement',
			contributors: [
				{ name: 'Johann Christian Bach', yearsActive: 'none' },
				{ name: 'Bohuslav Martinu', yearsActive: 'none' },
				{ name: 'Carl Maria von Weber', yearsActive: 'none' }
			]
		});
		musicalTitles.push({
			title: 'Another Title 3rd movement',
			contributors: [
				{ name: 'NewNewNew', yearsActive: '1970 - 1999' },
				{ name: 'Edward Elgar', yearsActive: 'None' }
			]
		});

		const imported: ImportPerformanceInterface = {
			class_name: 'CC.P-4.A',
			performer: 'Nymphodoros Sýkorová',
			age: 6,
			lottery: 12345,
			email: 'QFnl@example.com',
			phone: '999-555-4444',
			accompanist: 'Zhi, Zhou',
			instrument: 'Cello',
			musical_piece: musicalTitles,
			concert_series: 'Eastside'
		};
		const singlePerformance: Performance = new Performance();
		await singlePerformance.initialize(imported);
		await singlePerformance.deleteAll();

		assert.isDefined(singlePerformance.musical_piece_1, 'Expected musical piece to be defined');
		assert.isNotNull(singlePerformance.musical_piece_1?.id, 'Expected non null musical_piece id');
		assert.isAbove(
			singlePerformance.musical_piece_1?.id,
			0,
			' Expected musical piece id positive integer'
		);

		assert.isDefined(singlePerformance.musical_piece_2, 'Expected musical piece to be defined');
		assert.isNotNull(singlePerformance.musical_piece_2?.id, 'Expected non null musical_piece id');
		assert.isAbove(
			singlePerformance.musical_piece_2?.id,
			0,
			' Expected musical piece id positive integer'
		);

		assert.equal(singlePerformance.accompanist?.full_name, 'Zhou Zhi', 'Expected accompanist ');
		assert.equal(
			singlePerformance.performer?.full_name,
			'Nymphodoros Sýkorová',
			'Expected performer name'
		);
		assert.equal(
			singlePerformance.performer?.email,
			'QFnl@example.com',
			'Expected performer email'
		);

		assert.isDefined(singlePerformance.contributor_1[0], 'Expected first composer to be defined');
		assert.equal(
			singlePerformance.contributor_1[0].full_name,
			'Johann Christian Bach',
			'Expected composer'
		);

		assert.isDefined(singlePerformance.contributor_1[1], 'Expected first composer to be defined');
		assert.equal(
			singlePerformance.contributor_1[1].full_name,
			'Bohuslav Martinu',
			'Expected composer'
		);

		assert.isDefined(singlePerformance.contributor_1[2], 'Expected first composer to be defined');
		assert.equal(
			singlePerformance.contributor_1[2].full_name,
			'Carl Maria von Weber',
			'Expected composer'
		);

		assert.isDefined(singlePerformance.contributor_2?.[0], 'Expected first composer to be defined');
		assert.equal(singlePerformance.contributor_2?.[0].full_name, 'NewNewNew', 'Expected composer');

		assert.isDefined(singlePerformance.contributor_2?.[1], 'Expected first composer to be defined');
		assert.equal(
			singlePerformance.contributor_2?.[1].full_name,
			'Edward Elgar',
			'Expected composer'
		);
	});
	it('should fail parsing class', async () => {
		const musicalTitle: ImportMusicalTitleInterface = {
			title: 'J.C.Bach Concerto in C minor 3rd movement',
			contributors: [{ name: 'Johann Christian Bach', yearsActive: 'none' }]
		};

		const imported: ImportPerformanceInterface = {
			class_name: 'XXXX?????',
			performer: 'Nymphodoros Sýkorová',
			age: '6',
			lottery: '12345',
			email: 'QFnl@example.com',
			phone: '999-555-4444',
			accompanist: 'Zhi, Zhou',
			instrument: 'Cello',
			musical_piece: [musicalTitle],
			concert_series: 'Eastside'
		};

		const singlePerformance: Performance = new Performance();
		try {
			await singlePerformance.initialize(imported);
		} catch (e) {
			expect(e).to.be.an.instanceof(Error);
		}
		await singlePerformance.deleteAll();
	});
});
