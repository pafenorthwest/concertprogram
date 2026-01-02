import {
	queryMusicalPieceByPerformanceId,
	queryPerformanceDetailsById,
	retrievePerformanceByLottery
} from '$lib/server/db';
import { calcEpochAge } from '$lib/server/common';
import { SlotCatalog } from '$lib/server/slotCatalog';

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
			// Fetch all performances for this season, already ordered by series/lottery
			// and filtered to the configured year. The result rows include:
			//  - performer id, lottery number, concert series
			//  - ranked slot ids that encode the performer's ranked concert preferences
			//  - concerto concerts (if any) appear first and take precedence
			const performancesWithLottery = await retrievePerformanceByLottery(this.year);
			// Only proceed if we received any rows (guard against empty seasons).
			if (performancesWithLottery.rowCount != null && performancesWithLottery.rowCount > 0) {
				// Normalize raw DB rows into a shape that is easier to work with:
				//  - chairOverride: explicit boolean for placement bypass
				//  - rankedSlotIds: numeric slot ids parsed from the DB payload
				const rawPerformances = performancesWithLottery.rows.map((performance) => ({
					...performance,
					chairOverride: performance.chair_override === true,
					rankedSlotIds: this.normalizeRankedSlotIds(performance.ranked_slot_ids)
				}));
				// Build a lookup per concert series from slot id -> concert number in series
				// so we can translate ranked slot ids into their concert numbers later.
				const slotIdToConcertNumberBySeries = new Map<string, Map<number, number>>();
				for (const concertSeries of new Set(
					rawPerformances.map((performance) => performance.concert_series)
				)) {
					const slotCatalog = await SlotCatalog.load(concertSeries, this.year);
					slotIdToConcertNumberBySeries.set(
						concertSeries,
						new Map(slotCatalog.slots.map((slot) => [slot.id, slot.concertNumberInSeries]))
					);
				}

				// Attach rankedChoiceConcerts to each performance, mapping slot ids to
				// actual concert numbers that we can use for placement.
				const performances = rawPerformances.map((performance) => {
					const slotIdMap = slotIdToConcertNumberBySeries.get(performance.concert_series);
					return {
						...performance,
						rankedChoiceConcerts: slotIdMap
							? this.mapSlotIdsToConcertNumbers(performance.rankedSlotIds, slotIdMap)
							: []
					};
				});

				// placementMap tracks each performance's assigned concert (or waitlist).
				// We will fill this map in stages while respecting capacity rules.
				const placementMap = new Map<
					number,
					{
						concertSeries: string;
						concertNumberInSeries: number;
						chairOverride: boolean;
					}
				>();

				// Eastside concerts have capacity and special handling for chair overrides;
				// other series are placed using ranked choices without the Eastside limits.
				const eastsidePerformances = performances.filter(
					(performance) => performance.concert_series.toLowerCase() === 'eastside'
				);
				const otherPerformances = performances.filter(
					(performance) => performance.concert_series.toLowerCase() !== 'eastside'
				);

				// Determine all Eastside concert numbers that appear in the ranked choices,
				// and compute the maximum number of ranked choices any performer submitted.
				const eastsideConcertNumbers = Array.from(
					new Set(eastsidePerformances.flatMap((performance) => performance.rankedChoiceConcerts))
				).sort((a, b) => a - b);
				const maxRank = eastsidePerformances.reduce(
					(max, performance) => Math.max(max, performance.rankedChoiceConcerts.length),
					0
				);

				// concertChairOverride placements come first and do not consume Eastside capacity.
				// If no preferred concert exists, the performance is placed on the waitlist.
				for (const performance of eastsidePerformances.filter(
					(performance) => performance.chairOverride
				)) {
					const preferredConcert = performance.rankedChoiceConcerts[0];
					if (preferredConcert != null) {
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

				// Helper to apply a stable sort by lottery number, then performance order,
				// then performer id to resolve any remaining ties.
				const sortByLottery = <
					T extends { lottery: string; performance_order: number; performer_id: number }
				>(
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

				// Fill Eastside seats by iterating through ranked choices (rank 1, rank 2, ...),
				// and then through each concert number. Candidates are sorted by lottery so
				// lower lottery numbers get priority at the current rank.
				for (let rankIndex = 0; rankIndex < maxRank; rankIndex += 1) {
					for (const concertNum of eastsideConcertNumbers) {
						const candidates = eastsidePerformances.filter(
							(performance) =>
								!performance.chairOverride &&
								!placementMap.has(performance.id) &&
								performance.rankedChoiceConcerts[rankIndex] === concertNum
						);

						for (const candidate of sortByLottery(candidates)) {
							// Only place the candidate if the concert still has capacity.
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

				// Any Eastside performance left unassigned after filling capacity
				// is placed on the waitlist (still preserving chairOverride if set).
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

				// For non-Eastside series, choose the first ranked concert that is not full.
				// If none are available, place the performance on the waitlist.
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

				// Build the final ordered performance entries by enriching each placement
				// with musical titles and performance details.
				for (const performance of performances) {
					const placement = placementMap.get(performance.id);
					if (!placement) {
						continue;
					}

					// Query titles and details for each performance. Missing details
					// are treated as a signal to skip the entry.
					const musicalTitles = await this.queryMusicalPiece(performance.id);
					const performanceDetails = await this.queryPerformanceDetails(performance.id);
					if (!performanceDetails) {
						console.warn(
							`Skipping program entry for performance ${performance.id}: missing performance details`
						);
						continue;
					}

					// Assemble the fully-hydrated ordered performance record.
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
			// Wrap errors to provide a more specific failure context to callers.
			throw new Error(`Failed to build program ${(error as Error).message}`);
		}
	}

	// when retrieving sort by Concert Series, Concert Number in Series, and Performance Order
	//   - late arrivals get default order of 100, and likely will fall to bottom
	retrieveAllConcertPrograms(): OrderedPerformanceInterface[] {
		// Sort by series then concert number. Waitlist entries are sorted
		// by lottery/order/performer to keep a stable, fair ordering.
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

	normalizeRankedSlotIds(choiceSlots: unknown): number[] {
		if (!Array.isArray(choiceSlots)) {
			return [];
		}
		return choiceSlots
			.map((slot) => Number(slot))
			.filter((slot) => Number.isInteger(slot) && slot >= 0);
	}

	mapSlotIdsToConcertNumbers(
		slotIds: number[],
		slotIdToConcertNumber: Map<number, number>
	): number[] {
		return slotIds
			.map((slotId) => slotIdToConcertNumber.get(slotId))
			.filter((concertNumber): concertNumber is number => Number.isInteger(concertNumber));
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
