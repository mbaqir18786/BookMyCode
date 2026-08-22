const fs = require('fs/promises');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { pool } = require('./postgres');

async function migratePostgres() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required to run the PostgreSQL authentication migration.');
  }

  const migrationPath = path.join(__dirname, 'migrations', '001_authentication.sql');
  const migration = await fs.readFile(migrationPath, 'utf8');

  try {
    await pool.query(migration);
    console.log('PostgreSQL authentication schema is ready.');
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  migratePostgres().catch((error) => {
    console.error('PostgreSQL authentication migration failed:', error.message);
    process.exitCode = 1;
  });
}

module.exports = migratePostgres;