const express = require('express');
const router = express.Router();
const { query, get, run, calculateDistance } = require('../db');

// GET /api/incidents - List satellite fire hotspots
router.get('/', async (req, res) => {
  try {
    const district = req.query.district || 'Ludhiana';
    const status = req.query.status;

    let sql = `
      SELECT i.*, f.name as farm_name, u.name as farmer_name, u.phone as farmer_phone
      FROM incidents i
      LEFT JOIN farms f ON i.farm_id = f.id
      LEFT JOIN users u ON f.user_id = u.id
      WHERE i.district = ?
    `;
    const params = [district];

    if (status && status !== 'All') {
      sql += ` AND i.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY i.detected_at DESC`;

    const incidents = await query(sql, params);
    res.json(incidents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/incidents/:id - Get incident context
router.get('/:id', async (req, res) => {
  try {
    const incident = await get(
      `SELECT i.*, f.name as farm_name, f.area_acres, f.crop_type, f.harvest_date, f.next_sowing_date, u.name as farmer_name, u.phone as farmer_phone, u.district as farmer_district
       FROM incidents i
       LEFT JOIN farms f ON i.farm_id = f.id
       LEFT JOIN users u ON f.user_id = u.id
       WHERE i.id = ?`,
      [req.params.id]
    );

    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    // Fetch nearby available machinery & buyers at incident coordinates to analyze resource availability
    const rawMachines = await query(
      `SELECT m.*, s.business_name, s.phone as seller_phone
       FROM machines m
       JOIN sellers s ON m.seller_id = s.id
       WHERE s.kyc_status = 'approved'`
    );

    const nearbyMachines = rawMachines.map((m) => ({
      ...m,
      distance_km: calculateDistance(incident.latitude, incident.longitude, m.latitude, m.longitude)
    })).filter((m) => m.distance_km <= 30);

    const rawBuyers = await query(
      `SELECT b.*, s.business_name, s.phone as seller_phone
       FROM buyer_listings b
       JOIN sellers s ON b.seller_id = s.id
       WHERE s.kyc_status = 'approved'`
    );

    const nearbyBuyers = rawBuyers.map((b) => ({
      ...b,
      distance_km: calculateDistance(incident.latitude, incident.longitude, b.latitude, b.longitude)
    })).filter((b) => b.distance_km <= 50);

    // Fetch past incident history at this farm or location
    const history = await query(
      `SELECT * FROM incidents WHERE (farm_id = ? OR (ABS(latitude - ?) < 0.05 AND ABS(longitude - ?) < 0.05)) AND id != ? ORDER BY detected_at DESC`,
      [incident.farm_id || '', incident.latitude, incident.longitude, incident.id]
    );

    res.json({
      incident,
      history,
      nearby_machinery: nearbyMachines,
      nearby_buyers: nearbyBuyers
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/incidents/:id/action - Officer log action
router.post('/:id/action', async (req, res) => {
  try {
    const { action_type, officer_notes, status = 'action_taken', admin_id = 'usr_gov_1' } = req.body;
    const incidentId = req.params.id;

    const incident = await get('SELECT * FROM incidents WHERE id = ?', [incidentId]);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    const formattedAction = `[${new Date().toISOString().slice(0, 10)}] ${action_type}: ${officer_notes}`;

    await run(
      `UPDATE incidents SET status = ?, officer_action = ?, officer_notes = ?, resolved_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [status, formattedAction, officer_notes, incidentId]
    );

    // Log to audit table
    await run(
      `INSERT INTO audit_logs (id, admin_id, action, target_type, target_id, details) VALUES (?, ?, ?, 'incident', ?, ?)`,
      ['audit_' + Date.now(), admin_id, action_type, incidentId, officer_notes]
    );

    const updatedIncident = await get('SELECT * FROM incidents WHERE id = ?', [incidentId]);
    res.json(updatedIncident);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
