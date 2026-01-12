import {
	type AccompanistInterface,
	type ContributorInterface,
	type ImportMusicalTitleInterface,
	type ImportPerformanceInterface,
	type MusicalPieceInterface,
	year,
	parseMusicalPiece,
	type PerformanceInterface,
	type PerformancePieceInterface,
	type PerformerInterface,
	calcEpochAge,
	selectInstrument,
	defaultContributorRole,
	normalizeContributorRole
} from '$lib/server/common';
import {
	PerformanceError,
	PerformerError,
	ContributorError,
	MusicalPieceError,
	InstrumentError
} from '$lib/server/customExceptions';
import Papa from 'papaparse';
import {
	insertTable,
	searchAccompanist,
	searchContributor,
	searchMusicalPiece,
	searchPerformer,
	searchPerformanceByPerformerAndClass,
	insertPerformance,
	insertPerformancePieceMap,
	deleteById,
	deletePerformancePieceMap,
	deletePerformancePieceByPerformanceId,
	deleteClassLottery,
	getClassLottery,
	insertClassLottery
} from '$lib/server/db';
import { createPerformer } from '$lib/server/performer';

interface PerformerInterfaceTagCreate extends PerformerInterface {
	created: boolean;
}
interface PerformanceInterfaceTagCreate extends PerformanceInterface {
	created: boolean;
}

export class Performance {
	public accompanist: AccompanistInterface | null | undefined;
	public performer: PerformerInterfaceTagCreate | undefined;
	public contributor_1: ContributorInterface[] = [];
	public contributor_2: ContributorInterface[] | null = null;
	public musical_piece_1: MusicalPieceInterface | undefined;
	public musical_piece_2: MusicalPieceInterface | null | undefined;
	public performance: PerformanceInterfaceTagCreate | undefined;

	async initialize(data: ImportPerformanceInterface) {
		// process accompanist
		this.accompanist = await this.processAccompanist(data.accompanist);
		// process performer
		this.performer = await this.processPerformer(
			data.performer,
			data.age,
			data.instrument,
			data.email,
			data.phone
		);

		// create class lottery
		if (!(await this.processLottery(data.class_name, data.lottery))) {
			throw new PerformerError('Unable to create Class Lottery');
		}

		// Now we need to get the performance info and determin if this is an update or creation
		if (this.performer.id == null) {
			throw new PerformerError("Can't process Performance with null performer");
		}
		// set a default for concert series if not defined
		if (data.concert_series == null) {
			data.concert_series = 'Undefined';
		}
		// check accompanist
		let accompanist_id = null;
		if (this.accompanist?.id != null) {
			accompanist_id = this.accompanist?.id;
		}
		// Now create performance if needed
		// does a DB search and returns and exising performance if found
		this.performance = await this.processPerformance(
			this.performer,
			data.class_name,
			accompanist_id,
			data.concert_series
		);
		// check performance id
		if (this.performance.id == null) {
			throw new PerformanceError("Can't process Performance with null performance id");
		}
		// clean out previous musical pieces if this is an update
		const isUpdate = !(this.performer?.created && this.performance?.created);
		if (isUpdate) {
			const delete_music: PerformancePieceInterface = {
				performance_id: this.performance.id,
				musical_piece_id: -1,
				movement: null
			};
			await deletePerformancePieceMap(delete_music, true);
		}

		// process musical pieces
		if (data.musical_piece.length > 0 && data.musical_piece[0].title != null) {
			// process music piece one first
			const parsedMusic = parseMusicalPiece(data.musical_piece[0].title);
			// process composers: music piece one
			for (const contributor of data.musical_piece[0].contributors) {
				if (contributor?.name != null) {
					const processed = await this.processComposer({
						id: null,
						full_name: contributor.name,
						years_active: contributor.yearsActive,
						role: contributor.role ?? defaultContributorRole,
						notes: contributor.notes ?? 'imported processing musical pieces'
					});
					this.contributor_1.push(processed);
				}
			}
			if (this.contributor_1[0]?.id != null && parsedMusic.titleWithoutMovement != null) {
				this.musical_piece_1 = await this.processMusicalPiece(
					parsedMusic.titleWithoutMovement,
					parsedMusic.movements,
					this.contributor_1
				);
			} else {
				throw new MusicalPieceError('Returned null when parsing musical title');
			}

			if (this.musical_piece_1.id == null) {
				throw new MusicalPieceError('Invalid musical piece id, id can not be null');
			}
			const musical_piece: PerformancePieceInterface = {
				performance_id: this.performance.id,
				musical_piece_id: this.musical_piece_1.id,
				movement: parsedMusic.movements
			};
			await insertPerformancePieceMap(musical_piece);
		} else {
			throw new MusicalPieceError('Unable to process value for musical piece 1');
		}

		// cont process musical pieces
		if (data.musical_piece[1] != null && data.musical_piece[1].title.trim().length > 0) {
			const parsedMusic = parseMusicalPiece(data.musical_piece[1].title);
			this.contributor_2 = [];
			// process composers: music piece one
			for (const contributor of data.musical_piece[1].contributors) {
				if (contributor?.name != null) {
					const processed = await this.processComposer({
						id: null,
						full_name: contributor.name,
						years_active: contributor.yearsActive,
						role: contributor.role ?? defaultContributorRole,
						notes: contributor.notes ?? 'imported processing musical pieces'
					});
					this.contributor_2?.push(processed);
				}
			}
			if (this.contributor_2?.[0]?.id != null && parsedMusic.titleWithoutMovement != null) {
				this.musical_piece_2 = await this.processMusicalPiece(
					parsedMusic.titleWithoutMovement,
					parsedMusic.movements,
					this.contributor_2
				);
			} else {
				throw new MusicalPieceError('Invalid musical piece id, id can not be null');
			}
			if (this.musical_piece_2 == null || this.musical_piece_2?.id == null) {
				throw new MusicalPieceError('Invalid musical piece id, id can not be null');
			}
			const musical_piece: PerformancePieceInterface = {
				performance_id: this.performance.id,
				musical_piece_id: this.musical_piece_2.id,
				movement: parsedMusic.movements
			};
			await insertPerformancePieceMap(musical_piece);
		}

		return {
			performerId: this.performer.id,
			performanceId: this.performance.id,
			new: !!(this.performer?.created && this.performance?.created)
		};
	}
	// searches for matching composer by name returning their id
	// otherwise creates new composer entry
	private async processComposer(
		contributorParam: ContributorInterface
	): Promise<ContributorInterface> {
		// normalize the string first remove all the Diacritic vowels
		const role = normalizeContributorRole(contributorParam.role);
		const res = await searchContributor(contributorParam.full_name, role);
		if (res.rowCount == null || res.rowCount < 1) {
			const contributorBuildUp: ContributorInterface = {
				id: null,
				full_name: contributorParam.full_name,
				years_active: contributorParam.years_active,
				role: role,
				notes: contributorParam.notes ?? 'added via import'
			};
			const result = await insertTable('contributor', contributorBuildUp);
			// set the new id
			if (result.rowCount != null && result.rowCount > 0 && result.rows[0].id > 0) {
				contributorBuildUp.id = result.rows[0].id;
			}
			return contributorBuildUp;
		}

		return {
			id: res.rows[0].id,
			full_name: res.rows[0].full_name,
			years_active: res.rows[0].years_active,
			role: res.rows[0].role ?? defaultContributorRole,
			notes: res.rows[0].notes
		};
	}

	// searches for matching accompanist by name returning their id
	// otherwise creates new accompanist entry
	private async processAccompanist(
		accompanist_name: string | null
	): Promise<AccompanistInterface | null> {
		if (accompanist_name == null) {
			return null;
		}
		// switch to first name last name when given a last name, first order
		accompanist_name = this.reverseCommaSeparated(accompanist_name);
		const res = await searchAccompanist(accompanist_name);
		if (res.rowCount == null || res.rowCount < 1) {
			const accompanist: AccompanistInterface = {
				id: null,
				full_name: accompanist_name
			};
			const result = await insertTable('accompanist', accompanist);
			// set the new id
			if (result.rowCount != null && result.rowCount > 0 && result.rows[0].id != null) {
				accompanist.id = result.rows[0].id;
			}
			return accompanist;
		}

		return {
			id: res.rows[0].id,
			full_name: res.rows[0].full_name
		};
	}

	// should not be used, age should be submitted when performer is created
	private processAge(class_name: string): number | undefined {
		const parts = class_name.split('.');
		// split out the age range
		if (parts.length > 1) {
			const ages: string[] = parts[1].split('-');
			// take the first age
			if (ages.length > 0) {
				const age = parseInt(ages[0], 10);
				return calcEpochAge(age) ? calcEpochAge(age)! : calcEpochAge(6);
			}
		}
		return undefined;
	}

	private reverseCommaSeparated(input: string): string {
		if (input.includes(',')) {
			// Split the string by the comma, reverse the parts, and join without a comma
			return input
				.split(',')
				.map((part) => part.trim())
				.reverse()
				.join(' ');
		}
		// Return the original string if no comma is found
		return input;
	}

	private async processPerformer(
		full_name: string,
		age: number,
		instrument: string,
		email: string | null,
		phone: string | null
	): Promise<PerformerInterfaceTagCreate> {
		const birthYear: number = calcEpochAge(age);
		let normalized_instrument: string = selectInstrument(instrument);
		if (normalized_instrument == null) {
			throw new PerformerError(
				`Can not parse instrument ${instrument} from performer ${full_name}`
			);
		}
		// TODO: Search is too loose: update import lookup by idempotent key or id
		const res = await searchPerformer(full_name, email, normalized_instrument);
		if (res.rowCount == null || res.rowCount < 1) {
			const importPerformer: PerformerInterfaceTagCreate = {
				id: null,
				full_name: full_name,
				epoch: birthYear,
				instrument: normalized_instrument,
				email: email,
				phone: phone,
				created: true
			};
			const new_id = await createPerformer(importPerformer);
			if (new_id != null) {
				importPerformer.id = new_id;
				importPerformer.created = true;
				return importPerformer;
			} else {
				throw new PerformanceError('Unable to import new performer');
			}
		}

		normalized_instrument = selectInstrument(res.rows[0].instrument);
		if (normalized_instrument == null) {
			throw new InstrumentError('Instrument can not be null for performer');
		}
		return {
			id: res.rows[0].id,
			full_name: res.rows[0].full_name,
			epoch: res.rows[0].epoch,
			instrument: normalized_instrument,
			email: res.rows[0].email,
			phone: res.rows[0].phone,
			created: false
		};
	}

	private async processMusicalPiece(
		printed_title: string,
		movements: string | null,
		contributors: ContributorInterface[]
	): Promise<MusicalPieceInterface> {
		if (contributors[0].id === null || contributors[0].id === null) {
			throw new ContributorError('Primary Composer Can not be null when creating musical pieces');
		}
		const second_contributor_id: number | null = contributors?.[1]?.id ?? null;
		const third_contributor_id: number | null = contributors?.[2]?.id ?? null;

		const res = await searchMusicalPiece(printed_title, contributors[0].id);
		if (res.rowCount == null || res.rowCount < 1) {
			// create new
			const musical_piece: MusicalPieceInterface = {
				id: null,
				printed_name: printed_title,
				first_contributor_id: contributors[0].id,
				all_movements: movements,
				second_contributor_id: second_contributor_id,
				third_contributor_id: third_contributor_id,
				imslp_url: null,
				comments: null,
				flag_for_discussion: false,
				discussion_notes: null,
				is_not_appropriate: false
			};
			const result = await insertTable('musical_piece', musical_piece);
			if (result.rowCount != null && result.rowCount > 0 && result.rows[0].id != null) {
				musical_piece.id = result.rows[0].id;
				return musical_piece;
			} else {
				throw new MusicalPieceError('Unable to create Musical Piece');
			}
		}

		return {
			id: res.rows[0].id,
			printed_name: res.rows[0].printed_name,
			first_contributor_id: res.rows[0].first_contributor_id,
			all_movements: res.rows[0].all_movements,
			second_contributor_id: res.rows[0].second_contributor_id,
			third_contributor_id: res.rows[0].third_contributor_id,
			imslp_url: res.rows[0].imslp_url,
			comments: res.rows[0].comments,
			flag_for_discussion: res.rows[0].flag_for_discussion,
			discussion_notes: res.rows[0].discussion_notes,
			is_not_appropriate: res.rows[0].is_not_appropriate,
			updated_at: res.rows[0].updated_at
		};
	}

	private async processLottery(class_name: string, lottery: number): Promise<boolean> {
		const res = await getClassLottery(class_name);
		if (res.rowCount == null || res.rowCount < 1) {
			if (!(await insertClassLottery(class_name, lottery))) {
				throw new PerformanceError('Unable to create Class Lottery');
			}
		} else {
			if (res.rows[0].lottery != lottery) {
				throw new PerformanceError(
					`Class ${class_name} already exists with a different lottery number. Aborting update.`
				);
			}
		}
		// success
		return true;
	}

	private async processPerformance(
		performer: PerformerInterfaceTagCreate,
		class_name: string,
		accompanist_id: number | null,
		concert_series: string
	): Promise<PerformanceInterfaceTagCreate> {
		if (performer?.id == null) {
			throw new PerformerError("Can't process Performance with null performer");
		}
		const normalizedClass = class_name.trim();
		const normalizedSeries = concert_series.trim();
		const res = await searchPerformanceByPerformerAndClass(
			performer.id,
			normalizedClass,
			normalizedSeries,
			year()
		);
		if (res.rowCount == null || res.rowCount < 1) {
			const thisPerformance: PerformanceInterfaceTagCreate = {
				id: null,
				class: normalizedClass,
				performer_name: performer.full_name,
				duration: null,
				accompanist_id: accompanist_id,
				concert_series: normalizedSeries,
				year: year(),
				instrument: performer.instrument,
				created: true
			};
			const performanceResult = await insertPerformance(
				thisPerformance,
				performer.id,
				null,
				null,
				null,
				null,
				null
			);
			thisPerformance.id = performanceResult.rows[0].id;
			thisPerformance.duration = performanceResult.rows[0].duration;
			thisPerformance.created = true;

			return thisPerformance;
		}

		return {
			id: res.rows[0].id,
			performer_name: res.rows[0].performer_name,
			class: res.rows[0].class_name ?? normalizedClass,
			duration: res.rows[0].duration,
			accompanist_id: res.rows[0].accompanist_id,
			concert_series: res.rows[0].concert_series ?? normalizedSeries,
			year: res.rows[0].year,
			instrument: res.rows[0].instrument,
			created: false
		};
	}

	/*
	 * delete performer, performance, and associated lottery
	 * Lookup the performer and get the id
	 * Lookup the performance and get the id
	 * Delete DB Performance and PerformancePieces
	 * Delete DB Performer and Performer Lottery
	 */
	public async deleteByLookup(
		className: string,
		performerName: string,
		age: number,
		concertSeries: string,
		instrument: string
	) {
		const performerRes = await searchPerformer(performerName, null, selectInstrument(instrument));

		let performerId: number;
		if (
			performerRes.rowCount != null &&
			performerRes.rowCount > 0 &&
			performerRes.rows[0].id != null
		) {
			performerId = performerRes.rows[0].id;
		} else {
			return { result: 'error', reason: 'Not Found' };
		}

		const normalizedClassName = className.trim();
		const normalizedConcertSeries = concertSeries.trim();
		const performanceRes = await searchPerformanceByPerformerAndClass(
			performerId,
			normalizedClassName,
			normalizedConcertSeries,
			year()
		);
		let performanceId: number;
		if (
			performanceRes.rowCount != null &&
			performanceRes.rowCount > 0 &&
			performanceRes.rows[0].id != null
		) {
			performanceId = performanceRes.rows[0].id;
		} else {
			throw new PerformanceError('Unable to Find Performance');
		}

		if (performanceId != undefined && performanceId > 0) {
			await deleteById('performance', performanceId);
			await deletePerformancePieceByPerformanceId(performanceId);
		}
		return { result: 'success', performerId: performerId, performanceId: performanceId };
	}

	public async deleteAll() {
		if (this.performance != undefined && this.performance.id != null && this.performance.id > 0) {
			await deleteById('performance', this.performance.id);
			await deleteClassLottery(this.performance.class);
		}
		if (
			this.musical_piece_1 != undefined &&
			this.musical_piece_1.id != null &&
			this.musical_piece_1.id > 0
		) {
			await deleteById('musical_piece', this.musical_piece_1.id);
		}
		if (
			this.performance != undefined &&
			this.performance.id != null &&
			this.performance.id > 0 &&
			this.musical_piece_1 != undefined &&
			this.musical_piece_1.id != null &&
			this.musical_piece_1.id > 0
		) {
			await deleteById('performance', this.performance.id);
			const performancePieceToDelete: PerformancePieceInterface = {
				performance_id: this.performance.id,
				musical_piece_id: this.musical_piece_1.id,
				movement: null
			};
			await deletePerformancePieceMap(performancePieceToDelete);
		}
		if (this.performer != undefined && this.performer.id != null && this.performer.id > 0) {
			await deleteById('performer', this.performer.id);
		}
	}
}

interface FailedRecord {
	reason: string;
	data: ImportPerformanceInterface;
}

export class DataParser {
	public performances: Performance[] = [];
	public failedImports: FailedRecord[] = [];

	async initialize(data: string, type: 'CSV' | 'JSON', concert_series: string) {
		let parsedData = [];
		if (type === 'CSV') {
			parsedData = this.parseCSV(data);
		} else if (type === 'JSON') {
			parsedData = this.parseJSON(data);
		} else {
			throw new Error("Invalid data type. Expected 'CSV' or 'JSON'.");
		}

		for (const record of parsedData) {
			const imported: ImportPerformanceInterface = {
				class_name: record.class_name,
				performer: record.performer,
				age: record.age,
				lottery: record.lottery,
				instrument: record.instrument,
				concert_series: record.concert_series ? record.concert_series : concert_series,
				musical_piece: record.musical_piece as ImportMusicalTitleInterface[],
				...(record.accompanist != null && record.accompanist !== ''
					? { accompanist: String(record.accompanist) }
					: { accompanist: null }),
				...(record.email != null && record.email !== ''
					? { email: String(record.email) }
					: { email: null }),
				...(record.phone != null && record.phone !== ''
					? { phone: String(record.phone) }
					: { phone: null })
			};
			const singlePerformance = new Performance();
			try {
				await singlePerformance.initialize(imported);
				this.performances.push(singlePerformance);
			} catch (error) {
				const failedRecord: FailedRecord = {
					reason: (error as Error).message,
					data: imported
				};
				this.failedImports.push(failedRecord);
			}
		}
	}

	private parseCSV(data: string): ImportPerformanceInterface[] {
		const parsed = Papa.parse<ImportPerformanceInterface>(data, {
			header: true,
			skipEmptyLines: true,
			dynamicTyping: true // Converts numbers to numbers, booleans, etc.
		});

		if (parsed.errors.length > 0) {
			throw new Error('Error parsing Import CSV data.');
		}

		for (const record of parsed.data) {
			const musicalPiecesFromCSV: ImportMusicalTitleInterface[] = [];
			if (record.piece_1 != null && record.contributors_1 != null) {
				musicalPiecesFromCSV.push({
					title: record.piece_1,
					contributors: [{ name: record.contributors_1, yearsActive: 'None' }]
				});
			}
			if (record.piece_2 != null && record.contributors_2 != null) {
				musicalPiecesFromCSV.push({
					title: record.piece_2,
					contributors: [{ name: record.contributors_2, yearsActive: 'None' }]
				});
			}
			record.musical_piece = musicalPiecesFromCSV;
		}
		// Type assertion to ensure data conforms to ImportPerformanceInterface[]
		return parsed.data as ImportPerformanceInterface[];
	}
	private parseJSON(data: string): ImportPerformanceInterface[] {
		try {
			const parsedData = JSON.parse(data);
			if (!Array.isArray(parsedData)) {
				throw new Error('JSON data is not an array');
			}

			return parsedData.map((item: ImportPerformanceInterface) => ({
				class_name: String(item.class_name),
				performer: String(item.performer),
				lottery: parseInt(String(item.lottery), 10),
				age: parseInt(String(item.age), 10),
				concert_series: String(item.concert_series),
				musical_piece: item.musical_piece as ImportMusicalTitleInterface[],
				instrument: String(item.instrument),
				...(item.accompanist != null && item.accompanist !== ''
					? { accompanist: String(item.accompanist) }
					: { accompanist: null }),
				...(item.email != null && item.email !== ''
					? { email: String(item.email) }
					: { email: null }),
				...(item.phone != null && item.phone !== ''
					? { phone: String(item.phone) }
					: { phone: null })
			}));
		} catch {
			throw new Error('Invalid JSON format.');
		}
	}
}
