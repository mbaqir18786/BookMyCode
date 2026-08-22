const schemaSQL = `

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK(role IN ('farmer', 'seller', 'government', 'super_admin')),
  name TEXT NOT NULL,
  username TEXT UNIQUE,
  phone TEXT UNIQUE,
  email TEXT,
  password_hash TEXT,
  phone_verified_at TIMESTAMPTZ,
  district TEXT DEFAULT 'Ludhiana',
  state TEXT DEFAULT 'Punjab',
  kyc_status TEXT DEFAULT 'pending'
    CHECK(kyc_status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- OTP CHALLENGES TABLE
CREATE TABLE IF NOT EXISTS otp_challenges (
  id TEXT PRIMARY KEY,
  phone TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK(purpose IN ('signup', 'password_reset')),
  otp_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK(attempt_count >= 0 AND attempt_count <= 3),
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS otp_challenges_lookup_idx
  ON otp_challenges (phone, purpose, created_at DESC);

-- FARMS TABLE
CREATE TABLE IF NOT EXISTS farms (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  crop_type TEXT DEFAULT 'Paddy (Rice)',
  area_acres REAL NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  address TEXT NOT NULL,
  harvest_date DATE NOT NULL,
  next_sowing_date DATE NOT NULL,
  budget_amount REAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- SELLERS TABLE
CREATE TABLE IF NOT EXISTS sellers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('machinery_rental', 'biofuel_buyer')),
  business_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT NOT NULL,
  district TEXT NOT NULL,
  state TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  service_radius_km REAL DEFAULT 50,
  kyc_status TEXT DEFAULT 'pending'
    CHECK(kyc_status IN ('pending', 'approved', 'rejected')),
  kyc_document_url TEXT,
  kyc_ai_result JSONB,
  rating REAL DEFAULT 5.0,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- BUYERS TABLE
CREATE TABLE IF NOT EXISTS buyers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  kyc_status TEXT DEFAULT 'pending' CHECK(kyc_status IN ('pending', 'approved', 'rejected')),
  kyc_ai_result JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- MACHINERY LISTINGS TABLE
CREATE TABLE IF NOT EXISTS machinery_listings (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL,
  machine_type TEXT NOT NULL
    CHECK(machine_type IN ('super_seeder', 'happy_seeder', 'baler', 'paddy_straw_chopper', 'zero_till_drill')),
  model_name TEXT NOT NULL,
  daily_rate REAL NOT NULL,
  hourly_rate REAL,
  available_units INTEGER DEFAULT 1,
  current_availability_status TEXT DEFAULT 'available'
    CHECK(current_availability_status IN ('available', 'busy', 'maintenance')),
  coverage_acres_per_day REAL DEFAULT 15,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES sellers(id)
);

-- RESIDUE BUYER OFFERS TABLE
CREATE TABLE IF NOT EXISTS residue_buyer_offers (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL,
  offered_price_per_ton REAL NOT NULL,
  required_tons REAL NOT NULL,
  residue_type TEXT DEFAULT 'paddy_straw'
    CHECK(residue_type IN ('paddy_straw', 'basmati_straw', 'mustard_husk')),
  pickup_provided INTEGER DEFAULT 1,
  min_order_tons REAL DEFAULT 5,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES sellers(id)
);

-- RECOMMENDATION RUNS TABLE
CREATE TABLE IF NOT EXISTS recommendation_runs (
  id TEXT PRIMARY KEY,
  farm_id TEXT NOT NULL,
  recommended_strategy TEXT NOT NULL
    CHECK(recommended_strategy IN ('rent_super_seeder', 'sell_to_buyer', 'rent_happy_seeder', 'custom')),
  estimated_cost REAL,
  estimated_revenue REAL,
  net_benefit REAL,
  confidence_score REAL,
  explanation TEXT,
  algorithm_version TEXT DEFAULT 'v1.0',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farm_id) REFERENCES farms(id)
);

-- BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  farm_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  listing_id TEXT,
  booking_type TEXT NOT NULL CHECK(booking_type IN ('machinery', 'residue_sale')),
  status TEXT DEFAULT 'pending'
    CHECK(status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_cost REAL,
  total_revenue REAL,
  acres_booked REAL,
  tons_booked REAL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farm_id) REFERENCES farms(id),
  FOREIGN KEY (seller_id) REFERENCES sellers(id)
);

-- INCIDENTS TABLE
CREATE TABLE IF NOT EXISTS incidents (
  id TEXT PRIMARY KEY,
  farm_id TEXT,
  district TEXT NOT NULL,
  state TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  incident_date DATE NOT NULL,
  fire_radiative_power REAL,
  satellite_source TEXT DEFAULT 'VIIRS'
    CHECK(satellite_source IN ('VIIRS', 'MODIS', 'GROUND_REPORT')),
  severity TEXT DEFAULT 'medium'
    CHECK(severity IN ('low', 'medium', 'high', 'critical')),
  repeat_offender_flag INTEGER DEFAULT 0,
  status TEXT DEFAULT 'open'
    CHECK(status IN ('open', 'under_investigation', 'resolved', 'action_taken')),
  officer_action TEXT,
  officer_notes TEXT,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farm_id) REFERENCES farms(id)
);

-- NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info'
    CHECK(type IN ('info', 'success', 'warning', 'error')),
  is_read INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SIMULATIONS TABLE
CREATE TABLE IF NOT EXISTS simulations (
    id SERIAL PRIMARY KEY,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    scenario VARCHAR(50) NOT NULL,
    final_confidence DOUBLE PRECISION NOT NULL,
    decision VARCHAR(20) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    sensor_agreement INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SENSOR RESULTS TABLE
CREATE TABLE IF NOT EXISTS sensor_results (
    id SERIAL PRIMARY KEY,
    simulation_id INTEGER REFERENCES simulations(id) ON DELETE CASCADE,
    sensor VARCHAR(40) NOT NULL,
    confidence DOUBLE PRECISION NOT NULL,
    fire_detected BOOLEAN NOT NULL,
    resolution VARCHAR(30) NOT NULL
);

-- SIMULATION CONTEXT TABLE
CREATE TABLE IF NOT EXISTS simulation_context (
    id SERIAL PRIMARY KEY,
    simulation_id INTEGER REFERENCES simulations(id) ON DELETE CASCADE,
    land_type VARCHAR(50),
    biomass_level VARCHAR(30),
    machinery VARCHAR(80),
    temperature DOUBLE PRECISION,
    wind DOUBLE PRECISION
);

CREATE INDEX IF NOT EXISTS simulation_location_idx
ON simulations(latitude, longitude);

CREATE INDEX IF NOT EXISTS simulation_time_idx
ON simulations(created_at);

CREATE INDEX IF NOT EXISTS sensor_simulation_idx
ON sensor_results(simulation_id);

`;

module.exports = schemaSQL;