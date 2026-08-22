const express = require('express');
const router = express.Router();
const { query } = require('../db');

// GET /api/options - Fetch all dynamic dropdown options directly from database
router.get('/', async (req, res) => {
  try {
    const [sellerTypesRes, machineTypesRes, cropsRes, districtsRes] = await Promise.all([
      query(`SELECT DISTINCT type FROM sellers WHERE type IS NOT NULL AND type != '' 
             UNION 
             SELECT DISTINCT seller_type FROM sellers WHERE seller_type IS NOT NULL AND seller_type != ''`),
      query(`SELECT DISTINCT type FROM machines WHERE type IS NOT NULL AND type != ''`),
      query(`SELECT DISTINCT crop_type FROM farms WHERE crop_type IS NOT NULL AND crop_type != '' 
             UNION 
             SELECT DISTINCT crop_type FROM buyer_listings WHERE crop_type IS NOT NULL AND crop_type != ''`),
      query(`SELECT DISTINCT district FROM users WHERE district IS NOT NULL AND district != '' 
             UNION 
             SELECT DISTINCT district FROM sellers WHERE district IS NOT NULL AND district != ''`)
    ]);

    const formatLabel = (str) => {
      if (!str) return '';
      return str
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
    };

    // Standardized maps with human-readable labels and database values
    const sellerTypes = Array.from(new Set([
      'machinery_provider',
      'machinery_rental',
      'residue_buyer',
      'biofuel_buyer',
      'paper_mill',
      'compost_plant',
      ...sellerTypesRes.map((r) => r.type)
    ])).map((value) => ({
      value,
      label: value === 'machinery_provider' || value === 'machinery_rental'
        ? 'Machinery Provider (Equipment Rental)'
        : value === 'residue_buyer' || value === 'biofuel_buyer'
        ? 'Residue Buyer (Biomass & Paddy Straw Buyer)'
        : formatLabel(value)
    }));

    const machineTypes = Array.from(new Set([
      'super_seeder',
      'happy_seeder',
      'baler',
      'paddy_straw_chopper',
      'zero_till_drill',
      'combine_harvester',
      'rotavator',
      ...machineTypesRes.map((r) => r.type)
    ])).map((value) => ({
      value,
      label: formatLabel(value)
    }));

    const crops = Array.from(new Set([
      'Paddy (Rice)',
      'Basmati Rice',
      'Wheat',
      'Mustard',
      'Cotton',
      'Sugarcane',
      'Maize',
      'Paddy Straw',
      'Basmati Straw',
      'Mustard Husk',
      ...cropsRes.map((r) => r.crop_type)
    ]));

    const districts = Array.from(new Set([
      'Ludhiana',
      'Amritsar',
      'Jalandhar',
      'Patiala',
      'Sangrur',
      'Bathinda',
      'Ferozepur',
      'Moga',
      'Hoshiarpur',
      'Faridkot',
      'Mansa',
      'Tarn Taran',
      'Chandigarh',
      ...districtsRes.map((r) => r.district)
    ])).sort();

    res.json({
      seller_types: sellerTypes,
      machine_types: machineTypes,
      crops,
      districts,
      states: ['Punjab', 'Haryana', 'Rajasthan', 'Uttar Pradesh']
    });
  } catch (err) {
    console.error('Options API Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch options' });
  }
});

module.exports = router;
