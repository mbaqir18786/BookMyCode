// server/src/routes/buyers.js
const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();
const { query, get, run } = require('../db');

// POST /api/buyers/kyc - Submit KYC documentation for a buyer
router.post('/kyc', async (req, res) => {
  try {
    const {
      user_id,
      buyer_type,
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
      kyc_documents
    } = req.body;

    // Insert or update buyer record
    let buyer = await get('SELECT * FROM buyers WHERE user_id = $1', [user_id]);
    if (buyer) {
      await run(
        `UPDATE buyers SET
          buyer_type = $1,
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
          kyc_status = 'pending'
        WHERE id = $13`,
        [
          buyer_type || 'biofuel_buyer',
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
          buyer.id
        ]
      );
    } else {
      const buyerId = 'buyer_' + Date.now();
      await run(
        `INSERT INTO buyers (id, user_id, buyer_type, business_name, phone, address, aadhar_no, pan_no, gst_no, udyam_no, aadhar_doc_url, pan_doc_url, gst_doc_url, udyam_doc_url, kyc_status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'pending')`,
        [
          buyerId,
          user_id,
          buyer_type || 'biofuel_buyer',
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
          udyam_doc_url || null
        ]
      );
    }

    // ── AI Verification via KYB FastAPI Service ─────────────────────────────────
    try {
      console.log('[KYC] Calling KYB verify service for buyer', user_id);
      const kybRes = await fetch('http://localhost:8001/verify-kyc-numbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_name, seller_type: buyer_type, aadhar_no, pan_no, gst_no, udyam_no, address })
      });

      if (kybRes.ok) {
        const kybData = await kybRes.json();
        const newStatus = kybData.verdict === 'APPROVED' ? 'approved' : 'rejected';

        await run(
          `UPDATE buyers SET kyc_ai_result = $1, kyc_status = $2 WHERE user_id = $3`,
          [JSON.stringify(kybData), newStatus, user_id]
        );
        await run(`UPDATE users SET kyc_status = $1 WHERE id = $2`, [newStatus, user_id]);

        console.log(`[KYC] KYB buyer verdict for ${user_id}: ${kybData.verdict} — ${kybData.reason}`);
      } else {
        console.error('[KYC] KYB service error for buyer:', kybRes.status);
      }
    } catch (aiErr) {
      console.error('[KYC] KYB service unreachable for buyer, keeping pending:', aiErr.message);
    }
    // ───────────────────────────────────────────────────────────────────────────

    const finalBuyer = await get('SELECT * FROM buyers WHERE user_id = $1', [user_id]);
    res.json({ message: 'Buyer KYC submitted. AI verification complete.', buyer: finalBuyer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

