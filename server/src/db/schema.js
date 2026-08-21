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
  crop_type TEXT NOT NULL DEFAULT 'Paddy (Rice)',
  area_acres DOUBLE PRECISION NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT NOT NULL,
  harvest_date DATE NOT NULL,
  next_sowing_date DATE NOT NULL,
  budget_amount DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- SELLERS TABLE
CREATE TABLE IF NOT EXISTS sellers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  seller_type TEXT NOT NULL
    CHECK(seller_type IN ('machinery_provider', 'residue_buyer')),
  business_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  kyc_status TEXT NOT NULL DEFAULT 'pending'
    CHECK(kyc_status IN ('pending', 'approved', 'rejected')),
  kyc_docs_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- MACHINES TABLE
CREATE TABLE IF NOT EXISTS machines (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  rate_per_acre DOUBLE PRECISION NOT NULL,
  max_capacity_acres_per_day DOUBLE PRECISION NOT NULL DEFAULT 10,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT NOT NULL,
  status TEXT DEFAULT 'available'
    CHECK(status IN ('available', 'busy', 'maintenance')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE
);

-- BUYER LISTINGS TABLE
CREATE TABLE IF NOT EXISTS buyer_listings (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL,
  crop_type TEXT NOT NULL DEFAULT 'Paddy Straw',
  buying_purpose TEXT NOT NULL,
  price_per_ton DOUBLE PRECISION NOT NULL,
  required_tons DOUBLE PRECISION NOT NULL,
  min_quality TEXT DEFAULT 'Standard Dry',
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT NOT NULL,
  status TEXT DEFAULT 'active'
    CHECK(status IN ('active', 'fulfilled', 'closed')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE
);

-- BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  farmer_id TEXT NOT NULL,
  farm_id TEXT NOT NULL,
  machine_id TEXT NOT NULL,
  booking_date DATE NOT NULL,
  acres REAL NOT NULL,
  total_price REAL NOT NULL,
  status TEXT DEFAULT 'pending'
    CHECK(status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES users(id),
  FOREIGN KEY (farm_id) REFERENCES farms(id),
  FOREIGN KEY (machine_id) REFERENCES machines(id)
);

-- CONNECTION REQUESTS TABLE
CREATE TABLE IF NOT EXISTS connection_requests (
  id TEXT PRIMARY KEY,
  farmer_id TEXT NOT NULL,
  farm_id TEXT NOT NULL,
  buyer_listing_id TEXT NOT NULL,
  estimated_tons REAL NOT NULL,
  offered_price_per_ton REAL NOT NULL,
  total_estimated_value REAL NOT NULL,
  status TEXT DEFAULT 'pending'
    CHECK(status IN ('pending', 'accepted', 'rejected', 'completed')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES users(id),
  FOREIGN KEY (farm_id) REFERENCES farms(id),
  FOREIGN KEY (buyer_listing_id) REFERENCES buyer_listings(id)
);

-- INCIDENTS TABLE
CREATE TABLE IF NOT EXISTS incidents (
  id TEXT PRIMARY KEY,
  farm_id TEXT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  district TEXT NOT NULL DEFAULT 'Ludhiana',
  detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  satellite_source TEXT DEFAULT 'VIIRS / MODIS',
  severity TEXT DEFAULT 'high'
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

`;

module.exports = schemaSQL;