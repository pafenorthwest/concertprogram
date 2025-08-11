import { describe, it, expect } from 'vitest';
import { auth_code } from '$env/static/private';
import { unpackBody } from '$lib/server/common';

describe('Test SearchPerformer HTTP APIs', () => {
	it('It should be NOTFOUND', async () => {
		const searchCodeResponse = await fetch('http://localhost:5173/api/searchPerformer/?code=1234', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${auth_code}`
			}
		});
		expect(searchCodeResponse.status).toBe(200);
		if (searchCodeResponse.body != null) {
			const bodyFromRequest = await unpackBody(searchCodeResponse.body);
			const resultObject = JSON.parse(bodyFromRequest);
			expect(resultObject.body.result.status).toBe('NOTFOUND');
		}
		const searchDetailsResponse = await fetch(
			'http://localhost:5173/api/searchPerformer/?performerLastName="emmma"&age=12&composerName="test',
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${auth_code}`
				}
			}
		);
		expect(searchDetailsResponse.status).toBe(200);
		if (searchDetailsResponse.body != null) {
			const bodyFromRequest = await unpackBody(searchDetailsResponse.body);
			const resultObject = JSON.parse(bodyFromRequest);
			expect(resultObject.body.result.status).toBe('NOTFOUND');
		}
	});
	it('It should be Error Improper Request', async () => {
		const searchResponse = await fetch('http://localhost:5173/api/searchPerformer/?age=12', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${auth_code}`
			}
		});
		expect(searchResponse.status).toBe(400);
	});
	it('It should be find the correct performer', async () => {
		const className = 'CC.9-10.W';
		const performerName = 'Emma Carter';
		const lastName = 'Carter';
		const performerAge = 12;
		const composerName = 'Frédéric Chopin';
		// first create a searchable entry
		const getResponse = await fetch('http://localhost:5173/api/import', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${auth_code}`
			},
			body:
				'{ "class_name": "' +
				className +
				'", ' +
				'"performer": "' +
				performerName +
				'", ' +
				'"age": ' +
				performerAge +
				', ' +
				'"lottery": 888999555' +
				', ' +
				'"email": "emma@youngartist.com",' +
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
				' { "name": "' +
				composerName +
				'", "yearsActive": "None" } ' +
				' ] ' +
				'} ], ' +
				'"concert_series": "Eastside"' +
				'}'
		});
		expect(getResponse.status).toBe(200);
		const searchResponse = await fetch(
			`http://localhost:5173/api/searchPerformer/?performerLastName=${lastName}&age=${performerAge}&composerName=${composerName}`,
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${auth_code}`
				}
			}
		);
		expect(searchResponse.status).toBe(200);
		if (searchResponse.body != null) {
			const bodyFromRequest = await unpackBody(searchResponse.body);
			const resultObject = JSON.parse(bodyFromRequest);
			expect(resultObject.body.result.status).not.toBe('NOTFOUND');
			expect(resultObject.body.result.performer_id).toBeGreaterThan(0);
			expect(resultObject.body.result.performer_name).toBe(performerName);
			expect(resultObject.body.result.musical_piece).toBe('Scherzo no.2 in B Flat Minor, op.31');
		}
	});
});
