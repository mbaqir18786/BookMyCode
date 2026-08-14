const schemaSQL = `
-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK(role IN ('farmer', 'seller', 'government', 'super_admin')),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  district TEXT DEFAULT 'Ludhiana',
  state TEXT DEFAULT 'Punjab',
  kyc_status TEXT DEFAULT 'pending' CHECK(kyc_status IN ('pending', 'approved', 'rejected')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- FARMS TABLE
CREATE TABLE IF NOT EXISTS farms (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  crop_type TEXT NOT NULL DEFAULT 'Paddy (Rice)',
  area_acres REAL NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  address TEXT NOT NULL,
  harvest_date DATE NOT NULL,
  next_sowing_date DATE NOT NULL,
  budget_amount REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- SELLERS TABLE
CREATE TABLE IF NOT EXISTS sellers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  seller_type TEXT NOT NULL CHECK(seller_type IN ('machinery_provider', 'residue_buyer')),
  business_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  kyc_status TEXT NOT NULL DEFAULT 'pending' CHECK(kyc_status IN ('pending', 'approved', 'rejected')),
  kyc_docs_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- MACHINES TABLE (Machinery Provider Listings)
CREATE TABLE IF NOT EXISTS machines (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- e.g., 'Happy Seeder', 'Super Seeder', 'Paddy Straw Chopper / Mulcher', 'Baler', 'Rotavator'
  rate_per_acre REAL NOT NULL,
  max_capacity_acres_per_day REAL NOT NULL DEFAULT 10,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  address TEXT NOT NULL,
  status TEXT DEFAULT 'available' CHECK(status IN ('available', 'busy', 'maintenance')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE
);

-- BUYER LISTINGS TABLE (Residue Buyer Listings)
CREATE TABLE IF NOT EXISTS buyer_listings (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL,
  crop_type TEXT NOT NULL DEFAULT 'Paddy Straw',
  buying_purpose TEXT NOT NULL, -- e.g. 'Biofuel Plant', 'Paper Mill', 'Composting Unit', 'Animal Feed', 'Thermal Power'
  price_per_ton REAL NOT NULL,
  required_tons REAL NOT NULL,
  min_quality TEXT DEFAULT 'Standard Dry',
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  address TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'fulfilled', 'closed')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE
);

-- BOOKINGS TABLE (Farmer -> Machine)
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  farmer_id TEXT NOT NULL,
  farm_id TEXT NOT NULL,
  machine_id TEXT NOT NULL,
  booking_date DATE NOT NULL,
  acres REAL NOT NULL,
  total_price REAL NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES users(id),
  FOREIGN KEY (farm_id) REFERENCES farms(id),
  FOREIGN KEY (machine_id) REFERENCES machines(id)
);

-- CONNECTION REQUESTS TABLE (Farmer -> Buyer)
CREATE TABLE IF NOT EXISTS connection_requests (
  id TEXT PRIMARY KEY,
  farmer_id TEXT NOT NULL,
  farm_id TEXT NOT NULL,
  buyer_listing_id TEXT NOT NULL,
  estimated_tons REAL NOT NULL,
  offered_price_per_ton REAL NOT NULL,
  total_estimated_value REAL NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected', 'completed')),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES users(id),
  FOREIGN KEY (farm_id) REFERENCES farms(id),
  FOREIGN KEY (buyer_listing_id) REFERENCES buyer_listings(id)
);

-- INCIDENTS TABLE (Government Satellite Fire Hotspots)
CREATE TABLE IF NOT EXISTS incidents (
  id TEXT PRIMARY KEY,
  farm_id TEXT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  district TEXT NOT NULL DEFAULT 'Ludhiana',
  detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  satellite_source TEXT DEFAULT 'VIIRS / MODIS',
  severity TEXT CHECK(severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'high',
  repeat_offender_flag INTEGER DEFAULT 0,
  status TEXT DEFAULT 'open' CHECK(status IN ('open', 'under_investigation', 'resolved', 'action_taken')),
  officer_action TEXT,
  officer_notes TEXT,
  resolved_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farm_id) REFERENCES farms(id)
);

-- NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK(type IN ('info', 'success', 'warning', 'error')),
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

module.exports = schemaSQL;
