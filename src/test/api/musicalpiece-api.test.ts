import { describe, it, assert, expect } from 'vitest';
import { auth_code } from '$env/static/private';
import { unpackBody } from '$lib/server/common';
import { insertTable } from '$lib/server/db';
import type { MusicalPieceInterface } from '$lib/server/common';

describe('Test MusicalPiece HTTP APIs', () => {
	it('It should return no-auth', async () => {
		let getResponseMusicalPiece = await fetch('http://localhost:8888/api/musicalpiece/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				printed_name: 'Test Piece',
				first_contributor_id: 1,
				all_movements: 'Movement 1',
				second_contributor_id: 2,
				third_contributor_id: 3
			})
		});
		expect(getResponseMusicalPiece.status).toBe(401);
		getResponseMusicalPiece = await fetch('http://localhost:8888/api/musicalpiece/1', {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			}
		});
		expect(getResponseMusicalPiece.status).toBe(401);
	});

	it('It should return not-authorized', async () => {
		let getResponseMusicalPiece = await fetch('http://localhost:8888/api/musicalpiece/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: 'Bearer ffffff'
			},
			body: JSON.stringify({
				printed_name: 'Test Piece',
				first_contributor_id: 1,
				all_movements: 'Movement 1',
				second_contributor_id: 2,
				third_contributor_id: 3
			})
		});
		// db create a musical peice to delete
		const musicalPiece: MusicalPieceInterface = {
			id: null,
			printed_name: 'Fun Song',
			first_contributor_id: 10,
			all_movements: 'I. Allegro, II. Allegro',
			second_contributor_id: null,
			third_contributor_id: null
		};
		try {
			const result = await insertTable('musical_piece', musicalPiece);
			expect(getResponseMusicalPiece.status).toBe(401);
			getResponseMusicalPiece = await fetch(
				`http://localhost:8888/api/musicalpiece/${result.rows[0].id}`,
				{
					method: 'DELETE',
					headers: {
						'Content-Type': 'application/json',
						Authorization: 'Bearer ffffff'
					}
				}
			);
			expect(getResponseMusicalPiece.status).toBe(401);
		} catch {
			expect(false).toBe(true);
		}
	});

	it('It should error when required fields are not present', async () => {
		const createResponseMusicalPiece = await fetch('http://localhost:8888/api/musicalpiece/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${auth_code}`
			},
			body: JSON.stringify({})
		});
		expect(createResponseMusicalPiece.status).toBe(400);

		// parse stream to get body
		if (createResponseMusicalPiece.body != null) {
			const bodyFromRequest = await unpackBody(createResponseMusicalPiece.body);
			// create object from parsed stream to get id of newly created musical piece
			const resultObject = JSON.parse(bodyFromRequest);
			expect(resultObject.reason).toBe('Missing Fields');
		}
	});

	it('It should create and destroy musicalpiece', async () => {
		const createResponse = await fetch('http://localhost:8888/api/musicalpiece/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${auth_code}`
			},
			body: JSON.stringify({
				printed_name: 'Test Piece',
				first_contributor_id: 1,
				all_movements: 'Movement 1',
				second_contributor_id: 2,
				third_contributor_id: 3
			})
		});
		expect(createResponse.status).toBe(201);

		// parse stream to get body
		if (createResponse.body != null) {
			const bodyFromRequest = await unpackBody(createResponse.body);
			// create object from parsed stream to get id of newly created musical piece
			const resultObject = JSON.parse(bodyFromRequest);
			const newId = resultObject.id;
			expect(+newId).toBeGreaterThan(0);
			const delResponse = await fetch(`http://localhost:8888/api/musicalpiece/${newId}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${auth_code}`
				}
			});
			expect(delResponse.status).toBe(200);
		} else {
			assert(false, 'unable to parse body of create musicalpiece request');
		}
	});
});
