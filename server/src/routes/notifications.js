const express = require('express');
const router = express.Router();
const { query, run, get } = require('../db');

// GET /api/notifications?user_id=usr_farmer_1
router.get('/', async (req, res) => {
  try {
    const userId = req.query.user_id || 'usr_farmer_1';
    const notifications = await query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30',
      [userId]
    );
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', async (req, res) => {
  try {
    await run('UPDATE notifications SET is_read = 1 WHERE id = $1', [req.params.id]);
    const updated = await get('SELECT * FROM notifications WHERE id = $1', [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
