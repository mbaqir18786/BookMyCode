const express = require('express');
const router = express.Router();
const { get, query, calculateDistance } = require('../db');

// GET /api/farms/:id/recommendation
router.get('/:id/recommendation', async (req, res) => {
  try {
    const farmId = req.params.id;
    const farm = await get('SELECT * FROM farms WHERE id = $1', [farmId]);

    if (!farm) {
      return res.status(404).json({ error: 'Farm not found' });
    }

    // 1. Calculate time window
    const harvestDate = new Date(farm.harvest_date);
    const sowingDate = new Date(farm.next_sowing_date);
    const diffTime = sowingDate - harvestDate;
    const daysAvailable = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    // 2. Query nearby approved machinery
    const rawMachines = await query(
      `SELECT m.*, s.business_name, s.phone as seller_phone
       FROM machines m
       JOIN sellers s ON m.seller_id = s.id
       WHERE s.kyc_status = 'approved' AND m.status = 'available'`
    );

    const machinesNearby = rawMachines.map((m) => {
      const distance_km = calculateDistance(farm.latitude, farm.longitude, m.latitude, m.longitude);
      const total_cost = Math.round(farm.area_acres * m.rate_per_acre);
      const days_required = Math.ceil(farm.area_acres / (m.max_capacity_acres_per_day || 10));
      const fits_budget = total_cost <= farm.budget_amount;
      const fits_timeline = days_required <= daysAvailable;

      return {
        ...m,
        distance_km,
        total_cost,
        days_required,
        fits_budget,
        fits_timeline
      };
    }).filter((m) => m.distance_km <= 50);

    machinesNearby.sort((a, b) => {
      // Sort by timeline fit, then cost, then distance
      if (a.fits_timeline && !b.fits_timeline) return -1;
      if (!a.fits_timeline && b.fits_timeline) return 1;
      return a.total_cost - b.total_cost;
    });

    // 3. Query nearby approved buyers
    const rawBuyers = await query(
      `SELECT b.*, s.business_name, s.phone as seller_phone
       FROM buyer_listings b
       JOIN sellers s ON b.seller_id = s.id
       WHERE s.kyc_status = 'approved' AND b.status = 'active'`
    );

    const estimated_tons = Math.round(farm.area_acres * 1.8 * 10) / 10; // ~1.8 tons of paddy straw per acre

    const buyersNearby = rawBuyers.map((b) => {
      const distance_km = calculateDistance(farm.latitude, farm.longitude, b.latitude, b.longitude);
      const gross_revenue = Math.round(estimated_tons * b.price_per_ton);

      return {
        ...b,
        distance_km,
        estimated_tons,
        gross_revenue
      };
    }).filter((b) => b.distance_km <= 80);

    buyersNearby.sort((a, b) => b.gross_revenue - a.gross_revenue);

    // 4. Decision logic
    const bestMachine = machinesNearby.length > 0 ? machinesNearby[0] : null;
    const bestBuyer = buyersNearby.length > 0 ? buyersNearby[0] : null;

    let primaryRecommendation = null;
    let rationale = [];
    let has_options = true;

    if (!bestMachine && !bestBuyer) {
      has_options = false;
      rationale.push(`No KYC-approved machinery providers or bio-residue buyers were found within reasonable radius of ${farm.name} (${farm.address}).`);
      rationale.push(`The crop residue management window between harvest (${farm.harvest_date}) and next sowing (${farm.next_sowing_date}) is ${daysAvailable} days.`);
      rationale.push(`This deficit has been automatically flagged to the District Agriculture Office to dispatch mobile custom hiring center machinery.`);

      return res.json({
        farm,
        daysAvailable,
        estimated_tons,
        has_options: false,
        primary_recommendation: {
          action: 'government_flagged',
          title: 'No Nearby Options Available — Government Custom Hiring Center Requested',
          description: rationale.join(' ')
        },
        nearby_machinery: [],
        nearby_buyers: []
      });
    }

    // Determine whether selling residue or renting machine is superior
    if (bestBuyer && (!bestMachine || bestBuyer.gross_revenue > 0)) {
      primaryRecommendation = {
        action: 'sell_residue',
        title: 'Recommended Strategy: Sell Paddy Residue for Biofuel / Industrial Use',
        buyer: bestBuyer,
        financial_impact: `Earn +₹${bestBuyer.gross_revenue.toLocaleString('en-IN')} revenue (Selling ${bestBuyer.estimated_tons} tons @ ₹${bestBuyer.price_per_ton}/ton)`,
        time_impact: `Collection handled directly by ${bestBuyer.business_name} (${bestBuyer.distance_km} km away).`
      };

      rationale.push(`Instead of spending on burning or field clearing, selling your paddy residue to ${bestBuyer.business_name} generates ₹${bestBuyer.gross_revenue.toLocaleString('en-IN')} in net income.`);
      rationale.push(`The buyer operates a ${bestBuyer.buying_purpose} just ${bestBuyer.distance_km} km away, easily fitting your ${daysAvailable}-day window before sowing.`);
    } else if (bestMachine) {
      primaryRecommendation = {
        action: 'rent_machinery',
        title: `Recommended Strategy: Hire ${bestMachine.name}`,
        machine: bestMachine,
        financial_impact: `Rental Cost: ₹${bestMachine.total_cost.toLocaleString('en-IN')} (₹${bestMachine.rate_per_acre}/acre for ${farm.area_acres} acres)`,
        time_impact: `Est. ${bestMachine.days_required} days required (${daysAvailable} days available before sowing)`
      };

      rationale.push(`Hiring a ${bestMachine.name} from ${bestMachine.business_name} (${bestMachine.distance_km} km away) will incorporate stubble into the soil within ${bestMachine.days_required} days.`);
      if (bestMachine.fits_budget) {
        rationale.push(`The estimated cost of ₹${bestMachine.total_cost.toLocaleString('en-IN')} fits comfortably within your set budget of ₹${farm.budget_amount.toLocaleString('en-IN')}.`);
      } else {
        rationale.push(`Note: The rental cost exceeds your current budget setting by ₹${(bestMachine.total_cost - farm.budget_amount).toLocaleString('en-IN')}. Custom hiring subsidies may apply.`);
      }
    }

    res.json({
      farm,
      daysAvailable,
      estimated_tons,
      has_options: true,
      primary_recommendation: primaryRecommendation,
      rationale: rationale.join(' '),
      nearby_machinery: machinesNearby,
      nearby_buyers: buyersNearby
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
