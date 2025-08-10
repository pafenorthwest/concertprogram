const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables from .env file if it exists
dotenv.config();

// Check if RUN_CICD is set to True
if (process.env.RUN_CICD !== 'True') {
  console.log('Operation not allowed: RUN_CICD environment variable is not set to True.');
  process.exit(0);
}

// Database configuration from environment variables
const pool = new Pool({
  user: process.env.db_user,
  host: process.env.db_host,
  database: process.env.db_name,
  password: process.env.db_pass,
  port: process.env.db_port,
  ssl: process.env.db_ssl === 'true' ? { rejectUnauthorized: false } : undefined
});

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