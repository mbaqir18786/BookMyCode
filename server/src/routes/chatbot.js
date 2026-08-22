const express = require('express');
const router = express.Router();
const https = require('https');
const { query, get, calculateDistance } = require('../db');

// ─── Gemini REST call with multi-turn history support ─────────────────────────
function callGemini(systemPrompt, history, userMessage) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.GEMINI_API_KEY;

    // Build multi-turn contents array
    const contents = [];

    // Inject history turns
    if (history && history.length > 0) {
      for (const turn of history) {
        contents.push({
          role: turn.role, // 'user' or 'model'
          parts: [{ text: turn.text }]
        });
      }
    }

    // Current user message
    contents.push({ role: 'user', parts: [{ text: userMessage }] });

    const bodyObj = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.9,       // higher = more varied, less robotic
        topP: 0.95,
        topK: 40
      }
    };

    const body = JSON.stringify(bodyObj);

    // Smart models first, lite as fallback
    const modelsToTry = [
      'gemini-flash-latest',
      'gemini-2.5-flash',
      'gemini-flash-lite-latest',
      'gemini-pro-latest'
    ];

    let attempt = 0;
    function tryModel() {
      if (attempt >= modelsToTry.length) return reject(new Error('All Gemini models exhausted'));
      const model = modelsToTry[attempt++];
      const path = `/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const options = {
        hostname: 'generativelanguage.googleapis.com',
        path,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', c => { data += c; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              console.log(`[Gemini] ${model} failed: ${parsed.error.message.slice(0, 100)}`);
              return tryModel();
            }
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) return tryModel();
            resolve({ text, model });
          } catch (e) { tryModel(); }
        });
      });
      req.on('error', () => tryModel());
      req.write(body);
      req.end();
    }

    tryModel();
  });
}

// ─── POST /api/chat ───────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const {
      message,
      history = [],       // array of { role: 'user'|'model', text: string }
      farm_id = 'farm_1',
      user_id = 'usr_farmer_1'
    } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // ── Pull real data from DB ─────────────────────────────────────────────
    const [farm, user] = await Promise.all([
      get('SELECT * FROM farms WHERE id = ?', [farm_id]),
      get('SELECT * FROM users WHERE id = ?', [user_id])
    ]);

<<<<<<< HEAD
    let farmSection = 'The farmer has no registered farm yet.';
    let machinerySection = 'No nearby machinery data available.';
    let buyerSection = 'No nearby buyer data available.';
=======
    if (matchAcreage) {
      const val = parseInt(matchAcreage[1], 10);
      if (val > 100) {
        sanityWarning = `⚠️ **Data Check Warning**: You mentioned ${val} acres. That seems extraordinarily large for a single plot! Please double-check if you typed an extra digit (e.g., 10 acres instead of 100).`;
      }
    }

    // 2. Fetch real farm details & real nearby listings
    const farm = await get('SELECT * FROM farms WHERE id = $1', [farm_id]);
    let responseText = '';
>>>>>>> feature/authentication

    if (farm) {
      const daysLeft = Math.max(0, Math.ceil(
        (new Date(farm.next_sowing_date) - new Date(farm.harvest_date)) / 86400000
      ));
      const estimatedTons = (farm.area_acres * 1.8).toFixed(1);

      farmSection = [
        `Farm Name: ${farm.name}`,
        `Location: ${farm.address} (${farm.latitude}, ${farm.longitude})`,
        `Crop: ${farm.crop_type}`,
        `Area: ${farm.area_acres} acres`,
        `Estimated paddy straw: ~${estimatedTons} metric tons`,
        `Harvest date: ${farm.harvest_date}`,
        `Next wheat sowing deadline: ${farm.next_sowing_date}`,
        `Window to clear residue: ${daysLeft} days`,
        `Budget for machinery: ₹${farm.budget_amount ? farm.budget_amount.toLocaleString('en-IN') : 'not set'}`
      ].join('\n');

      // Real nearby machines
      const allMachines = await query(
        `SELECT m.*, s.business_name, s.phone as seller_phone
         FROM machines m JOIN sellers s ON m.seller_id = s.id
         WHERE s.kyc_status = 'approved' AND m.status = 'available'`
      );
      const machines = allMachines
        .map(m => ({ ...m, dist: calculateDistance(farm.latitude, farm.longitude, m.latitude, m.longitude), cost: Math.round(farm.area_acres * m.rate_per_acre) }))
        .filter(m => m.dist <= 60)
        .sort((a, b) => a.cost - b.cost)
        .slice(0, 5);

      machinerySection = machines.length
        ? machines.map(m =>
            `• ${m.name} (${m.type}) — ${m.business_name}, ${m.dist.toFixed(1)} km away | ₹${m.rate_per_acre}/acre | Total for your farm: ₹${m.cost.toLocaleString('en-IN')} | Capacity: ${m.max_capacity_acres_per_day} acres/day | Contact: ${m.seller_phone}`
          ).join('\n')
        : 'No approved machinery providers found within 60 km.';

      // Real nearby buyers
      const allBuyers = await query(
        `SELECT b.*, s.business_name, s.phone as seller_phone
         FROM buyer_listings b JOIN sellers s ON b.seller_id = s.id
         WHERE s.kyc_status = 'approved' AND b.status = 'active'`
      );
      const buyers = allBuyers
        .map(b => ({ ...b, dist: calculateDistance(farm.latitude, farm.longitude, b.latitude, b.longitude), revenue: Math.round(estimatedTons * b.price_per_ton) }))
        .filter(b => b.dist <= 80)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      buyerSection = buyers.length
        ? buyers.map(b =>
            `• ${b.business_name} (${b.buying_purpose}) — ${b.dist.toFixed(1)} km away | ₹${b.price_per_ton}/ton | Needs: ${b.required_tons} tons | Revenue for your farm: ₹${b.revenue.toLocaleString('en-IN')} | Contact: ${b.seller_phone}`
          ).join('\n')
        : 'No approved residue buyers found within 80 km.';
    }

    // ── Build the system prompt ────────────────────────────────────────────
    const systemPrompt = `You are AgriBot — an expert, warm, and conversational AI assistant for Punjab farmers built into the "AgriPunjab" crop residue management platform. You combine deep agricultural domain knowledge with real-time farm data.

## Your Personality
- Friendly and approachable, like talking to a trusted agricultural expert
- You remember everything said in this conversation
- You give detailed, thoughtful answers — not just 2-3 sentences
- You use bullet points, numbered lists, and structure when it helps clarity
- You can answer ANYTHING related to farming, crops, soil, weather, government schemes, market prices, or agronomy
- You speak positively about alternatives to stubble burning

## Farmer's Profile
- Name: ${user?.name || 'Friend'}
- District: ${user?.district || 'Punjab'}
- Role: Registered farmer on AgriPunjab platform

## Farmer's Current Farm Data (from our database)
${farmSection}

## Nearby Verified Machinery Providers (KYC-approved, real listings)
${machinerySection}

## Nearby Verified Residue Buyers (KYC-approved, real listings)
${buyerSection}

## Key Knowledge You Have
- Punjab Pollution Control Board (PPCB) guidelines on stubble burning bans and penalties (₹2,500–₹15,000 fines)
- Punjab Agricultural University (PAU) Ludhiana recommendations for Happy Seeder, Super SMS, Rotavator
- PM-PRANAM scheme: ₹1,000/acre incentive for farmers who avoid burning
- Parali (paddy straw) uses: biogas, biofuel, mushroom growing, cardboard, biomass power plants
- Current mandi rates and seasonal price trends
- Soil health benefits of mulching vs. burning
- Wheat sowing window in Punjab: October 25 – November 20 (ideal)
- Rice varieties: PR-126 (early harvest), Basmati, PR-121, PR-131
- Happy Seeder: can sow wheat directly into paddy stubble, costs ₹1,400–1,800/acre
- Super SMS: shreds straw in-situ, costs ₹800–1,200/acre
- Rotavator: tills and mixes straw into soil, costs ₹600–1,000/acre

## Rules
- **Multilingual Support**: ALWAYS respond in whatever language or script the user speaks in (e.g. Gurmukhi Punjabi, Hindi, Hinglish, Punjabi in Roman script, or English). If the user asks in Punjabi, reply in fluent Punjabi!
- When real DB data exists (machines, buyers, farm details), always REFERENCE IT specifically by name, distance, and price
- When answering general farming questions, use your full knowledge — don't limit yourself to DB data
- Format responses with markdown: **bold**, bullet lists, headings where useful
- If a question has nothing to do with farming or agriculture, politely say you specialize in agricultural advice
- Be conversational — acknowledge what the user said before answering
- Never give the exact same phrasing twice; vary your language naturally`;

    // ── Call Gemini with full history ──────────────────────────────────────
    const { text, model } = await callGemini(systemPrompt, history, message.trim());

    res.json({
      reply: text,
      model_used: model
    });

  } catch (err) {
    console.error('[Chatbot Error]', err.message);
    res.status(500).json({
      reply: "I'm having a momentary issue. Please try again in a second!",
      error: err.message
    });
  }
});

module.exports = router;
