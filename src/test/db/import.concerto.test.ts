import { describe, it, expect } from 'vitest';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { DataParser } from '$lib/server/import';
import { pool } from '$lib/server/db';

async function cleanupConcertoClasses(classNames: string[]) {
	const client = await pool.connect();
	try {
		await client.query('BEGIN');
		await client.query(
			`DELETE FROM performance_pieces
       WHERE performance_id IN (
         SELECT id
         FROM performance
         WHERE class_name = ANY($1)
       )`,
			[classNames]
		);
		await client.query(
			`DELETE FROM adjudicated_pieces
       WHERE performance_id IN (
         SELECT id
         FROM performance
         WHERE class_name = ANY($1)
       )`,
			[classNames]
		);
		await client.query('DELETE FROM performance WHERE class_name = ANY($1)', [classNames]);
		await client.query('DELETE FROM class_lottery WHERE class_name = ANY($1)', [classNames]);
		await client.query('COMMIT');
	} catch (error) {
		await client.query('ROLLBACK');
		throw error;
	} finally {
		client.release();
	}
}

describe('CSV Import', () => {
	it('should import each row from Concerto.csv', async () => {
		const csvPath = path.resolve(__dirname, '../../../test-data/Concerto.csv');
		const csvData = fs.readFileSync(csvPath, 'utf8');
		const classNames = csvData
			.toString()
			.split('\n')
			.slice(1)
			.map((row) => row.split(',', 2)[0]?.trim())
			.filter((className): className is string => Boolean(className));

		await cleanupConcertoClasses(classNames);

		const parsed = new DataParser();
		if (csvData != null) {
			await parsed.initialize(csvData.toString(), 'CSV', 'Concerto');
			expect(parsed.failedImports.length).toBe(0); // Ensure no parsing errors
		}
	});
});
