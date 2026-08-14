const express = require('express');
const router = express.Router();
const { query, get, run } = require('../db');

// GET /api/superadmin/kyc-queue
router.get('/kyc-queue', async (req, res) => {
  try {
    const sellers = await query(
      `SELECT s.*, u.name as owner_name, u.email as owner_email, u.phone as owner_phone
       FROM sellers s
       JOIN users u ON s.user_id = u.id
       ORDER BY s.created_at DESC`
    );
    res.json(sellers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/superadmin/kyc/:seller_id/approve
router.post('/kyc/:seller_id/approve', async (req, res) => {
  try {
    const { seller_id } = req.params;
    const { admin_id = 'usr_admin_1', notes = 'Documents verified' } = req.body;

    const seller = await get('SELECT * FROM sellers WHERE id = ?', [seller_id]);
    if (!seller) return res.status(404).json({ error: 'Seller not found' });

    // Update DB
    await run(`UPDATE sellers SET kyc_status = 'approved' WHERE id = ?`, [seller_id]);
    await run(`UPDATE users SET kyc_status = 'approved' WHERE id = ?`, [seller.user_id]);

    // Audit Log
    await run(
      `INSERT INTO audit_logs (id, admin_id, action, target_type, target_id, details) VALUES (?, ?, 'kyc_approval', 'seller', ?, ?)`,
      ['audit_' + Date.now(), admin_id, seller_id, `Approved KYC for ${seller.business_name}: ${notes}`]
    );

    // Notification for Seller
    await run(
      `INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, 'success')`,
      ['notif_' + Date.now(), seller.user_id, 'KYC Approved!', `Congratulations! ${seller.business_name} has been verified. Your listings are now live in the marketplace.`]
    );

    const updatedSeller = await get('SELECT * FROM sellers WHERE id = ?', [seller_id]);
    res.json({ message: 'Seller KYC approved successfully', seller: updatedSeller });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/superadmin/kyc/:seller_id/reject
router.post('/kyc/:seller_id/reject', async (req, res) => {
  try {
    const { seller_id } = req.params;
    const { admin_id = 'usr_admin_1', reason = 'Incomplete verification documents' } = req.body;

    const seller = await get('SELECT * FROM sellers WHERE id = ?', [seller_id]);
    if (!seller) return res.status(404).json({ error: 'Seller not found' });

    await run(`UPDATE sellers SET kyc_status = 'rejected' WHERE id = ?`, [seller_id]);
    await run(`UPDATE users SET kyc_status = 'rejected' WHERE id = ?`, [seller.user_id]);

    await run(
      `INSERT INTO audit_logs (id, admin_id, action, target_type, target_id, details) VALUES (?, ?, 'kyc_rejection', 'seller', ?, ?)`,
      ['audit_' + Date.now(), admin_id, seller_id, `Rejected KYC for ${seller.business_name}. Reason: ${reason}`]
    );

    await run(
      `INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, 'error')`,
      ['notif_' + Date.now(), seller.user_id, 'KYC Verification Update', `Your KYC application for ${seller.business_name} was rejected. Reason: ${reason}`]
    );

    const updatedSeller = await get('SELECT * FROM sellers WHERE id = ?', [seller_id]);
    res.json({ message: 'Seller KYC rejected', seller: updatedSeller });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/superadmin/audit-logs
router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50');
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
