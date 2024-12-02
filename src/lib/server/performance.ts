class PerformanceDataClass {
	id: number;
	performerId: number;
	performerName: string;
	instrument: string;
	grade: string;
	accompanist: string;
	musicalTitles: {
		title: string;
		movement: string;
		composers: {
			printed_name: string;
			years_active: string
		}[]
	}[];

	constructor(
		id: number,
		performerId: number,
		performerName: string,
		instrument: string,
		grade: string,
		accompanist: string,
		musicalTitles: {
			title: string;
			movement: string;
			composers: {
				printed_name: string,
				years_active: string
			}[]
		}[]
	) {
		this.id = id;
		this.performerId = performerId;
		this.performerName = performerName;
		this.instrument = instrument;
		this.grade = grade;
		this.accompanist = accompanist;
		this.musicalTitles = musicalTitles;
	}

	// Example method to add a musical title
	addMusicalTitle(
		title: string,
		movement: string,
		composers: {
			printed_name: string,
			years_active: string
		}[]): void {
		this.musicalTitles.push({ title, movement, composers });
	}
}

class Program {
	orderedPerformance: {
		id: number;
		lookup_code: string,
		concert_series: string;
		pafe_series: number;
		order: number;
		performance: PerformanceDataClass;
	}[];

	constructor(pafe_series: number, eastsideSeats: number = 10) {
		// create list of performers order by concert_series & lottery
		//  - performer id, lottery num, concert_series, array of concert times
		//  - filter by pafe_series
		//  - concerto concerts show up first and takes precedent
		// iterate over the list in order, add the performances
		//  - when setting the performance update the order
		//  - remove the performer from the lottery list gen in prev step
		//  - track seat limit per EastSide concert (#1,#2,#3,#4), and stop adding perf when limit reached
		// put Remaining performers into "Unscheduled" concert series
		// update database with new order ids



	}
}
