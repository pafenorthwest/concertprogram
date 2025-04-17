import { assert, describe, expect, it } from 'vitest';
import { auth_code } from '$env/static/private';
import { unpackBody } from '$lib/server/common';

describe('Test Composer HTTP APIs', () => {


	it('It should return not-authorized for PUT', async () => {
		const getResponse = await fetch('http://localhost:5173/api/import', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ffffffff`
			},

			body: '{"class_name": "CC.P-4.A", ' +
				'"performer": "Nymphodoros Sýkorová", ' +
				'"age": 6, '+
				'"lottery": 12345, ' +
				'"email": "QFnl@example.com", ' +
				'"phone": "999-555-4444",' +
				'"accompanist": "Zhi, Zhou",' +
				'"instrument": "Cello",' +
				'"musical_piece": [ {' +
				'"title": "Concerto in C minor 3rd movement", ' +
				'"composers": [ '+
				'{ "name": "Johann Christian Bach", "yearsActive": "None"} ' +
				' ] ' +
				' } ], ' +
				'"concert_series": "Eastside"' +
				'}'
		});
		expect(getResponse.status).toBe(403);
	});

	it('It should return insert with PUT', async () => {
		const getResponse = await fetch('http://localhost:5173/api/import', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${auth_code}`
			},
			body: '{"class_name": "CC.P-4.A", ' +
				'"performer": "Nymphodoros Sýkorová", ' +
				'"age": 6, '+
				'"lottery": 12345, ' +
				'"email": "QFnl@example.com", ' +
				'"phone": "999-555-4444",' +
				'"accompanist": "Zhi, Zhou",' +
				'"instrument": "Cello",' +
				'"musical_piece": [ {' +
				'"title": "Concerto in C minor 3rd movement", ' +
				'"composers": [ '+
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
			// create object from parsed stream to get id of newly created accompanist
			const resultObject = JSON.parse(bodyFromRequest)
			expect(resultObject.result).toBe("success")
			expect(resultObject.performanceId).greaterThan(0)
			expect(resultObject.performerId).greaterThan(0)
		} else {
			assert(false,"unable to parse body of import request")
		}
	});

	it('It should DELETE existing', async () => {
		const getResponse = await fetch('http://localhost:5173/api/import', {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${auth_code}`
			},
			body: '{"class_name": "CC.P-4.A", ' +
				'"performer_name": "Nymphodoros Sýkorová", ' +
				'"age": 6, '+
				'"instrument": "Cello",' +
				'"concert_series": "Eastside"' +
				'}'
		});
		expect(getResponse.status).toBe(201);
		// parse stream to get body
		if (getResponse.body != null) {
			const bodyFromRequest = await unpackBody(getResponse.body);
			// create object from parsed stream to get id of newly created accompanist
			const resultObject = JSON.parse(bodyFromRequest)
			expect(resultObject.result).toBe("success")
			expect(resultObject.performanceId).greaterThan(0)
			expect(resultObject.performerId).greaterThan(0)
		} else {
			assert(false,"unable to parse body of import request")
		}
	});
})