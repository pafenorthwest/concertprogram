import { describe, it, assert, expect } from 'vitest';
import { auth_code } from '$env/static/private';
import { unpackBody } from '$lib/server/common';

describe('Test Lottery HTTP APIs', () => {
	it('It should return no-auth', async () => {
		const getResponseLottery = await fetch('http://localhost:8888/api/lottery/CC.9-10.Z', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ lottery: 876543 })
		});
		expect(getResponseLottery.headers.get('origin')).not.toBe('http://localhost:8888');
		expect(getResponseLottery.status).toBe(401);
	});

	it('It should return not-authorized', async () => {
		const getResponseLottery = await fetch('http://localhost:8888/api/lottery/CC.9-10.Z', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: 'Bearer ffffff'
			},
			body: JSON.stringify({ lottery: 876543 })
		});
		expect(getResponseLottery.headers.get('origin')).not.toBe('http://localhost:8888');
		expect(getResponseLottery.status).toBe(403);
	});

	it('It should error when required fields are not present', async () => {
		const createResponseLottery = await fetch('http://localhost:8888/api/lottery/CC.9-10.Z', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${auth_code}`
			},
			body: JSON.stringify({})
		});
		expect(createResponseLottery.status).toBe(400);

		// parse stream to get body
		if (createResponseLottery.body != null) {
			const bodyFromRequest = await unpackBody(createResponseLottery.body);
			// create object from parsed stream to get id of newly created lottery
			const resultObject = JSON.parse(bodyFromRequest);
			expect(resultObject.reason).toBe('Missing Fields');
		}
	});

	it('It should create and destroy lottery', async () => {
		const createResponse = await fetch('http://localhost:8888/api/lottery/CC.9-10.Z', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${auth_code}`
			},
			body: JSON.stringify({ lottery: 876543 })
		});
		expect(createResponse.status).toBe(201);
		// parse stream to get body
		if (createResponse.body != null) {
			const delResponse = await fetch(`http://localhost:8888/api/lottery/CC.9-10.Z`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${auth_code}`
				}
			});
			expect(delResponse.status).toBe(200);
		} else {
			assert(false, 'unable to parse body of create lottery request');
		}
	});
});
