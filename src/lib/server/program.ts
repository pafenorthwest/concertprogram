import {
	queryMusicalPieceByPerformanceId,
	queryPerformanceDetailsById,
	retrievePerformanceByLottery
} from '$lib/server/db';
import { calcEpochAge } from '$lib/server/common';

export interface ProgramComposerInterface {
	printedName: string;
	yearsActive: string;
}
export interface MusicalTitleInterface {
	title: string;
	movement: string;
	contributors: ProgramComposerInterface[];
}
export interface PerformanceDetailsInterface {
	id: number;
	performerId: number;
	performerName: string;
	instrument: string;
	age: number;
	accompanist: string;
	duration: number;
	comment: string | null;
}

export interface OrderedPerformanceInterface extends PerformanceDetailsInterface {
	lottery: string;
	concertSeries: string;
	concertNumberInSeries: number;
	order: number;
	musicalTitles: MusicalTitleInterface[];
}

export interface ConcertDetailInterface {
	[key: string]: number;
}

export interface ProgramCSVExportInterface extends PerformanceDetailsInterface {
	concertSeries: string;
	concertNum: number;
	id: number;
	musicalPieceOneTitle: string;
	musicalPieceOneMovement: string;
	musicalPieceOneComposer1: string;
	musicalPieceOneComposer2: string;
	musicalPieceOneComposer3: string;
	musicalPieceTwoTitle: string;
	musicalPieceTwoMovement: string;
	musicalPieceTwoComposer1: string;
	musicalPieceTwoComposer2: string;
	musicalPieceTwoComposer3: string;
}

class ConcertCount {
	orderMap: ConcertDetailInterface = {};

	createKey = (str: string, num: number): string => `${str.toLowerCase()}-${num}`;

	init(concertSeries: string, concertNumberInSeries: number) {
		this.set(concertSeries, concertNumberInSeries, 1);
	}
	increment(concertSeries: string, concertNumberInSeries: number) {
		this.set(
			concertSeries,
			concertNumberInSeries,
			this.get(concertSeries, concertNumberInSeries) + 1
		);
	}
	set(concertSeries: string, concertNumberInSeries: number, count: number) {
		this.orderMap[this.createKey(concertSeries, concertNumberInSeries)] = count;
	}
	get(concertSeries: string, concertNumberInSeries: number): number {
		return this.orderMap[this.createKey(concertSeries, concertNumberInSeries)];
	}
	exists(concertSeries: string, concertNumberInSeries: number): boolean {
		return (
			this.orderMap[this.createKey(concertSeries, concertNumberInSeries)] != null &&
			this.orderMap[this.createKey(concertSeries, concertNumberInSeries)] >= 0
		);
	}
}

export class Program {
	year: number;
	eastSideSeats: number;
	orderedPerformance: OrderedPerformanceInterface[] = [];
	count: ConcertCount = new ConcertCount();

	constructor(year: number, eastsideSeats: number = 10) {
		this.year = year;
		this.eastSideSeats = eastsideSeats;
	}

	async build() {
		try {
			// fetch performances order by concert_series & lottery
			//  - performer id, lottery num, concert_series, array of ranked slot numbers
			//  - filter by year
			//  - concerto concerts show up first and takes precedent
			const performancesWithLottery = await retrievePerformanceByLottery(this.year);
			if (performancesWithLottery.rowCount != null && performancesWithLottery.rowCount > 0) {
				// iterate over the list in order, add the performances
				//  - track seat limit per EastSide concert (#1,#2,#3,#4), and stop adding when limit reached
				//  - choncertChairChoice overrides and ignores any limits
				for (const performance of performancesWithLottery.rows) {
					const rankedChoiceConcerts = this.normalizeRankedChoices(performance.ranked_slots);

					let hasPlacement = false;
					let numberInSeries = 1;
					for (const concertNum of rankedChoiceConcerts) {
						// Not Full Set to This Concert
						if (!this.isFull(performance.concert_series, concertNum)) {
							this.incrementConcertCount(performance.concert_series, concertNum);
							numberInSeries = concertNum;
							hasPlacement = true;
							break;
						}
						// Last Concert Was Full Move to Next
					}

					// build array of musical title
					const musicalTitles = await this.queryMusicalPiece(performance.id);
					// get performance details
					const performanceDetails = await this.queryPerformanceDetails(performance.id);
					if (!performanceDetails) {
						console.warn(
							`Skipping program entry for performance ${performance.id}: missing performance details`
						);
						continue;
					}

					// add performance
					this.orderedPerformance.push({
						id: performance.id,
						performerId: performance.performer_id,
						performerName: performanceDetails.performerName,
						instrument: performanceDetails.instrument,
						duration: performanceDetails.duration,
						age: performanceDetails.age,
						accompanist: performanceDetails.accompanist,
						lottery: performance.lottery,
						// put Remaining performers, whose desired schedule can not be met  into "Waitlist" concert series
						concertSeries: hasPlacement ? performance.concert_series : 'Waitlist',
						concertNumberInSeries: numberInSeries,
						order: performance.performance_order,
						musicalTitles: musicalTitles,
						comment: performanceDetails.comment
					});
				}
			}
		} catch (error) {
			throw new Error(`Failed to build program ${(error as Error).message}`);
		}
	}

	// when retrieving sort by Concert Series, Concert Number in Series, and Performance Order
	//   - late arrivals get default order of 100, and likely will fall to bottom
	retrieveAllConcertPrograms(): OrderedPerformanceInterface[] {
		return this.orderedPerformance.sort((a, b) => {
			if (a.concertSeries !== b.concertSeries) {
				return a.concertSeries.localeCompare(b.concertSeries);
			}
			if (a.concertNumberInSeries !== b.concertNumberInSeries) {
				return a.concertNumberInSeries - b.concertNumberInSeries;
			}
			return a.order - b.order;
		});
	}

	incrementConcertCount(concertSeries: string, numberInSeries: number): void {
		// switch to EastSide form Concerto
		if (this.count.exists(concertSeries, numberInSeries)) {
			this.count.increment(concertSeries, numberInSeries);
		} else {
			this.count.init(concertSeries, numberInSeries);
		}
	}

	normalizeRankedChoices(choiceSlots: unknown): number[] {
		if (!Array.isArray(choiceSlots)) {
			return [];
		}
		return choiceSlots
			.map((slot) => Number(slot))
			.filter((slot) => Number.isInteger(slot) && slot >= 0);
	}

	isFull(concertSeries: string, concertNum: number): boolean {
		return (
			concertSeries.toLowerCase() === 'eastside' &&
			this.count.get(concertSeries, concertNum) >= this.eastSideSeats
		);
	}

	async queryMusicalPiece(performanceId: number): Promise<MusicalTitleInterface[]> {
		const data = await queryMusicalPieceByPerformanceId(performanceId);
		const musicalTitles: MusicalTitleInterface[] = [];
		if (data.rowCount == null || data.rowCount === 0) {
			return musicalTitles;
		}
		for (const piece of data.rows) {
			const contributors: ProgramComposerInterface[] = [];
			if (piece.composer_one_name != null) {
				contributors.push({
					printedName: piece.composer_one_name,
					yearsActive: piece.composer_one_years
				});
			}
			if (piece.composer_two_name != null) {
				contributors.push({
					printedName: piece.composer_two_name,
					yearsActive: piece.composer_two_years
				});
			}
			if (piece.composer_three_name != null) {
				contributors.push({
					printedName: piece.composer_three_name,
					yearsActive: piece.composer_two_years
				});
			}
			if (piece.printed_name != null) {
				musicalTitles.push({
					title: piece.printed_name,
					movement: piece.movement ? piece.movement : '',
					contributors: contributors
				});
			}
		}
		return musicalTitles;
	}

	async queryPerformanceDetails(
		performanceId: number
	): Promise<PerformanceDetailsInterface | null> {
		const data = await queryPerformanceDetailsById(performanceId);
		if (data.rowCount == null || data.rowCount === 0) {
			return null;
		}
		return {
			id: performanceId,
			performerId: data.rows[0].performer_id,
			performerName: data.rows[0].performer_full_name,
			instrument: data.rows[0].instrument,
			age: calcEpochAge(data.rows[0].epoch),
			accompanist: data.rows[0].accompanist_name ? data.rows[0].accompanist_name : '',
			duration: data.rows[0].duration,
			comment: data.rows[0].comment
		};
	}
}
