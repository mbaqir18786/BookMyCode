const express = require('express');
const router = express.Router();
const { get, query, calculateDistance } = require('../db');

// Helper to compute recommendation object
async function computeRecommendationForFarm(farmId) {
  const farm = await get('SELECT * FROM farms WHERE id = $1', [farmId]);
  if (!farm) return null;

  const harvestDate = new Date(farm.harvest_date);
  const sowingDate = new Date(farm.next_sowing_date);
  const daysAvailable = Math.max(1, Math.ceil((sowingDate - harvestDate) / (1000 * 60 * 60 * 24)));

  const rawMachines = await query(
    `SELECT m.*, s.business_name FROM machines m JOIN sellers s ON m.seller_id = s.id WHERE s.kyc_status = 'approved' AND m.status = 'available'`
  );
  const machinesNearby = rawMachines.map((m) => ({
    ...m,
    distance_km: calculateDistance(farm.latitude, farm.longitude, m.latitude, m.longitude),
    total_cost: Math.round(farm.area_acres * m.rate_per_acre)
  })).filter((m) => m.distance_km <= 50).sort((a, b) => a.total_cost - b.total_cost);

  const rawBuyers = await query(
    `SELECT b.*, s.business_name FROM buyer_listings b JOIN sellers s ON b.seller_id = s.id WHERE s.kyc_status = 'approved' AND b.status = 'active'`
  );
  const estimated_tons = Math.round(farm.area_acres * 1.8 * 10) / 10;
  const buyersNearby = rawBuyers.map((b) => ({
    ...b,
    distance_km: calculateDistance(farm.latitude, farm.longitude, b.latitude, b.longitude),
    gross_revenue: Math.round(estimated_tons * b.price_per_ton)
  })).filter((b) => b.distance_km <= 80).sort((a, b) => b.gross_revenue - a.gross_revenue);

  const bestMachine = machinesNearby[0] || null;
  const bestBuyer = buyersNearby[0] || null;

  return { farm, daysAvailable, bestMachine, bestBuyer, estimated_tons };
}

// POST /api/v1/ivr/recommend - IVR Phone Call simulator endpoint
router.post('/ivr/recommend', async (req, res) => {
  try {
    const { farm_id = 'farm_1', phone = '+919876543210' } = req.body;
    const rec = await computeRecommendationForFarm(farm_id);

    if (!rec) {
      return res.json({
        voice_script: "Sat Sri Akal. We could not locate your farm records. Please call back after registering your land on the crop portal.",
        call_status: "completed"
      });
    }

    let voiceScript = '';
    if (rec.bestBuyer) {
      voiceScript = `Sat Sri Akal ${rec.farm.name} farmer. We recommend selling your paddy residue instead of burning. ${rec.bestBuyer.business_name} located ${rec.bestBuyer.distance_km} kilometers away will buy your ${rec.estimated_tons} tons of stubble for ${rec.bestBuyer.gross_revenue} rupees. Press 1 to confirm connection with the buyer. Press 2 to listen to machinery options.`;
    } else if (rec.bestMachine) {
      voiceScript = `Sat Sri Akal. For your ${rec.farm.area_acres} acre field, we recommend hiring ${rec.bestMachine.name} from ${rec.bestMachine.business_name} at ${rec.bestMachine.rate_per_acre} rupees per acre. Total cost is ${rec.bestMachine.total_cost} rupees. Press 1 to book this machine now.`;
    } else {
      voiceScript = `Sat Sri Akal. No private machinery or buyers are currently available within range of your farm. Your location has been sent to the District Agriculture Officer for custom hiring center priority dispatch.`;
    }

    res.json({
      phone,
      farm_name: rec.farm.name,
      voice_script: voiceScript,
      options: {
        buyer: rec.bestBuyer,
        machine: rec.bestMachine
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/whatsapp/webhook - WhatsApp message simulator endpoint
router.post('/whatsapp/webhook', async (req, res) => {
  try {
    const { farm_id = 'farm_1', message = 'RECOMMEND' } = req.body;
    const rec = await computeRecommendationForFarm(farm_id);

    if (!rec) {
      return res.json({
        whatsapp_response: "❌ No farm record found for this mobile number."
      });
    }

    let response = '';
    if (rec.bestBuyer) {
      response = `🌾 *Crop Residue Recommendation for ${rec.farm.name}*\n\n` +
        `💡 *Best Option: SELL RESIDUE (Earn Money!)*\n` +
        `• Buyer: *${rec.bestBuyer.business_name}* (${rec.bestBuyer.distance_km} km away)\n` +
        `• Offered Price: *₹${rec.bestBuyer.price_per_ton}/ton*\n` +
        `• Estimated Income: *+₹${rec.bestBuyer.gross_revenue.toLocaleString('en-IN')}*\n` +
        `• Time Window: ${rec.daysAvailable} days before sowing\n\n` +
        `Reply *1* to send connection request or *2* to see machinery rentals.`;
    } else if (rec.bestMachine) {
      response = `🌾 *Crop Residue Recommendation for ${rec.farm.name}*\n\n` +
        `🚜 *Best Option: HIRE MACHINERY*\n` +
        `• Machine: *${rec.bestMachine.name}*\n` +
        `• Provider: *${rec.bestMachine.business_name}* (${rec.bestMachine.distance_km} km away)\n` +
        `• Rate: *₹${rec.bestMachine.rate_per_acre}/acre*\n` +
        `• Total Cost: *₹${rec.bestMachine.total_cost.toLocaleString('en-IN')}*\n\n` +
        `Reply *BOOK* to confirm reservation.`;
    } else {
      response = `🌾 *Crop Residue Alert for ${rec.farm.name}*\n\n` +
        `⚠️ No active buyers or machinery providers currently within 50 km.\n` +
        `📢 Government alert dispatched to Ludhiana District Agriculture Office for emergency machinery allocation.`;
    }

    res.json({
      whatsapp_response: response,
      farm_id: rec.farm.id
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
