export interface Slot {
	id: number;
	concertSeries: string;
	year: number;
	concertNumberInSeries: number;
	startTime: string;
	displayTime: string;
}

export interface ScheduleChoice {
	performerId: number;
	concertSeries: string;
	year: number;
	slots: Array<{ slotId: number; rank: number | null; notAvailable: boolean }>;
}

export type ScheduleViewModel =
	| {
			mode: 'confirm-only';
			slotCount: 1;
			slots: Array<{
				slotId: number;
				displayTime: string;
				confirmed: boolean;
				notAvailable: boolean;
			}>;
	  }
	| {
			mode: 'rank-choice';
			slotCount: number;
			slots: Array<{
				slotId: number;
				displayTime: string;
				rank: number | null;
				notAvailable: boolean;
			}>;
			rankOptions: string[];
	  };

export interface ScheduleSubmission {
	performerId: number;
	concertSeries: string;
	year: number;
	slots: Array<{ slotId: number; rank: number | null; notAvailable: boolean }>;
}
