const express = require('express');
const router = express.Router();
const { get, query, run, calculateDistance } = require('../db');

// Helper: compute nearby best machine / buyer (lightweight copy of channels logic)
async function computeRecommendationForFarm(farmId) {
  const farm = await get('SELECT * FROM farms WHERE id = ?', [farmId]);
  if (!farm) return null;

  const rawMachines = await query(
    `SELECT m.*, s.business_name, s.phone as seller_phone FROM machines m JOIN sellers s ON m.seller_id = s.id WHERE s.kyc_status = 'approved' AND m.status = 'available'`
  );
  const machinesNearby = rawMachines.map((m) => ({
    ...m,
    distance_km: calculateDistance(farm.latitude, farm.longitude, m.latitude, m.longitude),
    total_cost: Math.round(farm.area_acres * m.rate_per_acre)
  })).filter((m) => m.distance_km <= 50).sort((a, b) => a.total_cost - b.total_cost);

  const rawBuyers = await query(
    `SELECT b.*, s.business_name, s.phone as seller_phone FROM buyer_listings b JOIN sellers s ON b.seller_id = s.id WHERE s.kyc_status = 'approved' AND b.status = 'active'`
  );
  const estimated_tons = Math.round(farm.area_acres * 1.8 * 10) / 10;
  const buyersNearby = rawBuyers.map((b) => ({
    ...b,
    distance_km: calculateDistance(farm.latitude, farm.longitude, b.latitude, b.longitude),
    gross_revenue: Math.round(estimated_tons * b.price_per_ton)
  })).filter((b) => b.distance_km <= 80).sort((a, b) => b.gross_revenue - a.gross_revenue);

  return { farm, estimated_tons, bestMachine: machinesNearby[0] || null, bestBuyer: buyersNearby[0] || null };
}

// Basic XML helpers
function say(text) {
  return `<Say voice=\"alice\">${escapeXml(text)}</Say>`;
}

function gather(actionPath, numDigits = 1, prompt) {
  return `<Gather action=\"${actionPath}\" method=\"POST\" numDigits=\"${numDigits}\">${say(prompt)}</Gather>`;
}

function xmlResponse(body) {
  return `<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<Response>\n${body}\n</Response>`;
}

function escapeXml(unsafe) {
  return String(unsafe).replace(/[<>&'\"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

// Verify webhook secret if configured
function verifySecret(req) {
  const secret = process.env.EXOTEL_WEBHOOK_SECRET;
  if (!secret) return true; // not enforced
  const token = req.headers['x-exotel-token'] || req.query.token || req.body.token;
  return token === secret;
}

// POST /api/v1/ivr/exotel - Exotel webhook endpoint
router.post('/exotel', async (req, res) => {
  try {
    if (!verifySecret(req)) {
      return res.status(403).json({ error: 'Invalid webhook token' });
    }

    const callSid = req.body.CallSid || req.body.CallUUID || req.body.CallSid || '';
    const from = req.body.From || req.body.from || req.body.Caller || '';
    const to = req.body.To || req.body.to || '';
    const digits = req.body.Digits || req.body.digits || '';
    const callStatus = req.body.CallStatus || req.body.call_status || '';

    // Find or create call log
    let callLog = null;
    if (callSid) {
      callLog = await get('SELECT * FROM call_logs WHERE call_sid = ?', [callSid]);
    }

    if (!callLog) {
      const callId = 'call_' + Date.now();
      await run(
        `INSERT INTO call_logs (id, call_sid, from_number, to_number, current_step, last_digits, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [callId, callSid || '', from || '', to || '', 'started', '', JSON.stringify({})]
      );
      callLog = await get('SELECT * FROM call_logs WHERE id = ?', [callId]);
    }

    // If no digits provided, show main menu
    if (!digits) {
      const lang = req.query.lang || 'en';
      const prompt = lang === 'hi' ? 'नमस्ते। मेनू के लिए 1 दबाएँ मशीन के लिए, 2 दबाएँ खरीदार के लिए, 3 मार्गदर्शन, 4 सेवा के लिए, 5 सहायता के लिए।' : 'Welcome to Crop Residue Helpline. For machinery press 1, for buyers press 2, for guidance press 3, to request a service press 4, for support press 5.';
      const body = gather('/api/v1/ivr/exotel', 1, prompt) + say('No input received. Goodbye.');
      res.set('Content-Type', 'application/xml');
      return res.send(xmlResponse(body));
    }

    // Update call log with latest digits (do not overwrite current_step)
    await run('UPDATE call_logs SET last_digits = ? WHERE id = ?', [digits, callLog.id]);

    // Map caller to user if possible (match last 10 digits)
    const normalized = (from || '').replace(/\D/g, '');
    const last10 = normalized.slice(-10);
    let user = null;
    if (last10.length >= 6) {
      user = await get('SELECT * FROM users WHERE phone LIKE ?', ['%' + last10]);
    }

    // Default farm fallback
    let farmId = 'farm_1';
    if (user) {
      const userFarms = await query('SELECT * FROM farms WHERE user_id = ? ORDER BY created_at ASC', [user.id]);
      if (userFarms && userFarms.length > 0) farmId = userFarms[0].id;
    }

    // Fetch fresh log to inspect current_step (confirmation states)
    const freshLog = await get('SELECT * FROM call_logs WHERE id = ?', [callLog.id]);
    let metadata = {};
    try { metadata = JSON.parse(freshLog.metadata || '{}'); } catch (e) { metadata = {}; }

    // Handle follow-up confirmation (booking / connection) based on call log state
    if (freshLog.current_step === 'confirm_book_machine' && digits === '1') {
      // Perform booking (create bookings entry)
      if (!user) {
        const body = say('We could not detect your registered account. Please register on the platform first. Goodbye.');
        await run('UPDATE call_logs SET action_taken = ? WHERE id = ?', ['booking_failed_no_user', callLog.id]);
        res.set('Content-Type', 'application/xml');
        return res.send(xmlResponse(body));
      }

      const machine = await get('SELECT * FROM machines WHERE id = ?', [metadata.machine_id]);
      const farm = await get('SELECT * FROM farms WHERE id = ?', [farmId]);
      if (!machine || !farm) {
        const body = say('Booking failed due to missing data. Please try again later.');
        res.set('Content-Type', 'application/xml');
        await run('UPDATE call_logs SET action_taken = ? WHERE id = ?', ['booking_failed_data', callLog.id]);
        return res.send(xmlResponse(body));
      }

      const bookingId = 'book_' + Date.now();
      const bookingDate = new Date().toISOString().slice(0,10);
      const acres = farm.area_acres || 1;
      const total_price = Math.round(acres * machine.rate_per_acre);
      await run(
        `INSERT INTO bookings (id, farmer_id, farm_id, machine_id, booking_date, acres, total_price, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
        [bookingId, user.id, farm.id, machine.id, bookingDate, Number(acres), Number(total_price), 'Booked via IVR']
      );

      // Notification to seller
      const m = await get('SELECT m.*, s.user_id as seller_user_id FROM machines m JOIN sellers s ON m.seller_id = s.id WHERE m.id = ?', [machine.id]);
      if (m) {
        await run(`INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, 'info')`, ['notif_' + Date.now(), m.seller_user_id, 'New IVR Booking', `Booking ${bookingId} received for ${m.name}`]);
      }

      await run('UPDATE call_logs SET action_taken = ? WHERE id = ?', ['booked_machine', callLog.id]);
      const body = say('Your booking has been created. The machinery provider will contact you shortly. Thank you.') + say('Goodbye.');
      res.set('Content-Type', 'application/xml');
      return res.send(xmlResponse(body));
    }

    if (freshLog.current_step === 'confirm_connect_buyer' && digits === '1') {
      if (!user) {
        const body = say('We could not detect your registered account. Please register on the platform first. Goodbye.');
        await run('UPDATE call_logs SET action_taken = ? WHERE id = ?', ['connect_failed_no_user', callLog.id]);
        res.set('Content-Type', 'application/xml');
        return res.send(xmlResponse(body));
      }

      const buyer = await get('SELECT * FROM buyer_listings WHERE id = ?', [metadata.buyer_id]);
      const farm = await get('SELECT * FROM farms WHERE id = ?', [farmId]);
      if (!buyer || !farm) {
        const body = say('Connection request failed due to missing data. Please try again later.');
        res.set('Content-Type', 'application/xml');
        await run('UPDATE call_logs SET action_taken = ? WHERE id = ?', ['connect_failed_data', callLog.id]);
        return res.send(xmlResponse(body));
      }

      const connId = 'conn_' + Date.now();
      const estimated_tons = Math.round((farm.area_acres || 1) * 1.8);
      const offered_price_per_ton = buyer.price_per_ton || 0;
      const total_estimated_value = Math.round(estimated_tons * offered_price_per_ton);

      await run(
        `INSERT INTO connection_requests (id, farmer_id, farm_id, buyer_listing_id, estimated_tons, offered_price_per_ton, total_estimated_value, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
        [connId, user.id, farm.id, buyer.id, Number(estimated_tons), Number(offered_price_per_ton), Number(total_estimated_value), 'Created via IVR']
      );

      // Notify buyer seller
      const b = await get('SELECT b.*, s.user_id as seller_user_id FROM buyer_listings b JOIN sellers s ON b.seller_id = s.id WHERE b.id = ?', [buyer.id]);
      if (b) {
        await run(`INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, 'info')`, ['notif_' + Date.now(), b.seller_user_id, 'New IVR Connection Request', `Connection ${connId} received for your buyer listing`]);
      }

      await run('UPDATE call_logs SET action_taken = ? WHERE id = ?', ['created_connection_request', callLog.id]);
      const body = say('Your connection request has been sent to the buyer. They will contact you shortly. Thank you.') + say('Goodbye.');
      res.set('Content-Type', 'application/xml');
      return res.send(xmlResponse(body));
    }

    // Handle menu options
    if (digits === '1') {
      // Machinery path
      const rec = await computeRecommendationForFarm(farmId);
      if (!rec || !rec.bestMachine) {
        const body = say('No verified machinery providers found within 50 kilometers of your registered farm. We have alerted the district office. Thank you.') + say('Goodbye.');
        res.set('Content-Type', 'application/xml');
        await run('UPDATE call_logs SET action_taken = ? WHERE id = ?', ['no_machines', callLog.id]);
        return res.send(xmlResponse(body));
      }

      // Save chosen machine in metadata
      const meta = { machine_id: rec.bestMachine.id };
      await run('UPDATE call_logs SET metadata = ?, current_step = ? WHERE id = ?', [JSON.stringify(meta), 'confirm_book_machine', callLog.id]);

      const prompt = `Recommended ${rec.bestMachine.name} from ${rec.bestMachine.business_name} at ${rec.bestMachine.rate_per_acre} rupees per acre. Press 1 to book this machine now, or 9 to return to main menu.`;
      const body = gather('/api/v1/ivr/exotel', 1, prompt);
      res.set('Content-Type', 'application/xml');
      return res.send(xmlResponse(body));
    }

    if (digits === '2') {
      // Buyers path
      const rec = await computeRecommendationForFarm(farmId);
      if (!rec || !rec.bestBuyer) {
        const body = say('No verified residue buyers found within 80 kilometers of your registered farm. Please try later. Goodbye.') + say('Goodbye.');
        res.set('Content-Type', 'application/xml');
        await run('UPDATE call_logs SET action_taken = ? WHERE id = ?', ['no_buyers', callLog.id]);
        return res.send(xmlResponse(body));
      }

      const meta = { buyer_id: rec.bestBuyer.id };
      await run('UPDATE call_logs SET metadata = ?, current_step = ? WHERE id = ?', [JSON.stringify(meta), 'confirm_connect_buyer', callLog.id]);

      const prompt = `We found buyer ${rec.bestBuyer.business_name} offering ${rec.bestBuyer.price_per_ton} rupees per ton. Press 1 to send them a connection request, or 9 to return to main menu.`;
      const body = gather('/api/v1/ivr/exotel', 1, prompt);
      res.set('Content-Type', 'application/xml');
      return res.send(xmlResponse(body));
    }

    if (digits === '3') {
      // Guidance
      const guidance = 'Crop residue management advice: Do not burn. Consider happy seeder or mulching. Sell residue as biomass to local buyers or incorporate using a super seeder. Contact your local agriculture officer for subsidy details.';
      const body = say(guidance) + say('Press 9 to return to main menu or hang up to end the call.');
      res.set('Content-Type', 'application/xml');
      await run('UPDATE call_logs SET action_taken = ? WHERE id = ?', ['guidance_played', callLog.id]);
      return res.send(xmlResponse(body));
    }

    if (digits === '4') {
      // Generic request/connect - forward to menu
      const body = say('To connect with machinery press 1, to connect with buyers press 2.');
      res.set('Content-Type', 'application/xml');
      return res.send(xmlResponse(gather('/api/v1/ivr/exotel', 1, 'Press 1 for machinery, 2 for buyers')));
    }

    if (digits === '5') {
      // Support
      const supportNumber = process.env.SUPPORT_NUMBER || '+919417000000';
      const body = say(`For assistance, please call our support number ${supportNumber}. We will also create a support ticket and notify the team.`) + say('Goodbye.');
      await run('UPDATE call_logs SET action_taken = ? WHERE id = ?', ['support_info_shared', callLog.id]);
      res.set('Content-Type', 'application/xml');
      return res.send(xmlResponse(body));
    }

    

    // Default fallback
    const body = say('Sorry, we did not understand your input. Returning to main menu.') + gather('/api/v1/ivr/exotel', 1, 'For machinery press 1, for buyers press 2, for guidance press 3, for support press 5.');
    res.set('Content-Type', 'application/xml');
    return res.send(xmlResponse(body));
  } catch (err) {
    console.error('IVR webhook error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
