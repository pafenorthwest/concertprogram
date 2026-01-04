import { describe, it, assert, expect } from 'vitest';
import { auth_code } from '$env/static/private';
import { unpackBody } from '$lib/server/common';

describe('Test Performance HTTP APIs', () => {
	it('It should return no-auth', async () => {
		let getResponsePerformance = await fetch('http://localhost:8888/api/performance/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				performer_name: 'Emma Carter',
				concert_series: 'Concerto'
			})
		});
		expect(getResponsePerformance.status).toBe(401);
		getResponsePerformance = await fetch('http://localhost:8888/api/performance/1', {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			}
		});
		expect(getResponsePerformance.status).toBe(401);
	});

	it('It should return not-authorized', async () => {
		let getResponsePerformance = await fetch('http://localhost:8888/api/performance/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: 'Bearer ffffff'
			},
			body: JSON.stringify({
				lottery_class: 'CC.9-10.A',
				performer_name: 'Emma Carter',
				concert_series: 'Concerto'
			})
		});
		expect(getResponsePerformance.status).toBe(401);
		getResponsePerformance = await fetch('http://localhost:8888/api/performance/1', {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: 'Bearer ffffff'
			}
		});
		expect(getResponsePerformance.status).toBe(401);
	});

	it('It should error when required fields are not present', async () => {
		const createResponsePerformance = await fetch('http://localhost:8888/api/performance/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${auth_code}`
			},
			body: JSON.stringify({})
		});
		expect(createResponsePerformance.status).toBe(400);

		// parse stream to get body
		if (createResponsePerformance.body != null) {
			const bodyFromRequest = await unpackBody(createResponsePerformance.body);
			// create object from parsed stream to get id of newly created performance
			const resultObject = JSON.parse(bodyFromRequest);
			expect(resultObject.reason).toBe('Invalid Instrument');
		}
	});

	it('It should create and destroy performance', async () => {
		const createResponse = await fetch('http://localhost:8888/api/performance/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${auth_code}`
			},
			body: JSON.stringify({
				instrument: 'Cello',
				performer_name: 'Emma Carter',
				concert_series: 'Concerto'
			})
		});
		expect(createResponse.status).toBe(201);

		// parse stream to get body
		if (createResponse.body != null) {
			const bodyFromRequest = await unpackBody(createResponse.body);
			// create object from parsed stream to get id of newly created performance
			const resultObject = JSON.parse(bodyFromRequest);
			const newId = resultObject.id;
			expect(+newId).toBeGreaterThan(0);
			const delResponse = await fetch(`http://localhost:8888/api/performance/${newId}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${auth_code}`
				}
			});
			expect(delResponse.status).toBe(200);
		} else {
			assert(false, 'unable to parse body of create performance request');
		}
	});
});
