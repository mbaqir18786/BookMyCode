const express = require('express');
const router = express.Router();
const { query, get, run, calculateDistance } = require('../db');

// GET /api/marketplace/machinery
// Query parameters: lat, lng, max_distance_km, machine_type, max_rate
router.get('/machinery', async (req, res) => {
  try {
    const { lat = 30.901, lng = 75.8573, max_distance_km = 50, machine_type, max_rate } = req.query;

    // Strict KYC gate requirement: ONLY return machines where seller's kyc_status IS 'approved'
    let sql = `
      SELECT m.*, s.business_name, s.phone as seller_phone, s.kyc_status
      FROM machines m
      JOIN sellers s ON m.seller_id = s.id
      WHERE s.kyc_status = 'approved' AND m.status = 'available'
    `;
    const params = [];

    if (machine_type && machine_type !== 'All') {
      sql += ` AND m.type = $${params.length + 1}`;
      params.push(machine_type);
    }

    if (max_rate) {
      sql += ` AND m.rate_per_acre <= $${params.length + 1}`;
      params.push(Number(max_rate));
    }

    sql += ` ORDER BY m.created_at DESC`;

    const rawMachines = await query(sql, params);

    // Calculate real distance for each machine
    const machinesWithDistance = rawMachines.map((m) => {
      const distance_km = calculateDistance(Number(lat), Number(lng), m.latitude, m.longitude);
      return { ...m, distance_km };
    }).filter((m) => m.distance_km <= Number(max_distance_km));

    // Sort by nearest distance
    machinesWithDistance.sort((a, b) => a.distance_km - b.distance_km);

    res.json(machinesWithDistance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/marketplace/machinery/:id
router.get('/machinery/:id', async (req, res) => {
  try {
    const machine = await get(
      `SELECT m.*, s.business_name, s.phone as seller_phone, s.kyc_status, s.address as seller_address
       FROM machines m
       JOIN sellers s ON m.seller_id = s.id
      WHERE m.id = $1 AND s.kyc_status = 'approved'`,
      [req.params.id]
    );

    if (!machine) {
      return res.status(404).json({ error: 'Machine not found or seller pending KYC approval' });
    }

    res.json(machine);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/marketplace/buyers
router.get('/buyers', async (req, res) => {
  try {
    const { lat = 30.901, lng = 75.8573, max_distance_km = 100, crop_type, min_price } = req.query;

    // Strict KYC gate requirement: ONLY return buyer listings where seller's kyc_status IS 'approved'
    let sql = `
      SELECT b.*, s.business_name, s.phone as seller_phone, s.kyc_status
      FROM buyer_listings b
      JOIN sellers s ON b.seller_id = s.id
      WHERE s.kyc_status = 'approved' AND b.status = 'active'
    `;
    const params = [];

    if (crop_type && crop_type !== 'All') {
      sql += ` AND b.crop_type = $${params.length + 1}`;
      params.push(crop_type);
    }

    if (min_price) {
      sql += ` AND b.price_per_ton >= $${params.length + 1}`;
      params.push(Number(min_price));
    }

    sql += ` ORDER BY b.price_per_ton DESC`;

    const rawBuyers = await query(sql, params);

    const buyersWithDistance = rawBuyers.map((b) => {
      const distance_km = calculateDistance(Number(lat), Number(lng), b.latitude, b.longitude);
      return { ...b, distance_km };
    }).filter((b) => b.distance_km <= Number(max_distance_km));

    buyersWithDistance.sort((a, b) => a.distance_km - b.distance_km);

    res.json(buyersWithDistance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/marketplace/buyers/:id
router.get('/buyers/:id', async (req, res) => {
  try {
    const buyer = await get(
      `SELECT b.*, s.business_name, s.phone as seller_phone, s.kyc_status, s.address as seller_address
       FROM buyer_listings b
       JOIN sellers s ON b.seller_id = s.id
      WHERE b.id = $1 AND s.kyc_status = 'approved'`,
      [req.params.id]
    );

    if (!buyer) {
      return res.status(404).json({ error: 'Buyer listing not found or seller pending KYC approval' });
    }

    res.json(buyer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/marketplace/bookings - Book machinery
router.post('/bookings', async (req, res) => {
  try {
    const { farmer_id = 'usr_farmer_1', farm_id, machine_id, booking_date, acres, total_price, notes } = req.body;
    if (!farm_id || !machine_id || !booking_date || !acres || !total_price) {
      return res.status(400).json({ error: 'Missing required booking details' });
    }

    const bookingId = 'book_' + Date.now();
    await run(
      `INSERT INTO bookings (id, farmer_id, farm_id, machine_id, booking_date, acres, total_price, status, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8)`,
      [bookingId, farmer_id, farm_id, machine_id, booking_date, Number(acres), Number(total_price), notes || '']
    );

    // Create a real notification for the seller & farmer
    const machine = await get('SELECT m.*, s.user_id as seller_user_id FROM machines m JOIN sellers s ON m.seller_id = s.id WHERE m.id = $1', [machine_id]);
    if (machine) {
      await run(
        `INSERT INTO notifications (id, user_id, title, message, type) VALUES ($1, $2, $3, $4, 'info')`,
        ['notif_' + Date.now(), machine.seller_user_id, 'New Machinery Booking Request', `Booking request received for ${machine.name} on ${booking_date} for ${acres} acres.`]
      );
    }

    const booking = await get('SELECT * FROM bookings WHERE id = $1', [bookingId]);
    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/marketplace/connection-requests - Connect with buyer
router.post('/connection-requests', async (req, res) => {
  try {
    const { farmer_id = 'usr_farmer_1', farm_id, buyer_listing_id, estimated_tons, offered_price_per_ton, total_estimated_value, notes } = req.body;
    if (!farm_id || !buyer_listing_id || !estimated_tons || !offered_price_per_ton) {
      return res.status(400).json({ error: 'Missing required connection request details' });
    }

    const requestId = 'conn_' + Date.now();
    await run(
      `INSERT INTO connection_requests (id, farmer_id, farm_id, buyer_listing_id, estimated_tons, offered_price_per_ton, total_estimated_value, status, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8)`,
      [requestId, farmer_id, farm_id, buyer_listing_id, Number(estimated_tons), Number(offered_price_per_ton), Number(total_estimated_value), notes || '']
    );

    // Create real notification
    const buyerListing = await get('SELECT b.*, s.user_id as seller_user_id FROM buyer_listings b JOIN sellers s ON b.seller_id = s.id WHERE b.id = $1', [buyer_listing_id]);
    if (buyerListing) {
      await run(
        `INSERT INTO notifications (id, user_id, title, message, type) VALUES ($1, $2, $3, $4, 'info')`,
        ['notif_' + Date.now(), buyerListing.seller_user_id, 'New Residue Purchase Offer', `A farmer offered ${estimated_tons} tons of residue at ₹${offered_price_per_ton}/ton.`]
      );
    }

    const connRequest = await get('SELECT * FROM connection_requests WHERE id = $1', [requestId]);
    res.status(201).json(connRequest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
