const fs = require('fs');
const path = require('path');
const { pool } = require('./src/lib/server/db');

async function runClearScript() {
	try {
		// Read the SQL script
		const sqlPath = path.join(__dirname, 'database', 'clear.sql');
		const sql = fs.readFileSync(sqlPath, 'utf8');

		// Connect to the database
		const connection = await pool.connect();

		// Execute the SQL script
		await connection.query(sql);

		console.log('Database cleared successfully.');

		// Release the connection
		connection.release();
	} catch (error) {
		console.error('Error clearing database:', error);
	} finally {
		// Close the pool
		await pool.end();
	}
}

runClearScript();
