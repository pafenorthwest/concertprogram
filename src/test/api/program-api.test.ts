import { describe, it, expect } from 'vitest';
import { auth_code } from '$env/static/private';

describe('Test Program HTTP APIs', () => {
	it('It should return a program', async () => {
		const className = 'CC.9-10.W';
		const performerName = 'Sando Em';
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

		const programResponse = await fetch('http://localhost:5173/api/program', {
			method: 'GET'
		});
		expect(programResponse.status).toBe(200);
		/*
		if (programResponse.body != null) {
			const bodyFromRequest = await unpackBody(programResponse.body);
			const resultObject = JSON.parse(bodyFromRequest);
			expect(resultObject.status).toBe('OK');
		}
		*/
	});
});
