const express = require('express');
const router = express.Router();
const { query, get, run } = require('../db');

// GET /api/farms - Get farms (scoped by farmer user_id)
router.get('/', async (req, res) => {
  try {
    const userId = req.query.user_id || 'usr_farmer_1';
    const farms = await query('SELECT * FROM farms WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    res.json(farms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/farms/:id - Get single farm detail
router.get('/:id', async (req, res) => {
  try {
    const farm = await get('SELECT * FROM farms WHERE id = $1', [req.params.id]);
    if (!farm) return res.status(404).json({ error: 'Farm not found' });
    res.json(farm);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/farms - Create a new farm
router.post('/', async (req, res) => {
  try {
    const {
      user_id = 'usr_farmer_1',
      name,
      crop_type = 'Paddy (Rice)',
      area_acres,
      latitude,
      longitude,
      address,
      harvest_date,
      next_sowing_date,
      budget_amount
    } = req.body;

    if (!name || !area_acres || !latitude || !longitude || !address || !harvest_date || !next_sowing_date) {
      return res.status(400).json({ error: 'Missing required farm fields' });
    }

    const farmId = 'farm_' + Date.now();
    await run(
      `INSERT INTO farms (id, user_id, name, crop_type, area_acres, latitude, longitude, address, harvest_date, next_sowing_date, budget_amount)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [farmId, user_id, name, crop_type, Number(area_acres), Number(latitude), Number(longitude), address, harvest_date, next_sowing_date, Number(budget_amount || 0)]
    );

    const createdFarm = await get('SELECT * FROM farms WHERE id = $1', [farmId]);
    res.status(201).json(createdFarm);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/farms/:id - Edit an existing farm
router.put('/:id', async (req, res) => {
  try {
    const {
      name,
      crop_type,
      area_acres,
      latitude,
      longitude,
      address,
      harvest_date,
      next_sowing_date,
      budget_amount
    } = req.body;

    const farm = await get('SELECT * FROM farms WHERE id = $1', [req.params.id]);
    if (!farm) return res.status(404).json({ error: 'Farm not found' });

    await run(
      `UPDATE farms SET
        name = COALESCE($1, name),
        crop_type = COALESCE($2, crop_type),
        area_acres = COALESCE($3, area_acres),
        latitude = COALESCE($4, latitude),
        longitude = COALESCE($5, longitude),
        address = COALESCE($6, address),
        harvest_date = COALESCE($7, harvest_date),
        next_sowing_date = COALESCE($8, next_sowing_date),
        budget_amount = COALESCE($9, budget_amount)
             WHERE id = $10`,
      [name, crop_type, area_acres, latitude, longitude, address, harvest_date, next_sowing_date, budget_amount, req.params.id]
    );

    const updatedFarm = await get('SELECT * FROM farms WHERE id = $1', [req.params.id]);
    res.json(updatedFarm);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/farms/:id - Delete a farm
router.delete('/:id', async (req, res) => {
  try {
    const result = await run('DELETE FROM farms WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Farm not found' });
    res.json({ message: 'Farm deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
