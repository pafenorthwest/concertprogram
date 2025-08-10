import { describe, it, assert, expect } from 'vitest';
import { auth_code } from '$env/static/private';
import { unpackBody } from '$lib/server/common';

describe('Test Composer HTTP APIs', () => {
	it('It should get composer by id', async () => {
		const getResponse = await fetch('http://localhost:5173/api/composer/1', {
			method: 'GET'
		});
		expect(getResponse.status).toBe(200);

		// parse stream to get body
		if (getResponse.body != null) {
			const bodyFromRequest = await unpackBody(getResponse.body);
			// create object from parsed stream to get id of newly created accompanist
			const resultObject = JSON.parse(bodyFromRequest);
			expect(resultObject[0].id).toBe(1);
		} else {
			assert(false, 'unable to parse body of composer request');
		}
	});
	it('It should return no-auth', async () => {
		const getResponse = await fetch('http://localhost:5173/api/composer/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ full_name: 'John John', years_active: '1980 - 2000' })
		});
		expect(getResponse.status).toBe(401);
	});
	it('It should return not-authorized for POST', async () => {
		const getResponse = await fetch('http://localhost:5173/api/composer', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ffffffff`
			},
			body: JSON.stringify({ full_name: 'John John', years_active: '1980 - 2000' })
		});
		expect(getResponse.status).toBe(403);
	});
	it('It should return insert with POST', async () => {
		const getResponse = await fetch('http://localhost:5173/api/composer', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${auth_code}`
			},
			body: JSON.stringify({ full_name: 'John John', years_active: '1980 - 2000' })
		});
		expect(getResponse.status).toBe(201);
		// parse stream to get body
		if (getResponse.body != null) {
			const bodyFromRequest = await unpackBody(getResponse.body);
			// create object from parsed stream to get id of newly created accompanist
			const resultObject = JSON.parse(bodyFromRequest);
			expect(resultObject.id).greaterThan(0);
		} else {
			assert(false, 'unable to parse body of composer request');
		}
	});
	it('It should return not-authorized for DELETE', async () => {
		const getResponse = await fetch('http://localhost:5173/api/composer/999999', {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ffffffff`
			}
		});
		expect(getResponse.status).toBe(403);
	});
	it('It should return not-authorized for PUT', async () => {
		const getResponse = await fetch('http://localhost:5173/api/composer/999999', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ffffffff`
			},
			body: JSON.stringify({ full_name: 'John John', years_active: '1980 - 2000' })
		});
		expect(getResponse.status).toBe(403);
	});
	it('It should return not-found for GET', async () => {
		const getResponse = await fetch('http://localhost:5173/api/composer/999999', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${auth_code}`
			}
		});
		expect(getResponse.status).toBe(404);
		// parse stream to get body
		if (getResponse.body != null) {
			const bodyFromRequest = await unpackBody(getResponse.body);
			// create object from parsed stream to get id of newly created accompanist
			const resultObject = JSON.parse(bodyFromRequest);
			expect(resultObject.result).toBe('error');
			expect(resultObject.reason).toBe('Not Found');
		} else {
			assert(false, 'unable to parse body of composer request');
		}
	});
	it('It should return error for DELETE out of range', async () => {
		const delResponse = await fetch('http://localhost:5173/api/composer/99999', {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${auth_code}`
			}
		});
		expect(delResponse.status).toBe(404);
		// parse stream to get body
		if (delResponse.body != null) {
			const bodyFromRequest = await unpackBody(delResponse.body);
			// create object from parsed stream to get id of newly created accompanist
			const resultObject = JSON.parse(bodyFromRequest);
			expect(resultObject.result).toBe('error');
			expect(resultObject.reason).toBe('Not Found');
		} else {
			assert(false, 'unable to parse body of composer request');
		}
	});
	it('It should return not-found for PUT out of range', async () => {
		const getResponse = await fetch('http://localhost:5173/api/composer/999999', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${auth_code}`
			},
			body: JSON.stringify({ full_name: 'John John', years_active: '1980 - 2000' })
		});
		expect(getResponse.status).toBe(404);
	});
});
