const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const ws = require('ws');
const { Pool, neonConfig } = require('@neondatabase/serverless');

if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('neon.tech')) {
  neonConfig.webSocketConstructor = ws;
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error.message);
});

const query = (text, values = []) => pool.query(text, values);

const get = async (text, values = []) => {
  const result = await pool.query(text, values);
  return result.rows[0] || null;
};

async function withTransaction(callback) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, get, withTransaction };