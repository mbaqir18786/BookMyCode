const bcrypt = require('bcryptjs');
const { pool } = require('./index');

async function resetPasswords() {
  const hash = await bcrypt.hash('admin123', 10);
  const result = await pool.query('UPDATE users SET password_hash = $1', [hash]);
  console.log(`Reset passwords for ${result.rowCount} users to: admin123`);
  
  // Verify it works
  const user = await pool.query("SELECT username, password_hash FROM users WHERE username = 'superadmin' LIMIT 1");
  const check = await bcrypt.compare('admin123', user.rows[0].password_hash);
  console.log('Verification (superadmin / admin123):', check ? '✅ PASS' : '❌ FAIL');
  
  await pool.end();
}

resetPasswords().catch(console.error);
