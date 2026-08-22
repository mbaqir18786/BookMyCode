const { pool } = require('./index');

async function createViews() {
  try {
    await pool.query(`
      CREATE OR REPLACE VIEW machines AS
      SELECT 
        id,
        seller_id,
        model_name AS name,
        machine_type AS type,
        daily_rate AS rate_per_acre,
        coverage_acres_per_day AS max_capacity_acres_per_day,
        daily_rate,
        hourly_rate,
        available_units,
        current_availability_status AS status,
        description,
        location AS address,
        created_at
      FROM machinery_listings;
      
      CREATE OR REPLACE VIEW buyer_listings AS
      SELECT 
        id,
        seller_id,
        residue_type AS crop_type,
        description AS buying_purpose,
        offered_price_per_ton AS price_per_ton,
        required_tons,
        'Standard' AS min_quality,
        pickup_provided,
        min_order_tons,
        description,
        'active' AS status,
        created_at
      FROM residue_buyer_offers;
    `);
    console.log('Views created successfully.');
  } catch (err) {
    console.error('Error creating views:', err);
  } finally {
    await pool.end();
  }
}

createViews();
