const express = require('express');
const router = express.Router();
const { query, get, calculateDistance } = require('../db');

// POST /api/chat - AI Chatbot assistant proxy with real DB context & sanity checking
router.post('/', async (req, res) => {
  try {
    const { message, farm_id = 'farm_1', user_id = 'usr_farmer_1' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    // 1. Sanity-checking rules for user inputs
    const acreageRegex = /(\d+)\s*(acre|acres|killa)/i;
    const matchAcreage = message.match(acreageRegex);
    let sanityWarning = null;

    if (matchAcreage) {
      const val = parseInt(matchAcreage[1], 10);
      if (val > 100) {
        sanityWarning = `⚠️ **Data Check Warning**: You mentioned ${val} acres. That seems extraordinarily large for a single plot! Please double-check if you typed an extra digit (e.g., 10 acres instead of 100).`;
      }
    }

    // 2. Fetch real farm details & real nearby listings
    const farm = await get('SELECT * FROM farms WHERE id = $1', [farm_id]);
    let responseText = '';

    if (farm) {
      const rawMachines = await query(
        `SELECT m.*, s.business_name FROM machines m JOIN sellers s ON m.seller_id = s.id WHERE s.kyc_status = 'approved'`
      );
      const nearbyMachines = rawMachines.map((m) => ({
        ...m,
        distance_km: calculateDistance(farm.latitude, farm.longitude, m.latitude, m.longitude)
      })).filter((m) => m.distance_km <= 50);

      const rawBuyers = await query(
        `SELECT b.*, s.business_name FROM buyer_listings b JOIN sellers s ON b.seller_id = s.id WHERE s.kyc_status = 'approved'`
      );
      const nearbyBuyers = rawBuyers.map((b) => ({
        ...b,
        distance_km: calculateDistance(farm.latitude, farm.longitude, b.latitude, b.longitude)
      })).filter((b) => b.distance_km <= 80);

      const lowerMsg = message.toLowerCase();

      if (lowerMsg.includes('buyer') || lowerMsg.includes('sell') || lowerMsg.includes('price')) {
        if (nearbyBuyers.length > 0) {
          const top = nearbyBuyers[0];
          responseText = `Based on your farm **${farm.name}** (${farm.area_acres} acres), we found **${nearbyBuyers.length} verified residue buyers** nearby. Top buyer **${top.business_name}** offers **₹${top.price_per_ton}/ton** for ${top.buying_purpose} located ${top.distance_km} km away. Estimated earnings for your plot: ~₹${Math.round(farm.area_acres * 1.8 * top.price_per_ton).toLocaleString('en-IN')}.`;
        } else {
          responseText = `Currently, there are no approved residue buyers listed within 80 km of **${farm.name}**. You can check the machinery section or alert your District Agriculture Officer via the platform.`;
        }
      } else if (lowerMsg.includes('machine') || lowerMsg.includes('seeder') || lowerMsg.includes('rent') || lowerMsg.includes('happy') || lowerMsg.includes('super')) {
        if (nearbyMachines.length > 0) {
          const top = nearbyMachines[0];
          responseText = `For your ${farm.area_acres}-acre field (**${farm.name}**), we have **${nearbyMachines.length} verified machines** nearby. Recommended: **${top.name}** from ${top.business_name} at **₹${top.rate_per_acre}/acre** (${top.distance_km} km away). Total estimated cost: ₹${Math.round(farm.area_acres * top.rate_per_acre).toLocaleString('en-IN')}.`;
        } else {
          responseText = `No approved machinery providers are currently available near **${farm.name}**. Your area has been flagged for government mobile custom hiring center dispatch.`;
        }
      } else {
        responseText = `Sat Sri Akal! I am your Crop Residue Advisor. For your registered field **${farm.name}** (${farm.area_acres} acres in ${farm.address}), you have **${nearbyMachines.length} machinery providers** and **${nearbyBuyers.length} biomass buyers** nearby. Your harvest is scheduled for ${farm.harvest_date} with a next sowing deadline of ${farm.next_sowing_date}. Ask me about selling your stubble or hiring seeders!`;
      }
    } else {
      responseText = `Sat Sri Akal! Welcome to the Crop Residue Management Platform. Please register your farm details first under '/farmer/farms' so I can provide personalized machinery and buyer recommendations for your exact location!`;
    }

    if (sanityWarning) {
      responseText = `${sanityWarning}\n\n${responseText}`;
    }

    res.json({
      reply: responseText,
      sanity_warning: sanityWarning
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
