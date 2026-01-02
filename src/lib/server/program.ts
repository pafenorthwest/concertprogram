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
	chairOverride: boolean;
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
				const performances = performancesWithLottery.rows.map((performance) => ({
					...performance,
					chairOverride: performance.chair_override === true,
					rankedChoiceConcerts: this.normalizeRankedChoices(performance.ranked_slots)
				}));

				const placementMap = new Map<
					number,
					{
						concertSeries: string;
						concertNumberInSeries: number;
						chairOverride: boolean;
					}
				>();

				const eastsidePerformances = performances.filter(
					(performance) => performance.concert_series.toLowerCase() === 'eastside'
				);
				const otherPerformances = performances.filter(
					(performance) => performance.concert_series.toLowerCase() !== 'eastside'
				);

				const eastsideConcertNumbers = Array.from(
					new Set(
						eastsidePerformances.flatMap((performance) => performance.rankedChoiceConcerts)
					)
				).sort((a, b) => a - b);
				const maxRank = eastsidePerformances.reduce(
					(max, performance) => Math.max(max, performance.rankedChoiceConcerts.length),
					0
				);

				// concertChairOverride placements come first and can overbook Eastside concerts.
				for (const performance of eastsidePerformances.filter(
					(performance) => performance.chairOverride
				)) {
					const preferredConcert = performance.rankedChoiceConcerts[0];
					if (preferredConcert != null) {
						this.incrementConcertCount(performance.concert_series, preferredConcert);
						placementMap.set(performance.id, {
							concertSeries: performance.concert_series,
							concertNumberInSeries: preferredConcert,
							chairOverride: true
						});
					} else {
						placementMap.set(performance.id, {
							concertSeries: 'Waitlist',
							concertNumberInSeries: 1,
							chairOverride: true
						});
					}
				}

				const sortByLottery = <T extends { lottery: string; performance_order: number; performer_id: number }>(
					items: T[]
				): T[] =>
					items.sort((a, b) => {
						const lotteryDiff = Number(a.lottery) - Number(b.lottery);
						if (lotteryDiff !== 0) {
							return lotteryDiff;
						}
						const orderDiff = a.performance_order - b.performance_order;
						if (orderDiff !== 0) {
							return orderDiff;
						}
						return a.performer_id - b.performer_id;
					});

				for (let rankIndex = 0; rankIndex < maxRank; rankIndex += 1) {
					for (const concertNum of eastsideConcertNumbers) {
						const candidates = eastsidePerformances.filter(
							(performance) =>
								!performance.chairOverride &&
								!placementMap.has(performance.id) &&
								performance.rankedChoiceConcerts[rankIndex] === concertNum
						);

						for (const candidate of sortByLottery(candidates)) {
							if (!this.isFull(candidate.concert_series, concertNum)) {
								this.incrementConcertCount(candidate.concert_series, concertNum);
								placementMap.set(candidate.id, {
									concertSeries: candidate.concert_series,
									concertNumberInSeries: concertNum,
									chairOverride: candidate.chairOverride
								});
							}
						}
					}
				}

				for (const performance of eastsidePerformances) {
					if (placementMap.has(performance.id)) {
						continue;
					}
					placementMap.set(performance.id, {
						concertSeries: 'Waitlist',
						concertNumberInSeries: 1,
						chairOverride: performance.chairOverride
					});
				}

				for (const performance of otherPerformances) {
					let hasPlacement = false;
					let numberInSeries = 1;
					for (const concertNum of performance.rankedChoiceConcerts) {
						if (!this.isFull(performance.concert_series, concertNum, performance.chairOverride)) {
							this.incrementConcertCount(performance.concert_series, concertNum);
							numberInSeries = concertNum;
							hasPlacement = true;
							break;
						}
					}
					placementMap.set(performance.id, {
						concertSeries: hasPlacement ? performance.concert_series : 'Waitlist',
						concertNumberInSeries: numberInSeries,
						chairOverride: performance.chairOverride
					});
				}

				for (const performance of performances) {
					const placement = placementMap.get(performance.id);
					if (!placement) {
						continue;
					}

					const musicalTitles = await this.queryMusicalPiece(performance.id);
					const performanceDetails = await this.queryPerformanceDetails(performance.id);
					if (!performanceDetails) {
						console.warn(
							`Skipping program entry for performance ${performance.id}: missing performance details`
						);
						continue;
					}

					this.orderedPerformance.push({
						id: performance.id,
						performerId: performance.performer_id,
						performerName: performanceDetails.performerName,
						instrument: performanceDetails.instrument,
						duration: performanceDetails.duration,
						age: performanceDetails.age,
						accompanist: performanceDetails.accompanist,
						lottery: performance.lottery,
						concertSeries: placement.concertSeries,
						concertNumberInSeries: placement.concertNumberInSeries,
						order: performance.performance_order,
						chairOverride: placement.chairOverride,
						musicalTitles,
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
			if (a.concertSeries === 'Waitlist') {
				const lotteryDiff = Number(a.lottery) - Number(b.lottery);
				if (lotteryDiff !== 0) {
					return lotteryDiff;
				}
				if (a.order !== b.order) {
					return a.order - b.order;
				}
				return a.performerId - b.performerId;
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

	// chairOverride bypass is handled explicitly when building placements.
	isFull(concertSeries: string, concertNum: number, chairOverride = false): boolean {
		if (chairOverride) {
			return false;
		}
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
					yearsActive: piece.composer_three_years
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
