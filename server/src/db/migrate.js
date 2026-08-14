const { exec } = require('./index');
const schemaSQL = require('./schema');

async function migrate() {
  try {
    console.log('Running database migrations...');
    await exec(schemaSQL);
    console.log('Database tables created successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  migrate();
}

module.exports = migrate;
