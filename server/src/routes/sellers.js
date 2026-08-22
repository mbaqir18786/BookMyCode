const express = require('express');
const router = express.Router();
const { query, get, run } = require('../db');

// GET /api/sellers/profile?user_id=usr_seller_1
router.get('/profile', async (req, res) => {
  try {
    const userId = req.query.user_id || 'usr_seller_1';
    let seller = await get('SELECT * FROM sellers WHERE user_id = $1', [userId]);
    if (!seller) {
      // Return a basic profile default
      const user = await get('SELECT * FROM users WHERE id = $1', [userId]);
      return res.json({
        user_id: userId,
        business_name: user ? user.name : 'Agro Business',
        seller_type: 'machinery_provider',
        phone: user ? user.phone : '',
        address: 'Ludhiana, Punjab',
        kyc_status: 'pending'
      });
    }
    res.json(seller);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sellers/kyc - Submit KYC documentation (Aadhaar, PAN, GST, Udyam)
router.post('/kyc', async (req, res) => {
  try {
    const {
      user_id,
      seller_type,
      business_name,
      phone,
      address,
      aadhar_no,
      pan_no,
      gst_no,
      udyam_no,
      aadhar_doc_url,
      pan_doc_url,
      gst_doc_url,
      udyam_doc_url,
      kyc_docs_url
    } = req.body;

    let seller = await get('SELECT * FROM sellers WHERE user_id = $1', [user_id]);

    if (seller) {
      await run(
        `UPDATE sellers 
         SET seller_type = $1, 
             business_name = $2, 
             phone = $3, 
             address = $4, 
             aadhar_no = $5, 
             pan_no = $6, 
             gst_no = $7, 
             udyam_no = $8, 
             aadhar_doc_url = $9, 
             pan_doc_url = $10, 
             gst_doc_url = $11, 
             udyam_doc_url = $12, 
             kyc_docs_url = $13, 
             kyc_status = 'pending' 
         WHERE id = $14`,
        [
          seller_type || 'machinery_provider',
          business_name,
          phone,
          address,
          aadhar_no || null,
          pan_no ? pan_no.toUpperCase() : null,
          gst_no ? gst_no.toUpperCase() : null,
          udyam_no ? udyam_no.toUpperCase() : null,
          aadhar_doc_url || null,
          pan_doc_url || null,
          gst_doc_url || null,
          udyam_doc_url || null,
          kyc_docs_url || aadhar_doc_url || pan_doc_url || gst_doc_url || udyam_doc_url,
          seller.id
        ]
      );
    } else {
      const sellerId = 'seller_' + Date.now();
      await run(
        `INSERT INTO sellers (
          id, user_id, seller_type, business_name, phone, address, 
          aadhar_no, pan_no, gst_no, udyam_no, 
          aadhar_doc_url, pan_doc_url, gst_doc_url, udyam_doc_url, 
          kyc_status, kyc_docs_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'pending', $15)`,
        [
          sellerId,
          user_id,
          seller_type || 'machinery_provider',
          business_name,
          phone,
          address,
          aadhar_no || null,
          pan_no ? pan_no.toUpperCase() : null,
          gst_no ? gst_no.toUpperCase() : null,
          udyam_no ? udyam_no.toUpperCase() : null,
          aadhar_doc_url || null,
          pan_doc_url || null,
          gst_doc_url || null,
          udyam_doc_url || null,
          kyc_docs_url || aadhar_doc_url || pan_doc_url || gst_doc_url || udyam_doc_url
        ]
      );
    }

    // Also update user kyc_status
    await run("UPDATE users SET kyc_status = 'pending' WHERE id = $1", [user_id]);

    const updatedSeller = await get('SELECT * FROM sellers WHERE user_id = $1', [user_id]);
    res.json({ message: 'KYC documents submitted successfully and awaiting Super Admin verification.', seller: updatedSeller });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sellers/my-listings?seller_id=seller_1
router.get('/my-listings', async (req, res) => {
  try {
    const sellerId = req.query.seller_id || 'seller_1';
    const machines = await query('SELECT * FROM machines WHERE seller_id = $1 ORDER BY created_at DESC', [sellerId]);
    const buyerListings = await query('SELECT * FROM buyer_listings WHERE seller_id = $1 ORDER BY created_at DESC', [sellerId]);

    // Also fetch bookings / connection requests received by this seller
    const bookings = await query(
      `SELECT b.*, f.name as farm_name, u.name as farmer_name, u.phone as farmer_phone, m.name as machine_name
       FROM bookings b
       JOIN machines m ON b.machine_id = m.id
       JOIN farms f ON b.farm_id = f.id
       JOIN users u ON b.farmer_id = u.id
      WHERE m.seller_id = $1 ORDER BY b.created_at DESC`,
      [sellerId]
    );

    const connectionRequests = await query(
      `SELECT cr.*, f.name as farm_name, u.name as farmer_name, u.phone as farmer_phone, bl.buying_purpose
       FROM connection_requests cr
       JOIN buyer_listings bl ON cr.buyer_listing_id = bl.id
       JOIN farms f ON cr.farm_id = f.id
       JOIN users u ON cr.farmer_id = u.id
      WHERE bl.seller_id = $1 ORDER BY cr.created_at DESC`,
      [sellerId]
    );

    res.json({ machines, buyerListings, bookings, connectionRequests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sellers/machines - Add a machinery listing
router.post('/machines', async (req, res) => {
  try {
    const { seller_id, name, type, rate_per_acre, max_capacity_acres_per_day, latitude, longitude, address } = req.body;
    const machId = 'mach_' + Date.now();
    await run(
      `INSERT INTO machines (id, seller_id, name, type, rate_per_acre, max_capacity_acres_per_day, latitude, longitude, address, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'available')`,
      [machId, seller_id, name, type, Number(rate_per_acre), Number(max_capacity_acres_per_day || 10), Number(latitude), Number(longitude), address]
    );

    const machine = await get('SELECT * FROM machines WHERE id = $1', [machId]);
    res.status(201).json(machine);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sellers/buyer-listings - Add a buyer listing
router.post('/buyer-listings', async (req, res) => {
  try {
    const { seller_id, crop_type, buying_purpose, price_per_ton, required_tons, min_quality, latitude, longitude, address } = req.body;
    const listingId = 'buyer_list_' + Date.now();
    await run(
      `INSERT INTO buyer_listings (id, seller_id, crop_type, buying_purpose, price_per_ton, required_tons, min_quality, latitude, longitude, address, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active')`,
      [listingId, seller_id, crop_type || 'Paddy Straw', buying_purpose, Number(price_per_ton), Number(required_tons), min_quality || 'Standard Dry', Number(latitude), Number(longitude), address]
    );

    const listing = await get('SELECT * FROM buyer_listings WHERE id = $1', [listingId]);
    res.status(201).json(listing);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
