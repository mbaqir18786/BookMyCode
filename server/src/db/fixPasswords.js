const { pool } = require('./index');
const bcrypt = require('bcryptjs');

async function fixPasswords() {
  try {
    const hash = await bcrypt.hash('admin123', 10);
    const result = await pool.query('UPDATE users SET password_hash = $1', [hash]);
    console.log(`Updated passwords for ${result.rowCount} users to admin123`);
  } catch (err) {
    console.error('Error updating passwords:', err);
  } finally {
    await pool.end();
  }
}

fixPasswords();
