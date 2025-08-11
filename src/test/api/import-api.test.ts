import { assert, beforeAll, describe, expect, it } from 'vitest';
import { auth_code } from '$env/static/private';
import { unpackBody } from '$lib/server/common';
import { generateRandomString, generateSixDigitNumber } from '$lib/server/randomForTest';

let randomNameOne: string;
let randomEmailOne: string;
let randomLotteryOne: number;
let randomClassOne: string;
let randomNameTwo: string;
let randomEmailTwo: string;
let randomLotteryTwo: number;
let randomClassTwo: string;

beforeAll(() => {
	randomNameOne = generateRandomString();
	randomEmailOne = generateRandomString();
	randomLotteryOne = generateSixDigitNumber();
	randomClassOne = generateRandomString(6);
	randomNameTwo = generateRandomString();
	randomEmailTwo = generateRandomString();
	randomLotteryTwo = generateSixDigitNumber();
	randomClassTwo = generateRandomString(6);
});

describe('Test Import HTTP APIs', () => {
	it('It should return no auth header', async () => {
		const getResponse = await fetch('http://localhost:8888/api/import', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},

			body:
				'{"class_name": "' +
				randomClassOne +
				'", ' +
				'"performer": "' +
				randomNameOne +
				'", ' +
				'"age": 6, ' +
				'"lottery": ' +
				randomLotteryOne +
				', ' +
				'"email": "' +
				randomEmailOne +
				'", ' +
				'"phone": "999-555-4444",' +
				'"accompanist": "Zhi, Zhou",' +
				'"instrument": "Cello",' +
				'"musical_piece": [ {' +
				'"title": "Concerto in C minor 3rd movement", ' +
				'"composers": [ ' +
				'{ "name": "Johann Christian Bach", "yearsActive": "None"} ' +
				' ] ' +
				' } ], ' +
				'"concert_series": "Eastside"' +
				'}'
		});
		expect(getResponse.status).toBe(401);
		// parse stream to get body
		if (getResponse.body != null) {
			const bodyFromRequest = await unpackBody(getResponse.body);
			const resultObject = JSON.parse(bodyFromRequest);
			expect(resultObject.result).toBe('error');
		} else {
			assert(false, 'unable to parse body of import request');
		}
	});

	it('It should return not-authorized for PUT', async () => {
		const getResponse = await fetch('http://localhost:8888/api/import', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ffffffff`
			},

			body:
				'{"class_name": "' +
				randomClassOne +
				'", ' +
				'"performer": "' +
				randomNameOne +
				'", ' +
				'"age": 6, ' +
				'"lottery": ' +
				randomLotteryOne +
				', ' +
				'"email": "' +
				randomEmailOne +
				'", ' +
				'"phone": "999-555-4444",' +
				'"accompanist": "Zhi, Zhou",' +
				'"instrument": "Cello",' +
				'"musical_piece": [ {' +
				'"title": "Concerto in C minor 3rd movement", ' +
				'"composers": [ ' +
				'{ "name": "Johann Christian Bach", "yearsActive": "None"} ' +
				' ] ' +
				' } ], ' +
				'"concert_series": "Eastside"' +
				'}'
		});
		expect(getResponse.status).toBe(403);
		// parse stream to get body
		if (getResponse.body != null) {
			const bodyFromRequest = await unpackBody(getResponse.body);
			const resultObject = JSON.parse(bodyFromRequest);
			expect(resultObject.result).toBe('error');
		} else {
			assert(false, 'unable to parse body of import request');
		}
	});

	it('It should return insert with PUT', async () => {
		const getResponse = await fetch('http://localhost:8888/api/import', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${auth_code}`
			},
			body:
				'{"class_name": "' +
				randomClassOne +
				'", ' +
				'"performer": "' +
				randomNameOne +
				'", ' +
				'"age": 6, ' +
				'"lottery": ' +
				randomLotteryOne +
				', ' +
				'"email": "' +
				randomEmailOne +
				'", ' +
				'"phone": "999-555-4444",' +
				'"accompanist": "Zhi, Zhou",' +
				'"instrument": "Cello",' +
				'"musical_piece": [ {' +
				'"title": "Concerto in C minor 3rd movement", ' +
				'"composers": [ ' +
				'{ "name": "Johann Christian Bach", "yearsActive": "None"} ' +
				' ] ' +
				' } ], ' +
				'"concert_series": "Eastside"' +
				'}'
		});
		expect(getResponse.status).toBe(201);
		// parse stream to get body
		if (getResponse.body != null) {
			const bodyFromRequest = await unpackBody(getResponse.body);
			const resultObject = JSON.parse(bodyFromRequest);
			expect(resultObject.result).toBe('success');
			expect(resultObject.performanceId).greaterThan(0);
			expect(resultObject.performerId).greaterThan(0);
		} else {
			assert(false, 'unable to parse body of import request');
		}
	});

	it('It should DELETE existing', async () => {
		const getResponse = await fetch('http://localhost:8888/api/import', {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${auth_code}`
			},
			body:
				'{"class_name": "' +
				randomClassOne +
				'", ' +
				'"performer_name": "' +
				randomNameOne +
				'", ' +
				'"age": 6, ' +
				'"instrument": "Cello",' +
				'"concert_series": "Eastside"' +
				'}'
		});
		expect(getResponse.status).toBe(200);
		// parse stream to get body
		if (getResponse.body != null) {
			const bodyFromRequest = await unpackBody(getResponse.body);
			const resultObject = JSON.parse(bodyFromRequest);
			expect(resultObject.result).toBe('success');
			expect(resultObject.performanceId).greaterThan(0);
			expect(resultObject.performerId).greaterThan(0);
		} else {
			assert(false, 'unable to parse body of import request');
		}
	});

	it('It should return Not Found when Delete non-existing', async () => {
		const getResponse = await fetch('http://localhost:8888/api/import', {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${auth_code}`
			},
			body:
				'{"class_name": "' +
				randomClassOne +
				'", ' +
				'"performer_name": "Does Not Exist", ' +
				'"age": 99, ' +
				'"instrument": "Cello",' +
				'"concert_series": "Eastside"' +
				'}'
		});
		expect(getResponse.status).toBe(404);
		// parse stream to get body
		if (getResponse.body != null) {
			const bodyFromRequest = await unpackBody(getResponse.body);
			const resultObject = JSON.parse(bodyFromRequest);
			expect(resultObject.result).toBe('error');
		} else {
			assert(false, 'unable to parse body of import request');
		}
	});

	it('It should insert multiple pieces with PUT', async () => {
		const getResponse = await fetch('http://localhost:8888/api/import', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${auth_code}`
			},
			body:
				'{ "class_name": "' +
				randomClassTwo +
				'", ' +
				'"performer": "' +
				randomNameTwo +
				'", ' +
				'"age": 6, ' +
				'"lottery": ' +
				randomLotteryTwo +
				', ' +
				'"email": "' +
				randomEmailTwo +
				'", ' +
				'"phone": "999-555-4444",' +
				'"accompanist": "Zhi, Zhou",' +
				'"instrument": "Cello",' +
				'"musical_piece": [ {' +
				'"title": "Concerto in C minor 3rd movement", ' +
				'"composers": [ ' +
				'{ "name": "Johann Christian Bach", "yearsActive": "None" } ' +
				' ] ' +
				' },{ ' +
				'"title": "Scherzo no.2 in B Flat Minor, op.31", ' +
				'"composers": [ ' +
				' { "name": "Frédéric Chopin", "yearsActive": "None" } ' +
				' ] ' +
				'} ], ' +
				'"concert_series": "Eastside"' +
				'}'
		});
		expect(getResponse.status).toBe(201);
		// parse stream to get body
		if (getResponse.body != null) {
			const bodyFromRequest = await unpackBody(getResponse.body);
			const resultObject = JSON.parse(bodyFromRequest);
			expect(resultObject.result).toBe('success');
			expect(resultObject.performanceId).greaterThan(0);
			expect(resultObject.performerId).greaterThan(0);
		} else {
			assert(false, 'unable to parse body of import request');
		}
	});

	it('It should update multiple pieces with PUT', async () => {
		const getResponse = await fetch('http://localhost:8888/api/import', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${auth_code}`
			},
			body:
				'{ "class_name": "' +
				randomClassTwo +
				'", ' +
				'"performer": "' +
				randomNameTwo +
				'", ' +
				'"age": 6, ' +
				'"lottery": ' +
				randomLotteryTwo +
				', ' +
				'"email": "' +
				randomEmailTwo +
				'", ' +
				'"phone": "999-555-4444",' +
				'"accompanist": "Zhi, Zhou",' +
				'"instrument": "Cello",' +
				'"musical_piece": [ {' +
				'"title": "Arabeske in C major, Op. 18", ' +
				'"composers": [ ' +
				'{ "name": "Robert Schumann", "yearsActive": "1810 - 1856" } ' +
				' ] ' +
				' },{ ' +
				'"title": "Prelude Op 34 No.2", ' +
				'"composers": [ ' +
				' { "name": "Dmitri Shostakovich", "yearsActive": "None" } ' +
				' ] ' +
				'} ], ' +
				'"concert_series": "Eastside"' +
				'}'
		});
		expect(getResponse.status).toBe(200);
		// parse stream to get body
		if (getResponse.body != null) {
			const bodyFromRequest = await unpackBody(getResponse.body);
			const resultObject = JSON.parse(bodyFromRequest);
			expect(resultObject.result).toBe('success');
			expect(resultObject.performanceId).greaterThan(0);
			expect(resultObject.performerId).greaterThan(0);
		} else {
			assert(false, 'unable to parse body of import request');
		}
	});
});
