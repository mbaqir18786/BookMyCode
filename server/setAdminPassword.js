const bcrypt = require('bcryptjs');
const { query } = require('./src/db/postgres');

async function setAdminCredentials() {
  const hash = await bcrypt.hash('admin123', 12);
  
  // Super Admin
  await query(
    'UPDATE users SET username = $1, password_hash = $2 WHERE id = $3',
    ['superadmin', hash, 'usr_admin_1']
  );
  
  // Government Admin
  await query(
    'UPDATE users SET username = $1, password_hash = $2 WHERE id = $3',
    ['govadmin', hash, 'usr_gov_1']
  );

  console.log('✅ Admin accounts updated:');
  console.log('1. Super Admin -> Username: superadmin, Password: admin123');
  console.log('2. Govt Admin  -> Username: govadmin, Password: admin123');
  process.exit(0);
}

setAdminCredentials().catch(err => {
  console.error(err);
  process.exit(1);
});
