const { exec, pool } = require('./index');
const schemaSQL = require('./schema');

async function migrate() {
  try {
    console.log('Running PostgreSQL database migrations...');

    await exec(schemaSQL);

    console.log('PostgreSQL database tables created successfully.');
  } catch (err) {
    console.error('PostgreSQL migration failed:', err.message);
    throw err;
  }
}

if (require.main === module) {
  migrate()
    .then(() => pool.end())
    .catch(async () => {
      await pool.end();
      process.exitCode = 1;
    });
}

module.exports = migrate;