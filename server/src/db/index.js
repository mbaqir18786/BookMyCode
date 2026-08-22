const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const ws = require('ws');
const { Pool, neonConfig } = require('@neondatabase/serverless');

// Enable WebSocket support for Neon to bypass network firewall restrictions on port 5432
if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('neon.tech')) {
  neonConfig.webSocketConstructor = ws;
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err.message);
});

// Execute SELECT queries
const query = async (sql, params = []) => {
  const result = await pool.query(sql, params);
  return result.rows;
};

// Execute a SELECT expecting one row
const get = async (sql, params = []) => {
  const result = await pool.query(sql, params);
  return result.rows[0] || null;
};

// Execute INSERT / UPDATE / DELETE
const run = async (sql, params = []) => {
  const result = await pool.query(sql, params);
  return {
    rows: result.rows,
    rowCount: result.rowCount
  };
};

// Execute multiple SQL statements
const exec = async (sql) => {
  await pool.query(sql);
};

// Haversine distance calculation in kilometers
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

module.exports = {
  pool,
  query,
  get,
  run,
  exec,
  calculateDistance
};