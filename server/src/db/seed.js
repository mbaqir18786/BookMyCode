const { run, query, exec } = require('./index');
const migrate = require('./migrate');

async function seed() {
  await migrate();
  console.log('Seeding initial baseline data...');

  // Clean existing tables
  await exec(`
    DELETE FROM audit_logs;
    DELETE FROM notifications;
    DELETE FROM incidents;
    DELETE FROM connection_requests;
    DELETE FROM bookings;
    DELETE FROM buyer_listings;
    DELETE FROM machines;
    DELETE FROM sellers;
    DELETE FROM farms;
    DELETE FROM users;
    DELETE FROM call_logs;
  `);

  // Seed Users
  const users = [
    {
      id: 'usr_farmer_1',
      role: 'farmer',
      name: 'Gurpreet Singh',
      phone: '+919876543210',
      email: 'gurpreet.farm@example.com',
      district: 'Ludhiana',
      state: 'Punjab',
      kyc_status: 'approved'
    },
    {
      id: 'usr_farmer_2',
      role: 'farmer',
      name: 'Harmanpreet Kaur',
      phone: '+919876543211',
      email: 'harmanpreet@example.com',
      district: 'Sangrur',
      state: 'Punjab',
      kyc_status: 'approved'
    },
    {
      id: 'usr_seller_1',
      role: 'seller',
      name: 'Kahlon Agricultural Machinery',
      phone: '+919812345678',
      email: 'kahlon.agri@example.com',
      district: 'Ludhiana',
      state: 'Punjab',
      kyc_status: 'approved'
    },
    {
      id: 'usr_seller_2',
      role: 'seller',
      name: 'GreenEnergy Bio-Refinery & Pellets',
      phone: '+919876512345',
      email: 'greenenergy.bio@example.com',
      district: 'Ludhiana',
      state: 'Punjab',
      kyc_status: 'approved'
    },
    {
      id: 'usr_seller_3',
      role: 'seller',
      name: 'Unverified Agro Equipment Co.',
      phone: '+919800011122',
      email: 'pending.agro@example.com',
      district: 'Patiala',
      state: 'Punjab',
      kyc_status: 'pending'
    },
    {
      id: 'usr_gov_1',
      role: 'government',
      name: 'Officer Rajesh Kumar (District Agriculture Officer)',
      phone: '+919417000111',
      email: 'dao.ludhiana@punjab.gov.in',
      district: 'Ludhiana',
      state: 'Punjab',
      kyc_status: 'approved'
    },
    {
      id: 'usr_admin_1',
      role: 'super_admin',
      name: 'State Super Admin',
      phone: '+919417000000',
      email: 'superadmin@cropresidue.gov.in',
      district: 'Chandigarh',
      state: 'Punjab',
      kyc_status: 'approved'
    }
  ];

  for (const u of users) {
    await run(
      `INSERT INTO users (id, role, name, phone, email, district, state, kyc_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [u.id, u.role, u.name, u.phone, u.email, u.district, u.state, u.kyc_status]
    );
  }

  // Seed Farms for Farmer Gurpreet Singh (usr_farmer_1)
  const farms = [
    {
      id: 'farm_1',
      user_id: 'usr_farmer_1',
      name: 'Ludhiana East Paddy Field',
      crop_type: 'Paddy (Rice)',
      area_acres: 12.5,
      latitude: 30.901,
      longitude: 75.8573,
      address: 'Village Jagraon Road, Ludhiana, Punjab',
      harvest_date: '2026-10-20',
      next_sowing_date: '2026-11-05',
      budget_amount: 25000
    },
    {
      id: 'farm_2',
      user_id: 'usr_farmer_1',
      name: 'Gill Road Wheat Belt',
      crop_type: 'Paddy (Rice)',
      area_acres: 8.0,
      latitude: 30.8642,
      longitude: 75.875,
      address: 'Gill Village, Ludhiana, Punjab',
      harvest_date: '2026-10-25',
      next_sowing_date: '2026-11-10',
      budget_amount: 15000
    }
  ];

  for (const f of farms) {
    await run(
      `INSERT INTO farms (id, user_id, name, crop_type, area_acres, latitude, longitude, address, harvest_date, next_sowing_date, budget_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [f.id, f.user_id, f.name, f.crop_type, f.area_acres, f.latitude, f.longitude, f.address, f.harvest_date, f.next_sowing_date, f.budget_amount]
    );
  }

  // Seed Sellers
  const sellers = [
    {
      id: 'seller_1',
      user_id: 'usr_seller_1',
      seller_type: 'machinery_provider',
      business_name: 'Kahlon Agri Machinery Rentals',
      phone: '+919812345678',
      address: 'GT Road, Khanna, Ludhiana',
      kyc_status: 'approved',
      kyc_docs_url: 'https://example.com/kyc/kahlon.pdf'
    },
    {
      id: 'seller_2',
      user_id: 'usr_seller_2',
      seller_type: 'residue_buyer',
      business_name: 'GreenEnergy Bio-Refinery Ltd',
      phone: '+919876512345',
      address: 'Focal Point, Phase V, Ludhiana',
      kyc_status: 'approved',
      kyc_docs_url: 'https://example.com/kyc/greenenergy.pdf'
    },
    {
      id: 'seller_3',
      user_id: 'usr_seller_3',
      seller_type: 'machinery_provider',
      business_name: 'Unverified Equipment Store',
      phone: '+919800011122',
      address: 'Nabaha Road, Patiala',
      kyc_status: 'pending',
      kyc_docs_url: 'https://example.com/kyc/pending.pdf'
    }
  ];

  for (const s of sellers) {
    await run(
      `INSERT INTO sellers (id, user_id, seller_type, business_name, phone, address, kyc_status, kyc_docs_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [s.id, s.user_id, s.seller_type, s.business_name, s.phone, s.address, s.kyc_status, s.kyc_docs_url]
    );
  }

  // Seed Machines (Approved Seller 1 + Pending Seller 3)
  const machines = [
    {
      id: 'mach_1',
      seller_id: 'seller_1',
      name: 'Super Seeder Pro 2026',
      type: 'Super Seeder',
      rate_per_acre: 1800,
      max_capacity_acres_per_day: 15,
      latitude: 30.91,
      longitude: 75.86,
      address: 'GT Road, Khanna, Ludhiana (8 km away)',
      status: 'available'
    },
    {
      id: 'mach_2',
      seller_id: 'seller_1',
      name: 'Happy Seeder Turbo XL',
      type: 'Happy Seeder',
      rate_per_acre: 1400,
      max_capacity_acres_per_day: 12,
      latitude: 30.895,
      longitude: 75.84,
      address: 'Doraha, Ludhiana (6 km away)',
      status: 'available'
    },
    {
      id: 'mach_3',
      seller_id: 'seller_3', // PENDING KYC - Should NOT show in farmer search
      name: 'Unverified Baler Heavy 3000',
      type: 'Baler',
      rate_per_acre: 2000,
      max_capacity_acres_per_day: 20,
      latitude: 30.85,
      longitude: 75.80,
      address: 'Patiala (25 km away)',
      status: 'available'
    }
  ];

  for (const m of machines) {
    await run(
      `INSERT INTO machines (id, seller_id, name, type, rate_per_acre, max_capacity_acres_per_day, latitude, longitude, address, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [m.id, m.seller_id, m.name, m.type, m.rate_per_acre, m.max_capacity_acres_per_day, m.latitude, m.longitude, m.address, m.status]
    );
  }

  // Seed Buyer Listings (Approved Seller 2)
  const buyerListings = [
    {
      id: 'buyer_list_1',
      seller_id: 'seller_2',
      crop_type: 'Paddy Straw',
      buying_purpose: 'Biofuel Plant & Ethanol Feedstock',
      price_per_ton: 1650,
      required_tons: 500,
      min_quality: 'Dry Straw (<15% Moisture)',
      latitude: 30.915,
      longitude: 75.88,
      address: 'Biofuel Plant, Focal Point, Ludhiana (10 km away)',
      status: 'active'
    },
    {
      id: 'buyer_list_2',
      seller_id: 'seller_2',
      crop_type: 'Paddy Straw',
      buying_purpose: 'Thermal Power Plant Co-Firing',
      price_per_ton: 1500,
      required_tons: 1200,
      min_quality: 'Baled Paddy Straw',
      latitude: 30.93,
      longitude: 75.82,
      address: 'Industrial Bio-Hub, Ludhiana North (12 km away)',
      status: 'active'
    }
  ];

  for (const b of buyerListings) {
    await run(
      `INSERT INTO buyer_listings (id, seller_id, crop_type, buying_purpose, price_per_ton, required_tons, min_quality, latitude, longitude, address, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [b.id, b.seller_id, b.crop_type, b.buying_purpose, b.price_per_ton, b.required_tons, b.min_quality, b.latitude, b.longitude, b.address, b.status]
    );
  }

  // Seed Incidents (Government Satellite Hotspots)
  const incidents = [
    {
      id: 'inc_101',
      farm_id: 'farm_1',
      latitude: 30.902,
      longitude: 75.858,
      district: 'Ludhiana',
      detected_at: '2026-10-22 14:35:00',
      satellite_source: 'VIIRS / Sentinel-2',
      severity: 'high',
      repeat_offender_flag: 1,
      status: 'open',
      officer_notes: 'Thermal anomaly registered post-harvest window.'
    },
    {
      id: 'inc_102',
      farm_id: null,
      latitude: 30.87,
      longitude: 75.88,
      district: 'Ludhiana',
      detected_at: '2026-10-23 09:15:00',
      satellite_source: 'MODIS',
      severity: 'critical',
      repeat_offender_flag: 0,
      status: 'under_investigation',
      officer_notes: 'Field team dispatched to check machinery deficit in village block.'
    }
  ];

  for (const inc of incidents) {
    await run(
      `INSERT INTO incidents (id, farm_id, latitude, longitude, district, detected_at, satellite_source, severity, repeat_offender_flag, status, officer_notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [inc.id, inc.farm_id, inc.latitude, inc.longitude, inc.district, inc.detected_at, inc.satellite_source, inc.severity, inc.repeat_offender_flag, inc.status, inc.officer_notes]
    );
  }

  console.log('Database seeded successfully with initial records!');
}

if (require.main === module) {
  seed().then(() => process.exit(0)).catch(err => {
    console.error('Seeding error:', err);
    process.exit(1);
  });
}

module.exports = seed;
