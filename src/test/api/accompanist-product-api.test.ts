import { describe, it, assert, expect } from 'vitest';
import { auth_code } from '$env/static/private';
import { unpackBody } from '$lib/server/common';

describe('Test Accompanist HTTP APIs', () => {
	it('It should return no-auth', async () => {
		let getResponseAccompanist = await fetch('http://localhost:5173/api/accompanist/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ full_name: 'John John' })
		});
		expect(getResponseAccompanist.status).toBe(401);
		let getResponsePerformer = await fetch('http://localhost:5173/api/performer/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				full_name: 'John John',
				instrument: 'Cello',
				age: 8,
				email: 'api-test@delete.me'
			})
		});
		expect(getResponsePerformer.status).toBe(401);
		getResponseAccompanist = await fetch('http://localhost:5173/api/accompanist/1', {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			}
		});
		expect(getResponseAccompanist.status).toBe(401);
		getResponsePerformer = await fetch('http://localhost:5173/api/performer/1', {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			}
		});
		expect(getResponsePerformer.status).toBe(401);
	});

	it('It should return not-authorized', async () => {
		let getResponseAccompanist = await fetch('http://localhost:5173/api/accompanist/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: 'Bearer ffffff'
			},
			body: JSON.stringify({ full_name: 'John John' })
		});
		expect(getResponseAccompanist.status).toBe(403);
		let getResponsePerformer = await fetch('http://localhost:5173/api/performer/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: 'Bearer ffffff'
			},
			body: JSON.stringify({
				full_name: 'John John',
				instrument: 'Cello',
				age: 8,
				email: 'api-test@delete.me'
			})
		});
		expect(getResponsePerformer.status).toBe(403);
		getResponseAccompanist = await fetch('http://localhost:5173/api/accompanist/1', {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: 'Bearer ffffff'
			}
		});
		expect(getResponseAccompanist.status).toBe(403);
		getResponsePerformer = await fetch('http://localhost:5173/api/performer/1', {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: 'Bearer ffffff'
			}
		});
		expect(getResponsePerformer.status).toBe(403);
	});

	it('It should error when required fileds are not present', async () => {
		const createResponseAccompanist = await fetch('http://localhost:5173/api/accompanist/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${auth_code}`
			},
			body: JSON.stringify({})
		});
		expect(createResponseAccompanist.status).toBe(400);

		// parse stream to get body
		if (createResponseAccompanist.body != null) {
			const bodyFromRequest = await unpackBody(createResponseAccompanist.body);
			// create object from parsed stream to get id of newly created accompanist
			const resultObject = JSON.parse(bodyFromRequest);
			expect(resultObject.reason).toBe('Missing Fields');
		}

		const createResponseProduct = await fetch('http://localhost:5173/api/performer/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${auth_code}`
			},
			body: JSON.stringify({ full_name: 'John John' })
		});
		expect(createResponseProduct.status).toBe(400);

		// parse stream to get body
		if (createResponseProduct.body != null) {
			const bodyFromRequest = await unpackBody(createResponseProduct.body);
			// create object from parsed stream to get id of newly created accompanist
			const resultObject = JSON.parse(bodyFromRequest);
			expect(resultObject.reason).toBe('Bad Instrument or Age Value');
		}
	});

	it('It should create and destroy accompanist', async () => {
		const createResponse = await fetch('http://localhost:5173/api/accompanist/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${auth_code}`
			},
			body: JSON.stringify({ full_name: 'John John' })
		});
		expect(createResponse.status).toBe(201);

		// parse stream to get body
		if (createResponse.body != null) {
			const bodyFromRequest = await unpackBody(createResponse.body);
			// create object from parsed stream to get id of newly created accompanist
			const resultObject = JSON.parse(bodyFromRequest);
			const newId = resultObject.id;
			expect(+newId).toBeGreaterThan(0);
			const delResponse = await fetch(`http://localhost:5173/api/accompanist/${newId}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${auth_code}`
				}
			});
			expect(delResponse.status).toBe(200);
		} else {
			assert(false, 'unable to parse body of create accompanist request');
		}
	});
	it('It should create and destroy performer', async () => {
		const createResponse = await fetch('http://localhost:5173/api/performer/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${auth_code}`
			},
			body: JSON.stringify({
				full_name: 'John John',
				instrument: 'Cello',
				age: 8,
				email: 'api-test@delete.me'
			})
		});
		expect(createResponse.status).toBe(201);

		// parse stream to get body
		if (createResponse.body != null) {
			const bodyFromRequest = await unpackBody(createResponse.body);
			// create object from parsed stream to get id of newly created accompanist
			const resultObject = JSON.parse(bodyFromRequest);
			const newId = resultObject.id;
			expect(+newId).toBeGreaterThan(0);
			const delResponse = await fetch(`http://localhost:5173/api/performer/${newId}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${auth_code}`
				}
			});
			expect(delResponse.status).toBe(200);
		} else {
			assert(false, 'unable to parse body of create accompanist request');
		}
	});
});
