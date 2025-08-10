import { describe, it, expect } from 'vitest';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { DataParser } from '$lib/server/import';

describe('CSV Import', () => {
	it('should import each row from Concerto.csv', async () => {
		console.log(`${__dirname}/../../../test-data/Concerto.csv`);
		const csvPath = path.resolve(__dirname, '../../../test-data/Concerto.csv');
		const csvData = fs.readFileSync(csvPath, 'utf8');

		const parsed = new DataParser();
		if (csvData != null) {
			await parsed.initialize(csvData.toString(), 'CSV', 'Concerto');
			expect(parsed.failedImports.length).toBe(0); // Ensure no parsing errors
		}
	});
});
