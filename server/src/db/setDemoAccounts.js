const { pool } = require('./index');
const bcrypt = require('bcryptjs');

async function fixDemoUsers() {
  try {
    const hash = await bcrypt.hash('admin123', 10);
    
    // Set all password hashes to admin123
    await pool.query('UPDATE users SET password_hash = $1', [hash]);
    
    // Ensure canonical usernames for all roles
    await pool.query("UPDATE users SET username = 'farmer' WHERE id = 'usr_farmer_1'");
    await pool.query("UPDATE users SET username = 'seller' WHERE id = 'usr_seller_1'");
    await pool.query("UPDATE users SET username = 'superadmin' WHERE id = 'usr_admin_1'");
    await pool.query("UPDATE users SET username = 'govadmin' WHERE id = 'usr_gov_1'");
    
    console.log('Successfully set demo usernames (farmer, seller, superadmin, govadmin) with password admin123');
    
    const users = await pool.query("SELECT id, username, phone, role FROM users WHERE username IN ('farmer', 'seller', 'superadmin', 'govadmin')");
    console.log('Demo accounts:', users.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

fixDemoUsers();
