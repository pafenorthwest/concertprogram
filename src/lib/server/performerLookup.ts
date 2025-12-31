import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { isNonEmptyString, type PerformerSearchResultsInterface } from '$lib/server/common';
import { lookupByCode, lookupByDetails } from '$lib/server/db';

type LookupStatus = PerformerSearchResultsInterface['status'];

const baseResult = (status: LookupStatus): PerformerSearchResultsInterface => ({
	status,
	performer_id: 0,
	performer_name: '',
	musical_piece: '',
	lottery_code: 0,
	concert_series: '',
	performance_id: 0,
	performance_duration: 0,
	performance_comment: null
});

export class PerformerLookup {
	private purify: DOMPurify.DOMPurifyI;

	private constructor(purify: DOMPurify.DOMPurifyI) {
		this.purify = purify;
	}

	static create(): PerformerLookup {
		const window = new JSDOM('').window;
		return new PerformerLookup(DOMPurify(window));
	}

	private sanitize(value: string): string {
		return this.purify.sanitize(value);
	}

	private mapSuccess(result: PerformerSearchResultsInterface): PerformerSearchResultsInterface {
		return {
			status: 'OK',
			performer_id: result.performer_id,
			performer_name: result.performer_name,
			musical_piece: result.musical_piece,
			lottery_code: result.lottery_code,
			concert_series: result.concert_series,
			performance_id: result.performance_id,
			performance_duration: result.performance_duration,
			performance_comment: result.performance_comment
		};
	}

	private mapNotFound(overrides?: Partial<PerformerSearchResultsInterface>): PerformerSearchResultsInterface {
		return {
			...baseResult('NOTFOUND'),
			...overrides
		};
	}

	private mapError(): PerformerSearchResultsInterface {
		return baseResult('ERROR');
	}

	async lookupByCode(code: string): Promise<PerformerSearchResultsInterface> {
		try {
			const result = await lookupByCode(code);
			if (!result) {
				return this.mapNotFound({ lottery_code: Number(code) });
			}
			return this.mapSuccess(result);
		} catch {
			return this.mapError();
		}
	}

	async lookupByDetails(
		performerLastName: string,
		age: number,
		composerName: string
	): Promise<PerformerSearchResultsInterface> {
		try {
			const result = await lookupByDetails(performerLastName, age, composerName);
			if (!result) {
				return this.mapNotFound({ performer_name: performerLastName });
			}
			return this.mapSuccess(result);
		} catch {
			return this.mapError();
		}
	}

	async lookupFromUrl(url: URL): Promise<PerformerSearchResultsInterface> {
		const codeParam = url.searchParams.get('code');
		if (codeParam != null && isNonEmptyString(codeParam)) {
			const code = this.sanitize(codeParam);
			return this.lookupByCode(code);
		}

		const lastNameParam = url.searchParams.get('performerLastName');
		const ageParam = url.searchParams.get('age');
		const composerParam = url.searchParams.get('composerName');

		if (
			lastNameParam != null &&
			isNonEmptyString(lastNameParam) &&
			ageParam != null &&
			isNonEmptyString(ageParam) &&
			composerParam != null &&
			isNonEmptyString(composerParam)
		) {
			const performerLastName = this.sanitize(lastNameParam);
			const composerName = this.sanitize(composerParam);
			const ageValue = Number.parseInt(this.sanitize(ageParam), 10);
			if (!Number.isInteger(ageValue)) {
				return this.mapNotFound({ performer_name: performerLastName });
			}

			return this.lookupByDetails(performerLastName, ageValue, composerName);
		}

		return this.mapNotFound();
	}
}
