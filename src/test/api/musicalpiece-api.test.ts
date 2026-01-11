import { describe, it, assert, expect } from 'vitest';
import { auth_code } from '$env/static/private';
import { unpackBody } from '$lib/server/common';
import { insertTable, pool } from '$lib/server/db';
import type { MusicalPieceInterface } from '$lib/server/common';

const baseUrl = 'http://localhost:8888/api/musicalpiece';
const divisionTagQuery = `
	SELECT division_tag
	FROM musical_piece_division_tag
	WHERE musical_piece_id = $1
`;
const categoryTagQuery = `
	SELECT category
	FROM musical_piece_category_map
	WHERE musical_piece_id = $1
`;

describe('Test MusicalPiece HTTP APIs', () => {
	it('It should return no-auth', async () => {
		let getResponseMusicalPiece = await fetch(`${baseUrl}/`, {
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
		getResponseMusicalPiece = await fetch(`${baseUrl}/1`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			}
		});
		expect(getResponseMusicalPiece.status).toBe(401);
	});

	it('It should return not-authorized', async () => {
		let getResponseMusicalPiece = await fetch(`${baseUrl}/`, {
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
			third_contributor_id: null,
			imslp_url: null,
			comments: null,
			flag_for_discussion: false,
			discussion_notes: null,
			is_not_appropriate: false
		};
		try {
			const result = await insertTable('musical_piece', musicalPiece);
			expect(getResponseMusicalPiece.status).toBe(401);
			getResponseMusicalPiece = await fetch(`${baseUrl}/${result.rows[0].id}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					Authorization: 'Bearer ffffff'
				}
			});
			expect(getResponseMusicalPiece.status).toBe(401);
		} catch {
			expect(false).toBe(true);
		}
	});

	it('It should error when required fields are not present', async () => {
		const createResponseMusicalPiece = await fetch(`${baseUrl}/`, {
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
		const createResponse = await fetch(`${baseUrl}/`, {
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
			const delResponse = await fetch(`${baseUrl}/${newId}`, {
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

	it('It should handle musicalpiece tag updates and removals', async () => {
		const createResponse = await fetch(`${baseUrl}/`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${auth_code}`
			},
			body: JSON.stringify({
				printed_name: 'Tagged Piece',
				first_contributor_id: 1,
				all_movements: 'Movement 1',
				second_contributor_id: 2,
				third_contributor_id: 3,
				division_tags: ['Piano', 'Piano'],
				category_tags: ['Solo']
			})
		});
		expect(createResponse.status).toBe(201);

		if (createResponse.body == null) {
			assert(false, 'unable to parse body of create musicalpiece request');
			return;
		}

		const bodyFromRequest = await unpackBody(createResponse.body);
		const resultObject = JSON.parse(bodyFromRequest);
		const newId = Number(resultObject.id);
		expect(newId).toBeGreaterThan(0);

		const divisionResult = await pool.query(divisionTagQuery, [newId]);
		expect(divisionResult.rows.length).toBe(1);
		expect(divisionResult.rows[0].division_tag).toBe('Piano');

		const categoryResult = await pool.query(categoryTagQuery, [newId]);
		expect(categoryResult.rows.length).toBe(1);
		expect(categoryResult.rows[0].category).toBe('Solo');

		const removeDivisionResponse = await fetch(`${baseUrl}/${newId}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${auth_code}`
			},
			body: JSON.stringify({
				printed_name: 'Tagged Piece',
				first_contributor_id: 1,
				all_movements: 'Movement 1',
				second_contributor_id: 2,
				third_contributor_id: 3,
				rm_division_tags: ['Piano']
			})
		});
		expect(removeDivisionResponse.status).toBe(200);

		const divisionAfterRemoval = await pool.query(divisionTagQuery, [newId]);
		expect(divisionAfterRemoval.rows.length).toBe(0);

		const removeCategoryResponse = await fetch(`${baseUrl}/${newId}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${auth_code}`
			},
			body: JSON.stringify({
				printed_name: 'Tagged Piece',
				first_contributor_id: 1,
				all_movements: 'Movement 1',
				second_contributor_id: 2,
				third_contributor_id: 3,
				rm_category_tags: ['Solo']
			})
		});
		expect(removeCategoryResponse.status).toBe(200);

		const categoryAfterRemoval = await pool.query(categoryTagQuery, [newId]);
		expect(categoryAfterRemoval.rows.length).toBe(0);

		const delResponse = await fetch(`${baseUrl}/${newId}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${auth_code}`
			}
		});
		expect(delResponse.status).toBe(200);
	});

	it('It should reject invalid tag values and invalid removals', async () => {
		const invalidCreateResponse = await fetch(`${baseUrl}/`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${auth_code}`
			},
			body: JSON.stringify({
				printed_name: 'Invalid Tag Piece',
				first_contributor_id: 1,
				division_tags: ['Brass']
			})
		});
		expect(invalidCreateResponse.status).toBe(400);

		const invalidCategoryResponse = await fetch(`${baseUrl}/`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${auth_code}`
			},
			body: JSON.stringify({
				printed_name: 'Invalid Category Mix',
				first_contributor_id: 1,
				category_tags: ['Not Appropriate', 'Solo']
			})
		});
		expect(invalidCategoryResponse.status).toBe(400);

		const createResponse = await fetch(`${baseUrl}/`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${auth_code}`
			},
			body: JSON.stringify({
				printed_name: 'Not Appropriate Piece',
				first_contributor_id: 1,
				category_tags: ['Not Appropriate']
			})
		});
		expect(createResponse.status).toBe(201);

		if (createResponse.body == null) {
			assert(false, 'unable to parse body of create musicalpiece request');
			return;
		}

		const bodyFromRequest = await unpackBody(createResponse.body);
		const resultObject = JSON.parse(bodyFromRequest);
		const newId = Number(resultObject.id);

		const invalidRemovalResponse = await fetch(`${baseUrl}/${newId}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${auth_code}`
			},
			body: JSON.stringify({
				printed_name: 'Not Appropriate Piece',
				first_contributor_id: 1,
				rm_category_tags: ['Not Appropriate']
			})
		});
		expect(invalidRemovalResponse.status).toBe(400);

		const delResponse = await fetch(`${baseUrl}/${newId}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${auth_code}`
			}
		});
		expect(delResponse.status).toBe(200);
	});
});
