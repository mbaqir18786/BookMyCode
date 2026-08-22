const { pool } = require('./index');

/**
 * Safe Master Schema Migration, Data Ingestion, and Model Alignment
 * Loads all 11 tables with constraints and 20 master records per table using INSERT ... ON CONFLICT DO UPDATE.
 */
async function migrateAndSeedMaster() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('🚀 Starting Hay Burning Master Schema Migration & Seed...');

    // 1. USERS
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        role TEXT NOT NULL CHECK(role IN ('farmer','seller','government','super_admin')),
        name TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        phone TEXT UNIQUE NOT NULL,
        email TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        phone_verified_at TIMESTAMPTZ NOT NULL,
        district TEXT NOT NULL,
        state TEXT NOT NULL,
        kyc_status TEXT NOT NULL CHECK(kyc_status IN ('pending','approved','rejected')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE users ADD COLUMN IF NOT EXISTS district TEXT NOT NULL DEFAULT 'Ludhiana';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS state TEXT NOT NULL DEFAULT 'Punjab';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_status TEXT NOT NULL DEFAULT 'pending';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT DEFAULT 'user@example.com';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT DEFAULT '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
    `);

    // Insert 20 Master Users
    await client.query(`
      INSERT INTO users
      (id,role,name,username,phone,email,password_hash,phone_verified_at,district,state,kyc_status)
      VALUES
      ('user-farmer-001','farmer','Gurpreet Singh','gurpreet.singh','9876500001','gurpreet@example.com','$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','2026-08-01 09:00:00+05:30','Ludhiana','Punjab','approved'),
      ('user-farmer-002','farmer','Harpreet Kaur','harpreet.kaur','9876500002','harpreet@example.com','$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','2026-08-01 09:05:00+05:30','Amritsar','Punjab','approved'),
      ('user-farmer-003','farmer','Manpreet Singh','manpreet.singh','9876500003','manpreet@example.com','$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','2026-08-01 09:10:00+05:30','Jalandhar','Punjab','approved'),
      ('user-farmer-004','farmer','Balwinder Singh','balwinder.singh','9876500004','balwinder@example.com','$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','2026-08-01 09:15:00+05:30','Patiala','Punjab','approved'),
      ('user-farmer-005','farmer','Sukhwinder Kaur','sukhwinder.kaur','9876500005','sukhwinder@example.com','$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','2026-08-01 09:20:00+05:30','Sangrur','Punjab','approved'),
      ('user-farmer-006','farmer','Rajinder Singh','rajinder.singh','9876500006','rajinder@example.com','$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','2026-08-01 09:25:00+05:30','Moga','Punjab','approved'),
      ('user-farmer-007','farmer','Jaspreet Singh','jaspreet.singh','9876500007','jaspreet@example.com','$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','2026-08-01 09:30:00+05:30','Bathinda','Punjab','approved'),
      ('user-farmer-008','farmer','Gagandeep Kaur','gagandeep.kaur','9876500008','gagandeep@example.com','$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','2026-08-01 09:35:00+05:30','Ferozepur','Punjab','approved'),
      ('user-farmer-009','farmer','Amarjit Singh','amarjit.singh','9876500009','amarjit@example.com','$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','2026-08-01 09:40:00+05:30','Hoshiarpur','Punjab','approved'),
      ('user-farmer-010','farmer','Simranjit Kaur','simranjit.kaur','9876500010','simranjit@example.com','$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','2026-08-01 09:45:00+05:30','Faridkot','Punjab','approved'),
      ('user-farmer-011','farmer','Davinder Singh','davinder.singh','9876500011','davinder@example.com','$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','2026-08-01 09:50:00+05:30','Mansa','Punjab','approved'),
      ('user-farmer-012','farmer','Kamaljit Singh','kamaljit.singh','9876500012','kamaljit@example.com','$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','2026-08-01 09:55:00+05:30','Tarn Taran','Punjab','pending'),
      ('user-seller-001','seller','Punjab Agro Services','punjab.agro.01','9876500013','agro01@example.com','$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','2026-08-02 10:00:00+05:30','Ludhiana','Punjab','approved'),
      ('user-seller-002','seller','Green Field Machinery','greenfield.machinery','9876500014','greenfield@example.com','$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','2026-08-02 10:05:00+05:30','Jalandhar','Punjab','approved'),
      ('user-seller-003','seller','Kisan Machine Hub','kisan.machine.hub','9876500015','kisanmachine@example.com','$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','2026-08-02 10:10:00+05:30','Patiala','Punjab','approved'),
      ('user-seller-004','seller','Malwa Farm Equipment','malwa.equipment','9876500016','malwa@example.com','$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','2026-08-02 10:15:00+05:30','Bathinda','Punjab','approved'),
      ('user-seller-005','seller','Doaba Biofuel Buyers','doaba.biofuel','9876500017','doaba@example.com','$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','2026-08-02 10:20:00+05:30','Hoshiarpur','Punjab','approved'),
      ('user-seller-006','seller','Majha Crop Solutions','majha.crop','9876500018','majha@example.com','$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','2026-08-02 10:25:00+05:30','Amritsar','Punjab','approved'),
      ('user-seller-007','seller','Satluj Agri Rentals','satluj.rentals','9876500019','satluj@example.com','$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','2026-08-02 10:30:00+05:30','Ferozepur','Punjab','approved'),
      ('user-seller-008','seller','Punjab Straw Energy','punjab.straw.energy','9876500020','strawenergy@example.com','$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','2026-08-02 10:35:00+05:30','Moga','Punjab','approved'),
      ('user-seller-009','seller','Khet Seva Centre','khet.seva','9876500021','khetseva@example.com','$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','2026-08-02 10:40:00+05:30','Sangrur','Punjab','pending'),
      ('user-seller-010','seller','Ravi Agro Traders','ravi.agro','9876500022','raviagro@example.com','$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','2026-08-02 10:45:00+05:30','Faridkot','Punjab','approved'),
      ('user-government-001','government','Punjab Agriculture Officer','gov.agri.01','9876500023','gov01@example.com','$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','2026-08-03 11:00:00+05:30','Ludhiana','Punjab','approved'),
      ('user-government-002','government','District Monitoring Officer','gov.monitor.02','9876500024','gov02@example.com','$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','2026-08-03 11:05:00+05:30','Patiala','Punjab','approved'),
      ('user-government-003','government','Crop Residue Officer','gov.residue.03','9876500025','gov03@example.com','$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','2026-08-03 11:10:00+05:30','Bathinda','Punjab','approved'),
      ('user-government-004','government','Field Enforcement Officer','gov.field.04','9876500026','gov04@example.com','$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','2026-08-03 11:15:00+05:30','Amritsar','Punjab','approved'),
      ('user-admin-001','super_admin','System Administrator','admin.01','9876500027','admin01@example.com','$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','2026-08-03 12:00:00+05:30','Ludhiana','Punjab','approved'),
      ('user-admin-002','super_admin','Database Administrator','admin.02','9876500028','admin02@example.com','$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','2026-08-03 12:05:00+05:30','Jalandhar','Punjab','approved'),
      ('user-admin-003','super_admin','Platform Administrator','admin.03','9876500029','admin03@example.com','$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','2026-08-03 12:10:00+05:30','Patiala','Punjab','approved'),
      ('user-admin-004','super_admin','Operations Administrator','admin.04','9876500030','admin04@example.com','$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','2026-08-03 12:15:00+05:30','Bathinda','Punjab','approved')
      ON CONFLICT (id) DO UPDATE SET
        role = EXCLUDED.role,
        name = EXCLUDED.name,
        username = EXCLUDED.username,
        phone = EXCLUDED.phone,
        email = EXCLUDED.email,
        password_hash = EXCLUDED.password_hash,
        district = EXCLUDED.district,
        state = EXCLUDED.state,
        kyc_status = EXCLUDED.kyc_status;
    `);

    // Ensure Demo Accounts work with standard passwords
    await client.query(`
      UPDATE users SET password_hash = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy' WHERE id IN ('usr_admin_1', 'usr_gov_1', 'user-admin-001', 'user-government-001');
    `);

    // 2. OTP CHALLENGES
    await client.query(`
      CREATE TABLE IF NOT EXISTS otp_challenges (
        id TEXT PRIMARY KEY,
        phone TEXT NOT NULL,
        purpose TEXT NOT NULL CHECK(purpose IN ('signup','password_reset')),
        otp_hash TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        attempt_count INTEGER NOT NULL DEFAULT 0 CHECK(attempt_count BETWEEN 0 AND 3),
        consumed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      
      INSERT INTO otp_challenges
      (id,phone,purpose,otp_hash,expires_at,attempt_count,consumed_at)
      VALUES
      ('otp-001','9876500001','signup','hash_otp_001','2026-08-22 09:05:00+05:30',0,'2026-08-22 09:02:00+05:30'),
      ('otp-002','9876500002','signup','hash_otp_002','2026-08-22 09:10:00+05:30',1,'2026-08-22 09:07:00+05:30'),
      ('otp-003','9876500003','password_reset','hash_otp_003','2026-08-22 09:15:00+05:30',0,'2026-08-22 09:12:00+05:30'),
      ('otp-004','9876500004','signup','hash_otp_004','2026-08-22 09:20:00+05:30',0,'2026-08-22 09:17:00+05:30'),
      ('otp-005','9876500005','password_reset','hash_otp_005','2026-08-22 09:25:00+05:30',2,'2026-08-22 09:23:00+05:30'),
      ('otp-006','9876500006','signup','hash_otp_006','2026-08-22 09:30:00+05:30',0,'2026-08-22 09:27:00+05:30'),
      ('otp-007','9876500007','signup','hash_otp_007','2026-08-22 09:35:00+05:30',1,'2026-08-22 09:32:00+05:30'),
      ('otp-008','9876500008','password_reset','hash_otp_008','2026-08-22 09:40:00+05:30',0,'2026-08-22 09:37:00+05:30'),
      ('otp-009','9876500009','signup','hash_otp_009','2026-08-22 09:45:00+05:30',0,'2026-08-22 09:42:00+05:30'),
      ('otp-010','9876500010','signup','hash_otp_010','2026-08-22 09:50:00+05:30',1,'2026-08-22 09:47:00+05:30'),
      ('otp-011','9876500011','password_reset','hash_otp_011','2026-08-22 09:55:00+05:30',0,'2026-08-22 09:52:00+05:30'),
      ('otp-012','9876500012','signup','hash_otp_012','2026-08-22 10:00:00+05:30',0,'2026-08-22 09:57:00+05:30'),
      ('otp-013','9876500013','signup','hash_otp_013','2026-08-22 10:05:00+05:30',2,'2026-08-22 10:02:00+05:30'),
      ('otp-014','9876500014','password_reset','hash_otp_014','2026-08-22 10:10:00+05:30',0,'2026-08-22 10:07:00+05:30'),
      ('otp-015','9876500015','signup','hash_otp_015','2026-08-22 10:15:00+05:30',1,'2026-08-22 10:12:00+05:30'),
      ('otp-016','9876500016','signup','hash_otp_016','2026-08-22 10:20:00+05:30',0,'2026-08-22 10:17:00+05:30'),
      ('otp-017','9876500017','password_reset','hash_otp_017','2026-08-22 10:25:00+05:30',0,'2026-08-22 10:22:00+05:30'),
      ('otp-018','9876500018','signup','hash_otp_018','2026-08-22 10:30:00+05:30',1,'2026-08-22 10:27:00+05:30'),
      ('otp-019','9876500019','signup','hash_otp_019','2026-08-22 10:35:00+05:30',0,'2026-08-22 10:32:00+05:30'),
      ('otp-020','9876500020','password_reset','hash_otp_020','2026-08-22 10:40:00+05:30',2,'2026-08-22 10:37:00+05:30')
      ON CONFLICT (id) DO NOTHING;
    `);

    // 3. FARMS
    await client.query(`
      CREATE TABLE IF NOT EXISTS farms (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        crop_type TEXT NOT NULL,
        by_product TEXT NOT NULL,
        area_acres REAL NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        address TEXT NOT NULL,
        harvest_date DATE NOT NULL,
        next_sowing_date DATE NOT NULL,
        budget_amount REAL NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE farms ADD COLUMN IF NOT EXISTS by_product TEXT NOT NULL DEFAULT 'Rice straw';
      ALTER TABLE farms ADD COLUMN IF NOT EXISTS budget_amount REAL NOT NULL DEFAULT 0;

      INSERT INTO farms
      (id,user_id,name,crop_type,by_product,area_acres,latitude,longitude,address,harvest_date,next_sowing_date,budget_amount)
      VALUES
      ('farm-001','user-farmer-001','Randhir Rice Farm','Paddy (Rice)','Rice straw',12.5,30.9010,75.8573,'Ludhiana District, Punjab','2026-10-15','2026-11-10',65000),
      ('farm-002','user-farmer-002','Greenfield Agriculture','Wheat','Wheat straw',18.0,31.3260,75.5762,'Jalandhar District, Punjab','2026-04-20','2026-10-25',72000),
      ('farm-003','user-farmer-003','Harpreet Farm','Maize','Corn stalks',14.0,30.3398,76.3869,'Patiala District, Punjab','2026-09-25','2026-10-20',58000),
      ('farm-004','user-farmer-004','Gurpreet Fields','Cotton','Cotton stalks',20.0,30.2110,74.9455,'Bathinda District, Punjab','2026-11-05','2026-12-01',85000),
      ('farm-005','user-farmer-005','Satluj Kisan Farm','Mustard','Mustard husk',16.5,30.2458,74.7550,'Moga District, Punjab','2027-03-10','2027-10-20',60000),
      ('farm-006','user-farmer-006','Canal View Farm','Sugarcane','Sugarcane leaves',22.0,31.6340,74.8723,'Amritsar District, Punjab','2027-02-15','2027-03-10',95000),
      ('farm-007','user-farmer-007','Malwa Heritage Farm','Bajra','Bajra stalks',11.0,30.1575,74.1915,'Ferozepur District, Punjab','2026-10-05','2026-10-25',48000),
      ('farm-008','user-farmer-008','Doaba Farm','Barley','Barley straw',13.5,31.5143,75.9115,'Hoshiarpur District, Punjab','2027-04-15','2027-10-20',55000),
      ('farm-009','user-farmer-009','Golden Fields','Soybean','Soybean stalks',17.0,30.6765,74.7583,'Faridkot District, Punjab','2026-10-10','2026-10-25',69000),
      ('farm-010','user-farmer-010','Kisan Heritage','Paddy (Rice)','Rice straw',21.0,30.1660,74.5430,'Mansa District, Punjab','2026-10-18','2026-11-12',78000),
      ('farm-011','user-farmer-011','Punjab Organic Farm','Potato','Potato vines',9.5,31.4515,75.2998,'Kapurthala District, Punjab','2027-01-20','2027-02-15',42000),
      ('farm-012','user-farmer-012','Ravi Valley Farm','Chickpea','Chickpea straw',15.0,31.1471,74.8723,'Tarn Taran District, Punjab','2027-03-20','2027-10-25',51000),
      ('farm-013','user-farmer-001','Model Agriculture Farm','Lentil','Lentil straw',10.0,30.7500,76.7800,'Mohali District, Punjab','2027-03-25','2027-10-20',46000),
      ('farm-014','user-farmer-002','Khet Pragati Farm','Groundnut','Groundnut haulms',8.5,30.3380,76.4000,'Patiala District, Punjab','2026-10-30','2027-06-15',39000),
      ('farm-015','user-farmer-003','Green Harvest Farm','Sunflower','Sunflower stalks',12.0,31.3200,75.5800,'Jalandhar District, Punjab','2026-09-30','2026-10-25',52000),
      ('farm-016','user-farmer-004','Sustainable Fields','Sesame','Sesame stalks',7.5,30.2100,74.9500,'Bathinda District, Punjab','2026-10-10','2026-10-30',35000),
      ('farm-017','user-farmer-005','Basant Heritage Farm','Sorghum','Sorghum stalks',19.0,30.9000,75.8500,'Ludhiana District, Punjab','2026-10-15','2026-11-05',70000),
      ('farm-018','user-farmer-006','Doaba Green Farm','Turmeric','Turmeric leaves',6.5,31.5100,75.9100,'Hoshiarpur District, Punjab','2027-02-05','2027-03-01',38000),
      ('farm-019','user-farmer-007','Prosperity Farm','Tomato','Tomato vines',5.0,31.6300,74.8700,'Amritsar District, Punjab','2026-12-20','2027-01-20',32000),
      ('farm-020','user-farmer-008','Healthy Soil Farm','Onion','Onion tops',8.0,30.3400,76.3900,'Patiala District, Punjab','2027-01-10','2027-02-10',41000)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        crop_type = EXCLUDED.crop_type,
        by_product = EXCLUDED.by_product,
        area_acres = EXCLUDED.area_acres,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        address = EXCLUDED.address,
        harvest_date = EXCLUDED.harvest_date,
        next_sowing_date = EXCLUDED.next_sowing_date,
        budget_amount = EXCLUDED.budget_amount;
    `);

    // 4. SELLERS
    await client.query(`
      CREATE TABLE IF NOT EXISTS sellers (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        type TEXT NOT NULL DEFAULT 'machinery_rental' CHECK(type IN ('machinery_rental','biofuel_buyer')),
        business_name TEXT NOT NULL,
        contact_person TEXT NOT NULL DEFAULT '',
        phone TEXT NOT NULL,
        email TEXT DEFAULT '',
        address TEXT NOT NULL,
        district TEXT NOT NULL DEFAULT 'Ludhiana',
        state TEXT NOT NULL DEFAULT 'Punjab',
        latitude REAL NOT NULL DEFAULT 30.9010,
        longitude REAL NOT NULL DEFAULT 75.8573,
        service_radius_km REAL NOT NULL DEFAULT 50,
        kyc_status TEXT NOT NULL DEFAULT 'pending' CHECK(kyc_status IN ('pending','approved','rejected')),
        kyc_document_url TEXT DEFAULT '',
        rating REAL NOT NULL DEFAULT 5.0,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        seller_type TEXT,
        aadhar_no TEXT,
        pan_no TEXT,
        gst_no TEXT,
        udyam_no TEXT,
        aadhar_doc_url TEXT,
        pan_doc_url TEXT,
        gst_doc_url TEXT,
        udyam_doc_url TEXT,
        kyc_ai_result JSONB
      );
      ALTER TABLE sellers ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'machinery_rental';
      ALTER TABLE sellers ADD COLUMN IF NOT EXISTS seller_type TEXT;
      ALTER TABLE sellers ADD COLUMN IF NOT EXISTS contact_person TEXT NOT NULL DEFAULT '';
      ALTER TABLE sellers ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';
      ALTER TABLE sellers ADD COLUMN IF NOT EXISTS district TEXT NOT NULL DEFAULT 'Ludhiana';
      ALTER TABLE sellers ADD COLUMN IF NOT EXISTS state TEXT NOT NULL DEFAULT 'Punjab';
      ALTER TABLE sellers ADD COLUMN IF NOT EXISTS latitude REAL NOT NULL DEFAULT 30.9010;
      ALTER TABLE sellers ADD COLUMN IF NOT EXISTS longitude REAL NOT NULL DEFAULT 75.8573;
      ALTER TABLE sellers ADD COLUMN IF NOT EXISTS service_radius_km REAL NOT NULL DEFAULT 50;
      ALTER TABLE sellers ADD COLUMN IF NOT EXISTS kyc_document_url TEXT DEFAULT '';
      ALTER TABLE sellers ADD COLUMN IF NOT EXISTS rating REAL NOT NULL DEFAULT 5.0;
      ALTER TABLE sellers ADD COLUMN IF NOT EXISTS is_active INTEGER NOT NULL DEFAULT 1;
      ALTER TABLE sellers ADD COLUMN IF NOT EXISTS aadhar_no TEXT;
      ALTER TABLE sellers ADD COLUMN IF NOT EXISTS pan_no TEXT;
      ALTER TABLE sellers ADD COLUMN IF NOT EXISTS gst_no TEXT;
      ALTER TABLE sellers ADD COLUMN IF NOT EXISTS udyam_no TEXT;
      ALTER TABLE sellers ADD COLUMN IF NOT EXISTS aadhar_doc_url TEXT;
      ALTER TABLE sellers ADD COLUMN IF NOT EXISTS pan_doc_url TEXT;
      ALTER TABLE sellers ADD COLUMN IF NOT EXISTS gst_doc_url TEXT;
      ALTER TABLE sellers ADD COLUMN IF NOT EXISTS udyam_doc_url TEXT;
      ALTER TABLE sellers ADD COLUMN IF NOT EXISTS kyc_ai_result JSONB;

      INSERT INTO sellers
      (id,user_id,type,business_name,contact_person,phone,email,address,district,state,latitude,longitude,service_radius_km,kyc_status,kyc_document_url,rating,is_active)
      VALUES
      ('seller-001','user-seller-001','machinery_rental','Punjab Agro Services','Ravinder Singh','9876510001','seller01@example.com','Industrial Area, Ludhiana','Ludhiana','Punjab',30.9010,75.8573,60,'approved','https://example.com/kyc/seller-001',4.8,1),
      ('seller-002','user-seller-002','machinery_rental','Green Field Machinery','Amanpreet Singh','9876510002','seller02@example.com','GT Road, Jalandhar','Jalandhar','Punjab',31.3260,75.5762,50,'approved','https://example.com/kyc/seller-002',4.7,1),
      ('seller-003','user-seller-003','machinery_rental','Kisan Machine Hub','Gurkirat Singh','9876510003','seller03@example.com','Patiala Bypass, Patiala','Patiala','Punjab',30.3398,76.3869,55,'approved','https://example.com/kyc/seller-003',4.6,1),
      ('seller-004','user-seller-004','machinery_rental','Malwa Farm Equipment','Jatinder Singh','9876510004','seller04@example.com','Bathinda Road, Bathinda','Bathinda','Punjab',30.2110,74.9455,65,'approved','https://example.com/kyc/seller-004',4.5,1),
      ('seller-005','user-seller-005','biofuel_buyer','Doaba Biofuel Buyers','Navdeep Kaur','9876510005','seller05@example.com','Industrial Estate, Hoshiarpur','Hoshiarpur','Punjab',31.5143,75.9115,80,'approved','https://example.com/kyc/seller-005',4.9,1),
      ('seller-006','user-seller-006','machinery_rental','Majha Crop Solutions','Sandeep Singh','9876510006','seller06@example.com','Airport Road, Amritsar','Amritsar','Punjab',31.6340,74.8723,70,'approved','https://example.com/kyc/seller-006',4.4,1),
      ('seller-007','user-seller-007','machinery_rental','Satluj Agri Rentals','Manjot Singh','9876510007','seller07@example.com','Ferozepur Road, Ferozepur','Ferozepur','Punjab',30.1575,74.1915,55,'approved','https://example.com/kyc/seller-007',4.6,1),
      ('seller-008','user-seller-008','biofuel_buyer','Punjab Straw Energy','Harshdeep Singh','9876510008','seller08@example.com','Moga Industrial Area, Moga','Moga','Punjab',30.2458,74.7550,90,'approved','https://example.com/kyc/seller-008',4.8,1),
      ('seller-009','user-seller-009','machinery_rental','Khet Seva Centre','Balraj Singh','9876510009','seller09@example.com','Sangrur Road, Sangrur','Sangrur','Punjab',30.2458,75.8420,50,'pending','https://example.com/kyc/seller-009',4.2,1),
      ('seller-010','user-seller-010','biofuel_buyer','Ravi Agro Traders','Deepak Kumar','9876510010','seller10@example.com','Grain Market, Faridkot','Faridkot','Punjab',30.6765,74.7583,75,'approved','https://example.com/kyc/seller-010',4.7,1),
      ('seller-011','user-seller-001','machinery_rental','Ludhiana Seeder Point','Ramanjit Singh','9876510011','seller11@example.com','Focal Point, Ludhiana','Ludhiana','Punjab',30.9050,75.8650,45,'approved','https://example.com/kyc/seller-011',4.5,1),
      ('seller-012','user-seller-002','machinery_rental','Jalandhar Agri Machines','Gurman Singh','9876510012','seller12@example.com','Nakodar Road, Jalandhar','Jalandhar','Punjab',31.3150,75.5900,50,'approved','https://example.com/kyc/seller-012',4.6,1),
      ('seller-013','user-seller-003','biofuel_buyer','Patiala Biomass Works','Rohit Sharma','9876510013','seller13@example.com','Rajpura Road, Patiala','Patiala','Punjab',30.3500,76.4000,85,'approved','https://example.com/kyc/seller-013',4.7,1),
      ('seller-014','user-seller-004','machinery_rental','Bathinda Farm Machines','Kuldeep Singh','9876510014','seller14@example.com','Mansa Road, Bathinda','Bathinda','Punjab',30.2200,74.9600,55,'approved','https://example.com/kyc/seller-014',4.3,1),
      ('seller-015','user-seller-005','biofuel_buyer','Hoshiarpur Green Energy','Vikram Singh','9876510015','seller15@example.com','Dasuya Road, Hoshiarpur','Hoshiarpur','Punjab',31.5250,75.9200,100,'approved','https://example.com/kyc/seller-015',4.9,1),
      ('seller-016','user-seller-006','machinery_rental','Amritsar Kisan Machinery','Mandeep Singh','9876510016','seller16@example.com','Tarn Taran Road, Amritsar','Amritsar','Punjab',31.6200,74.8850,60,'approved','https://example.com/kyc/seller-016',4.4,1),
      ('seller-017','user-seller-007','machinery_rental','Ferozepur Agri Rentals','Sukhchain Singh','9876510017','seller17@example.com','Muktsar Road, Ferozepur','Ferozepur','Punjab',30.1650,74.2050,60,'approved','https://example.com/kyc/seller-017',4.5,1),
      ('seller-018','user-seller-008','biofuel_buyer','Malwa Biomass Energy','Gurdeep Singh','9876510018','seller18@example.com','Industrial Area, Moga','Moga','Punjab',30.2550,74.7650,95,'approved','https://example.com/kyc/seller-018',4.8,1),
      ('seller-019','user-seller-009','machinery_rental','Sangrur Farm Hub','Amritpal Singh','9876510019','seller19@example.com','Barnala Road, Sangrur','Sangrur','Punjab',30.2500,75.8500,50,'pending','https://example.com/kyc/seller-019',4.1,1),
      ('seller-020','user-seller-010','biofuel_buyer','Faridkot Straw Traders','Karan Singh','9876510020','seller20@example.com','Muktsar Road, Faridkot','Faridkot','Punjab',30.6850,74.7650,80,'approved','https://example.com/kyc/seller-020',4.6,1)
      ON CONFLICT (id) DO UPDATE SET
        type = EXCLUDED.type,
        business_name = EXCLUDED.business_name,
        contact_person = EXCLUDED.contact_person,
        phone = EXCLUDED.phone,
        email = EXCLUDED.email,
        address = EXCLUDED.address,
        district = EXCLUDED.district,
        state = EXCLUDED.state,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        service_radius_km = EXCLUDED.service_radius_km,
        kyc_status = EXCLUDED.kyc_status,
        kyc_document_url = EXCLUDED.kyc_document_url,
        rating = EXCLUDED.rating,
        is_active = EXCLUDED.is_active;
    `);

    // 5. MACHINERY LISTINGS
    await client.query(`
      CREATE TABLE IF NOT EXISTS machinery_listings (
        id TEXT PRIMARY KEY,
        seller_id TEXT NOT NULL REFERENCES sellers(id),
        machine_type TEXT NOT NULL CHECK(machine_type IN ('super_seeder','happy_seeder','baler','paddy_straw_chopper','zero_till_drill')),
        model_name TEXT NOT NULL,
        daily_rate REAL NOT NULL,
        hourly_rate REAL NOT NULL,
        available_units INTEGER NOT NULL,
        current_availability_status TEXT NOT NULL CHECK(current_availability_status IN ('available','busy','maintenance')),
        coverage_acres_per_day REAL NOT NULL,
        description TEXT NOT NULL,
        location TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      INSERT INTO machinery_listings
      (id,seller_id,machine_type,model_name,daily_rate,hourly_rate,available_units,current_availability_status,coverage_acres_per_day,description,location)
      VALUES
      ('machine-001','seller-001','super_seeder','John Deere Super Seeder 11-Tine',7500,1100,2,'available',15,'Used for direct sowing after paddy harvest','Ludhiana, Punjab'),
      ('machine-002','seller-002','happy_seeder','Happy Seeder 9-Tine',6500,950,1,'available',12,'Direct wheat sowing without burning residue','Jalandhar, Punjab'),
      ('machine-003','seller-003','baler','Fieldking Straw Baler',5800,850,2,'available',18,'Collects loose paddy straw for biomass use','Patiala, Punjab'),
      ('machine-004','seller-004','paddy_straw_chopper','Dasmesh Straw Chopper',4200,650,3,'available',12,'Chops paddy straw into manageable residue','Bathinda, Punjab'),
      ('machine-005','seller-006','zero_till_drill','Beri Zero Till Drill 9-Tine',5200,780,2,'available',12,'Used for sowing crops with minimum soil disturbance','Amritsar, Punjab'),
      ('machine-006','seller-007','super_seeder','New Holland Super Seeder 10-Tine',7800,1150,1,'busy',15,'Super Seeder for residue management','Ferozepur, Punjab'),
      ('machine-007','seller-009','happy_seeder','Kartar Happy Seeder 9-Tine',6200,900,2,'available',11,'Suitable for direct wheat sowing','Sangrur, Punjab'),
      ('machine-008','seller-011','baler','Mahindra Round Baler',6000,880,1,'available',20,'High-capacity baler for straw collection','Ludhiana, Punjab'),
      ('machine-009','seller-012','zero_till_drill','Fieldking Zero Till Drill',5000,750,2,'available',13,'Zero till drill for wheat and pulses','Jalandhar, Punjab'),
      ('machine-010','seller-014','paddy_straw_chopper','New India Straw Chopper',4500,680,2,'maintenance',14,'Heavy-duty machine for paddy residue','Bathinda, Punjab'),
      ('machine-011','seller-016','super_seeder','Balkar Super Seeder 11-Tine',7600,1100,2,'available',16,'Efficient residue incorporation and sowing','Amritsar, Punjab'),
      ('machine-012','seller-017','happy_seeder','Dashmesh Happy Seeder',6400,930,1,'available',12,'Low-residue direct seeding machine','Ferozepur, Punjab'),
      ('machine-013','seller-019','baler','New Holland Mini Baler',5700,820,2,'available',17,'Compact straw baler for medium farms','Sangrur, Punjab'),
      ('machine-014','seller-003','zero_till_drill','Khedut Zero Till Drill',5100,760,2,'available',12,'Suitable for wheat and chickpea sowing','Patiala, Punjab'),
      ('machine-015','seller-005','super_seeder','Punjab Straw Super Seeder',7300,1050,1,'available',15,'Residue management machine for large farms','Hoshiarpur, Punjab'),
      ('machine-016','seller-008','baler','Malwa High Capacity Baler',6100,900,2,'available',19,'High-capacity baler for biomass collection','Moga, Punjab'),
      ('machine-017','seller-013','paddy_straw_chopper','Patiala Biomass Chopper',4300,640,2,'available',13,'Chops and prepares straw for collection','Patiala, Punjab'),
      ('machine-018','seller-015','happy_seeder','Green Earth Happy Seeder',6300,920,2,'available',12,'Direct seeding machine for residue fields','Hoshiarpur, Punjab'),
      ('machine-019','seller-018','baler','Malwa Straw Baler Pro',5900,860,1,'available',18,'Bales straw for biomass transportation','Moga, Punjab'),
      ('machine-020','seller-020','zero_till_drill','Ravi Zero Till Drill',4950,720,2,'available',13,'Minimum-tillage drill for wheat and pulses','Faridkot, Punjab')
      ON CONFLICT (id) DO UPDATE SET
        seller_id = EXCLUDED.seller_id,
        machine_type = EXCLUDED.machine_type,
        model_name = EXCLUDED.model_name,
        daily_rate = EXCLUDED.daily_rate,
        hourly_rate = EXCLUDED.hourly_rate,
        available_units = EXCLUDED.available_units,
        current_availability_status = EXCLUDED.current_availability_status,
        coverage_acres_per_day = EXCLUDED.coverage_acres_per_day,
        description = EXCLUDED.description,
        location = EXCLUDED.location;
    `);

    // 6. RESIDUE BUYER OFFERS
    await client.query(`
      CREATE TABLE IF NOT EXISTS residue_buyer_offers (
        id TEXT PRIMARY KEY,
        seller_id TEXT NOT NULL REFERENCES sellers(id),
        offered_price_per_ton REAL NOT NULL,
        required_tons REAL NOT NULL,
        residue_type TEXT NOT NULL CHECK(residue_type IN ('paddy_straw','basmati_straw','mustard_husk')),
        pickup_provided INTEGER NOT NULL,
        min_order_tons REAL NOT NULL,
        description TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      INSERT INTO residue_buyer_offers
      (id,seller_id,offered_price_per_ton,required_tons,residue_type,pickup_provided,min_order_tons,description)
      VALUES
      ('offer-001','seller-005',2800,500,'paddy_straw',1,5,'Biomass plant buying baled paddy straw from Ludhiana region'),
      ('offer-002','seller-008',3000,700,'paddy_straw',1,8,'Large-volume straw purchase for bioenergy production'),
      ('offer-003','seller-010',2600,350,'paddy_straw',1,5,'Regional straw collection and trading program'),
      ('offer-004','seller-013',2900,450,'paddy_straw',1,10,'Industrial biomass requirement from Patiala belt'),
      ('offer-005','seller-015',3100,800,'paddy_straw',1,10,'Green energy plant accepting clean baled straw'),
      ('offer-006','seller-018',2950,650,'paddy_straw',1,8,'Malwa biomass procurement program'),
      ('offer-007','seller-020',2700,400,'paddy_straw',1,5,'Straw procurement for pellet manufacturing'),
      ('offer-008','seller-005',3200,250,'basmati_straw',1,5,'Premium basmati residue procurement'),
      ('offer-009','seller-008',3150,300,'basmati_straw',1,5,'Basmati straw for biomass processing'),
      ('offer-010','seller-010',2750,500,'paddy_straw',1,10,'Bulk residue buying program'),
      ('offer-011','seller-013',2850,550,'paddy_straw',1,10,'Patiala biomass requirement'),
      ('offer-012','seller-015',3050,600,'basmati_straw',1,8,'Basmati residue for industrial processing'),
      ('offer-013','seller-018',2900,750,'paddy_straw',1,10,'High-volume Malwa residue purchase'),
      ('offer-014','seller-020',2650,450,'paddy_straw',1,5,'Faridkot straw collection network'),
      ('offer-015','seller-005',1800,200,'mustard_husk',1,5,'Mustard husk requirement for biomass fuel'),
      ('offer-016','seller-008',1900,300,'mustard_husk',1,5,'Mustard residue for pellet production'),
      ('offer-017','seller-010',1750,250,'mustard_husk',1,5,'Regional mustard husk purchase'),
      ('offer-018','seller-013',1850,350,'mustard_husk',1,8,'Industrial mustard husk procurement'),
      ('offer-019','seller-015',1950,400,'mustard_husk',1,10,'Green energy mustard residue purchase'),
      ('offer-020','seller-018',1880,500,'mustard_husk',1,10,'Malwa biomass mustard husk requirement')
      ON CONFLICT (id) DO UPDATE SET
        seller_id = EXCLUDED.seller_id,
        offered_price_per_ton = EXCLUDED.offered_price_per_ton,
        required_tons = EXCLUDED.required_tons,
        residue_type = EXCLUDED.residue_type,
        pickup_provided = EXCLUDED.pickup_provided,
        min_order_tons = EXCLUDED.min_order_tons,
        description = EXCLUDED.description;
    `);

    // 7. RECOMMENDATION RUNS
    await client.query(`
      CREATE TABLE IF NOT EXISTS recommendation_runs (
        id TEXT PRIMARY KEY,
        farm_id TEXT NOT NULL REFERENCES farms(id),
        recommended_strategy TEXT NOT NULL CHECK(recommended_strategy IN ('rent_super_seeder','sell_to_buyer','rent_happy_seeder','custom')),
        estimated_cost REAL NOT NULL,
        estimated_revenue REAL NOT NULL,
        net_benefit REAL NOT NULL,
        confidence_score REAL NOT NULL,
        explanation TEXT NOT NULL,
        algorithm_version TEXT NOT NULL DEFAULT 'v1.0',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      INSERT INTO recommendation_runs
      (id,farm_id,recommended_strategy,estimated_cost,estimated_revenue,net_benefit,confidence_score,explanation)
      VALUES
      ('rec-001','farm-001','rent_super_seeder',75000,0,-75000,0.94,'Super Seeder reduces residue burning risk and allows timely wheat sowing.'),
      ('rec-002','farm-002','sell_to_buyer',0,50400,50400,0.91,'Wheat straw has a viable local biomass market.'),
      ('rec-003','farm-003','rent_happy_seeder',42000,0,-42000,0.88,'Direct seeding reduces residue handling and soil disturbance.'),
      ('rec-004','farm-004','sell_to_buyer',0,38000,38000,0.86,'Cotton stalks can be collected for biomass applications.'),
      ('rec-005','farm-005','sell_to_buyer',0,31500,31500,0.90,'Mustard residue can be sold instead of burned.'),
      ('rec-006','farm-006','custom',52000,12000,-40000,0.82,'Integrated residue collection is recommended for this larger farm.'),
      ('rec-007','farm-007','rent_super_seeder',66000,0,-66000,0.85,'Super Seeder is suitable for residue-heavy fields.'),
      ('rec-008','farm-008','rent_happy_seeder',39000,0,-39000,0.84,'Happy Seeder provides timely direct sowing after cereal harvest.'),
      ('rec-009','farm-009','sell_to_buyer',0,42500,42500,0.79,'Soybean residue has collection value where buyers are available.'),
      ('rec-010','farm-010','rent_super_seeder',82000,0,-82000,0.95,'Paddy residue volume makes mechanized management preferable.'),
      ('rec-011','farm-011','custom',24000,8500,-15500,0.75,'Vegetable residue should be composted or locally processed.'),
      ('rec-012','farm-012','sell_to_buyer',0,25500,25500,0.81,'Chickpea straw can be collected and sold as biomass.'),
      ('rec-013','farm-013','sell_to_buyer',0,17000,17000,0.77,'Lentil straw has secondary biomass value.'),
      ('rec-014','farm-014','custom',18000,7000,-11000,0.73,'Groundnut haulms are better reused than burned.'),
      ('rec-015','farm-015','sell_to_buyer',0,21000,21000,0.80,'Sunflower stalks can be collected for biomass use.'),
      ('rec-016','farm-016','custom',16000,5000,-11000,0.72,'Sesame stalks can be composted or processed.'),
      ('rec-017','farm-017','rent_happy_seeder',55000,0,-55000,0.83,'Direct sowing is preferred for residue-heavy cereal fields.'),
      ('rec-018','farm-018','custom',15000,4500,-10500,0.70,'Turmeric leaves should be composted or mulched.'),
      ('rec-019','farm-019','custom',12000,3500,-8500,0.68,'Vegetable residue can be composted instead of burned.'),
      ('rec-020','farm-020','custom',14000,4000,-10000,0.71,'Onion tops are suitable for composting and soil amendment.')
      ON CONFLICT (id) DO UPDATE SET
        farm_id = EXCLUDED.farm_id,
        recommended_strategy = EXCLUDED.recommended_strategy,
        estimated_cost = EXCLUDED.estimated_cost,
        estimated_revenue = EXCLUDED.estimated_revenue,
        net_benefit = EXCLUDED.net_benefit,
        confidence_score = EXCLUDED.confidence_score,
        explanation = EXCLUDED.explanation;
    `);

    // 8. BOOKINGS
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        farm_id TEXT NOT NULL REFERENCES farms(id),
        seller_id TEXT NOT NULL REFERENCES sellers(id),
        listing_id TEXT NOT NULL,
        booking_type TEXT NOT NULL CHECK(booking_type IN ('machinery','residue_sale')),
        status TEXT NOT NULL CHECK(status IN ('pending','confirmed','in_progress','completed','cancelled')),
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        total_cost REAL NOT NULL,
        total_revenue REAL NOT NULL,
        acres_booked REAL NOT NULL,
        tons_booked REAL NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        farmer_id TEXT,
        machine_id TEXT,
        booking_date DATE,
        acres REAL,
        total_price REAL,
        notes TEXT
      );
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS seller_id TEXT;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS listing_id TEXT DEFAULT '';
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_type TEXT DEFAULT 'machinery';
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS end_date DATE DEFAULT CURRENT_DATE;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_cost REAL DEFAULT 0;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_revenue REAL DEFAULT 0;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS acres_booked REAL DEFAULT 0;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS tons_booked REAL DEFAULT 0;

      INSERT INTO bookings
      (id,farm_id,seller_id,listing_id,booking_type,status,start_date,end_date,total_cost,total_revenue,acres_booked,tons_booked)
      VALUES
      ('booking-001','farm-001','seller-001','machine-001','machinery','confirmed','2026-10-18','2026-10-19',15000,0,12.5,0),
      ('booking-002','farm-002','seller-002','machine-002','machinery','pending','2026-10-22','2026-10-23',13000,0,18,0),
      ('booking-003','farm-003','seller-003','offer-003','residue_sale','confirmed','2026-09-26','2026-09-28',0,36400,14,14),
      ('booking-004','farm-004','seller-004','offer-004','residue_sale','pending','2026-11-06','2026-11-08',0,52000,20,20),
      ('booking-005','farm-005','seller-007','machine-006','machinery','completed','2026-10-08','2026-10-09',15600,0,16.5,0),
      ('booking-006','farm-006','seller-005','offer-001','residue_sale','confirmed','2027-02-16','2027-02-20',0,56000,22,20),
      ('booking-007','farm-007','seller-007','machine-006','machinery','in_progress','2026-10-06','2026-10-07',15600,0,11,0),
      ('booking-008','farm-008','seller-007','machine-007','machinery','confirmed','2027-04-16','2027-04-17',12400,0,13.5,0),
      ('booking-009','farm-009','seller-008','offer-002','residue_sale','completed','2026-10-11','2026-10-13',0,51000,17,17),
      ('booking-010','farm-010','seller-001','machine-001','machinery','confirmed','2026-10-19','2026-10-21',22500,0,21,0),
      ('booking-011','farm-011','seller-009','machine-013','machinery','pending','2027-01-21','2027-01-22',11400,0,9.5,0),
      ('booking-012','farm-012','seller-010','offer-010','residue_sale','confirmed','2027-03-21','2027-03-23',0,41250,15,15),
      ('booking-013','farm-013','seller-013','offer-011','residue_sale','completed','2027-03-26','2027-03-28',0,28500,10,10),
      ('booking-014','farm-014','seller-014','machine-014','machinery','cancelled','2026-10-31','2026-11-01',0,0,8.5,0),
      ('booking-015','farm-015','seller-015','offer-012','residue_sale','confirmed','2026-10-01','2026-10-03',0,31500,12,10),
      ('booking-016','farm-016','seller-013','offer-017','residue_sale','pending','2026-10-11','2026-10-12',0,13875,7.5,7.5),
      ('booking-017','farm-017','seller-018','offer-013','residue_sale','confirmed','2026-10-16','2026-10-18',0,55100,19,19),
      ('booking-018','farm-018','seller-015','offer-015','residue_sale','completed','2027-02-06','2027-02-08',0,11700,6.5,6),
      ('booking-019','farm-019','seller-011','machine-011','machinery','completed','2026-12-21','2026-12-22',7600,0,5,0),
      ('booking-020','farm-020','seller-012','machine-009','machinery','confirmed','2027-01-11','2027-01-12',10000,0,8,0)
      ON CONFLICT (id) DO UPDATE SET
        farm_id = EXCLUDED.farm_id,
        seller_id = EXCLUDED.seller_id,
        listing_id = EXCLUDED.listing_id,
        booking_type = EXCLUDED.booking_type,
        status = EXCLUDED.status,
        start_date = EXCLUDED.start_date,
        end_date = EXCLUDED.end_date,
        total_cost = EXCLUDED.total_cost,
        total_revenue = EXCLUDED.total_revenue,
        acres_booked = EXCLUDED.acres_booked,
        tons_booked = EXCLUDED.tons_booked;
    `);

    // 9. INCIDENTS
    await client.query(`
      CREATE TABLE IF NOT EXISTS incidents (
        id TEXT PRIMARY KEY,
        farm_id TEXT REFERENCES farms(id),
        district TEXT NOT NULL,
        state TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        incident_date DATE NOT NULL,
        fire_radiative_power REAL NOT NULL,
        satellite_source TEXT NOT NULL CHECK(satellite_source IN ('VIIRS','MODIS','GROUND_REPORT')),
        severity TEXT NOT NULL CHECK(severity IN ('low','medium','high','critical')),
        repeat_offender_flag INTEGER NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('open','under_investigation','resolved','action_taken')),
        officer_action TEXT NOT NULL,
        officer_notes TEXT NOT NULL,
        resolved_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        detected_at TIMESTAMP
      );
      ALTER TABLE incidents ADD COLUMN IF NOT EXISTS state TEXT NOT NULL DEFAULT 'Punjab';
      ALTER TABLE incidents ADD COLUMN IF NOT EXISTS incident_date DATE NOT NULL DEFAULT CURRENT_DATE;
      ALTER TABLE incidents ADD COLUMN IF NOT EXISTS fire_radiative_power REAL NOT NULL DEFAULT 25.0;
      ALTER TABLE incidents ADD COLUMN IF NOT EXISTS officer_action TEXT DEFAULT '';
      ALTER TABLE incidents ADD COLUMN IF NOT EXISTS detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

      INSERT INTO incidents
      (id,farm_id,district,state,latitude,longitude,incident_date,fire_radiative_power,satellite_source,severity,repeat_offender_flag,status,officer_action,officer_notes,resolved_at,detected_at)
      VALUES
      ('incident-001','farm-001','Ludhiana','Punjab',30.9010,75.8573,'2026-10-20',42.5,'VIIRS','high',1,'action_taken','Field team dispatched','Repeat residue burning detected near paddy fields.','2026-10-20 16:30:00+05:30','2026-10-20 16:30:00+05:30'),
      ('incident-002','farm-002','Jalandhar','Punjab',31.3260,75.5762,'2026-10-21',28.4,'VIIRS','medium',0,'resolved','Farmer contacted','First reported incident; advisory issued.','2026-10-21 18:00:00+05:30','2026-10-21 18:00:00+05:30'),
      ('incident-003','farm-003','Patiala','Punjab',30.3398,76.3869,'2026-10-02',55.7,'MODIS','critical',1,'action_taken','Penalty notice issued','Large thermal anomaly confirmed.','2026-10-03 12:00:00+05:30','2026-10-03 12:00:00+05:30'),
      ('incident-004','farm-004','Bathinda','Punjab',30.2110,74.9455,'2026-11-08',34.2,'VIIRS','high',0,'under_investigation','Inspection scheduled','Ground verification requested.','2026-11-09 10:00:00+05:30','2026-11-09 10:00:00+05:30'),
      ('incident-005','farm-005','Moga','Punjab',30.2458,74.7550,'2026-10-15',19.8,'GROUND_REPORT','medium',0,'resolved','Warning issued','Residue pile burned near field boundary.','2026-10-15 17:20:00+05:30','2026-10-15 17:20:00+05:30'),
      ('incident-006','farm-006','Amritsar','Punjab',31.6340,74.8723,'2027-02-18',48.6,'VIIRS','high',1,'action_taken','Field officer visit','Repeat hotspot in agricultural zone.','2027-02-18 19:00:00+05:30','2027-02-18 19:00:00+05:30'),
      ('incident-007','farm-007','Ferozepur','Punjab',30.1575,74.1915,'2026-10-07',22.1,'MODIS','medium',0,'resolved','Advisory issued','Small controlled residue fire detected.','2026-10-07 15:00:00+05:30','2026-10-07 15:00:00+05:30'),
      ('incident-008','farm-008','Hoshiarpur','Punjab',31.5143,75.9115,'2027-04-18',12.7,'VIIRS','low',0,'resolved','Farmer contacted','Low intensity thermal signal.','2027-04-18 14:30:00+05:30','2027-04-18 14:30:00+05:30'),
      ('incident-009','farm-009','Faridkot','Punjab',30.6765,74.7583,'2026-10-12',39.4,'VIIRS','high',1,'action_taken','Penalty notice issued','Repeated hotspot in same farm cluster.','2026-10-12 20:00:00+05:30','2026-10-12 20:00:00+05:30'),
      ('incident-010','farm-010','Mansa','Punjab',30.1660,74.5430,'2026-10-20',61.3,'VIIRS','critical',1,'action_taken','Enforcement team dispatched','High FRP detected during peak burning period.','2026-10-21 09:00:00+05:30','2026-10-21 09:00:00+05:30'),
      ('incident-011','farm-011','Kapurthala','Punjab',31.3800,75.3800,'2027-01-25',10.4,'GROUND_REPORT','low',0,'resolved','Advisory issued','Small residue fire reported by local staff.','2027-01-25 16:00:00+05:30','2027-01-25 16:00:00+05:30'),
      ('incident-012','farm-012','Tarn Taran','Punjab',31.1471,74.8723,'2027-03-22',31.5,'VIIRS','medium',0,'under_investigation','Field inspection','Thermal anomaly requires ground verification.','2027-03-23 11:00:00+05:30','2027-03-23 11:00:00+05:30'),
      ('incident-013','farm-013','Mohali','Punjab',30.7500,76.7800,'2027-03-27',17.2,'MODIS','low',0,'resolved','Farmer contacted','Low FRP residue fire.','2027-03-27 15:30:00+05:30','2027-03-27 15:30:00+05:30'),
      ('incident-014','farm-014','Patiala','Punjab',30.3380,76.4000,'2026-11-02',44.8,'VIIRS','high',1,'action_taken','Notice issued','Repeat residue burning event.','2026-11-03 10:30:00+05:30','2026-11-03 10:30:00+05:30'),
      ('incident-015','farm-015','Jalandhar','Punjab',31.3200,75.5800,'2026-10-03',21.9,'VIIRS','medium',0,'resolved','Advisory issued','Moderate thermal anomaly confirmed.','2026-10-03 17:00:00+05:30','2026-10-03 17:00:00+05:30'),
      ('incident-016','farm-016','Bathinda','Punjab',30.2100,74.9500,'2026-10-12',37.6,'MODIS','high',0,'under_investigation','Officer assigned','Ground verification in progress.','2026-10-13 12:00:00+05:30','2026-10-13 12:00:00+05:30'),
      ('incident-017','farm-017','Ludhiana','Punjab',30.9000,75.8500,'2026-10-18',52.2,'VIIRS','critical',1,'action_taken','Penalty notice issued','Critical hotspot during paddy residue season.','2026-10-19 09:30:00+05:30','2026-10-19 09:30:00+05:30'),
      ('incident-018','farm-018','Hoshiarpur','Punjab',31.5100,75.9100,'2027-02-08',14.5,'GROUND_REPORT','low',0,'resolved','Advisory issued','Small agricultural waste fire.','2027-02-08 18:00:00+05:30','2027-02-08 18:00:00+05:30'),
      ('incident-019','farm-019','Amritsar','Punjab',31.6300,74.8700,'2026-12-23',18.9,'VIIRS','medium',0,'resolved','Farmer contacted','Vegetable residue burning reported.','2026-12-23 16:30:00+05:30','2026-12-23 16:30:00+05:30'),
      ('incident-020','farm-020','Patiala','Punjab',30.3400,76.3900,'2027-01-15',26.3,'MODIS','medium',0,'under_investigation','Inspection scheduled','Thermal signal needs verification.','2027-01-16 10:00:00+05:30','2027-01-16 10:00:00+05:30')
      ON CONFLICT (id) DO UPDATE SET
        farm_id = EXCLUDED.farm_id,
        district = EXCLUDED.district,
        state = EXCLUDED.state,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        incident_date = EXCLUDED.incident_date,
        fire_radiative_power = EXCLUDED.fire_radiative_power,
        satellite_source = EXCLUDED.satellite_source,
        severity = EXCLUDED.severity,
        repeat_offender_flag = EXCLUDED.repeat_offender_flag,
        status = EXCLUDED.status,
        officer_action = EXCLUDED.officer_action,
        officer_notes = EXCLUDED.officer_notes,
        resolved_at = EXCLUDED.resolved_at;
    `);

    // 10. NOTIFICATIONS
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('info','success','warning','error')),
        is_read INTEGER NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      INSERT INTO notifications
      (id,user_id,title,message,type,is_read)
      VALUES
      ('notification-001','user-farmer-001','Super Seeder Available','A Super Seeder is available within 10 km of your farm.','success',0),
      ('notification-002','user-farmer-002','Residue Buyer Found','A buyer is offering ₹2800 per ton for paddy straw.','info',0),
      ('notification-003','user-farmer-003','Recommendation Ready','Your crop residue management recommendation is ready.','success',1),
      ('notification-004','user-farmer-004','Burning Risk Alert','High residue-burning activity has been detected in your district.','warning',0),
      ('notification-005','user-farmer-005','Buyer Pickup','A biomass buyer provides pickup service in your area.','success',0),
      ('notification-006','user-farmer-006','Booking Confirmed','Your machinery booking has been confirmed.','success',1),
      ('notification-007','user-farmer-007','Incident Detected','A thermal anomaly was detected near your registered farm.','warning',0),
      ('notification-008','user-farmer-008','New Machine','A Happy Seeder is available in Hoshiarpur.','info',0),
      ('notification-009','user-farmer-009','Buyer Offer','A local buyer is accepting soybean residue.','info',1),
      ('notification-010','user-farmer-010','Critical Alert','A high-intensity hotspot was detected in your district.','error',0),
      ('notification-011','user-farmer-011','Advisory','Composting is recommended for your vegetable residue.','info',0),
      ('notification-012','user-farmer-012','Booking Confirmed','Your residue sale booking is confirmed.','success',1),
      ('notification-013','user-farmer-001','Farm Update','Your farm recommendation was recalculated.','info',0),
      ('notification-014','user-farmer-002','KYC Approved','Your farmer account KYC has been approved.','success',1),
      ('notification-015','user-seller-001','New Booking','A farmer has requested your Super Seeder.','info',0),
      ('notification-016','user-seller-005','New Buyer Request','A farmer has requested residue pickup.','info',0),
      ('notification-017','user-government-001','Incident Review','A new high-severity incident requires review.','warning',0),
      ('notification-018','user-government-002','District Summary','New crop-residue incidents are available for review.','info',1),
      ('notification-019','user-admin-001','Database Status','All 11 project tables are populated successfully.','success',1),
      ('notification-020','user-admin-002','Audit Update','New machinery listing activity has been recorded.','info',0)
      ON CONFLICT (id) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        title = EXCLUDED.title,
        message = EXCLUDED.message,
        type = EXCLUDED.type,
        is_read = EXCLUDED.is_read;
    `);

    // 11. AUDIT LOGS
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        admin_id TEXT NOT NULL,
        action TEXT NOT NULL,
        target_type TEXT NOT NULL,
        target_id TEXT NOT NULL,
        details TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      INSERT INTO audit_logs
      (id,admin_id,action,target_type,target_id,details)
      VALUES
      ('audit-001','user-admin-001','USER_APPROVED','user','user-farmer-001','Farmer KYC status approved after verification.'),
      ('audit-002','user-admin-001','USER_APPROVED','user','user-farmer-002','Farmer KYC status approved after verification.'),
      ('audit-003','user-admin-001','SELLER_APPROVED','seller','seller-001','Machinery rental seller approved.'),
      ('audit-004','user-admin-001','SELLER_APPROVED','seller','seller-005','Biofuel buyer approved.'),
      ('audit-005','user-admin-001','INCIDENT_REVIEWED','incident','incident-003','Critical residue-burning incident reviewed.'),
      ('audit-006','user-admin-001','RECOMMENDATION_GENERATED','recommendation','rec-001','Residue management recommendation generated.'),
      ('audit-007','user-admin-001','MACHINERY_ADDED','machinery_listing','machine-001','Super Seeder listing added in Ludhiana.'),
      ('audit-008','user-admin-002','MACHINERY_ADDED','machinery_listing','machine-002','Happy Seeder listing added in Jalandhar.'),
      ('audit-009','user-admin-002','MACHINERY_UPDATED','machinery_listing','machine-006','Machine availability updated to busy.'),
      ('audit-010','user-admin-002','BOOKING_CONFIRMED','booking','booking-001','Machinery booking confirmed for farm-001.'),
      ('audit-011','user-admin-003','RESIDUE_OFFER_ADDED','residue_offer','offer-001','Paddy straw buyer offer added.'),
      ('audit-012','user-admin-003','RESIDUE_OFFER_ADDED','residue_offer','offer-005','High-volume biomass buyer offer added.'),
      ('audit-013','user-admin-003','INCIDENT_ACTION','incident','incident-010','Enforcement action recorded for critical hotspot.'),
      ('audit-014','user-admin-004','INCIDENT_RESOLVED','incident','incident-002','Farmer advisory completed and incident resolved.'),
      ('audit-015','user-admin-004','BOOKING_COMPLETED','booking','booking-005','Machinery booking marked completed.'),
      ('audit-016','user-admin-001','FARM_CREATED','farm','farm-013','Additional lentil farm record created.'),
      ('audit-017','user-admin-001','FARM_CREATED','farm','farm-020','Additional onion farm record created.'),
      ('audit-018','user-admin-002','SELLER_APPROVED','seller','seller-015','Green energy buyer approved.'),
      ('audit-019','user-admin-003','RECOMMENDATION_GENERATED','recommendation','rec-020','Vegetable residue recommendation generated.'),
      ('audit-020','user-admin-004','DATABASE_CHECK','database','hay-burning-master','Master database validation completed.')
      ON CONFLICT (id) DO UPDATE SET
        admin_id = EXCLUDED.admin_id,
        action = EXCLUDED.action,
        target_type = EXCLUDED.target_type,
        target_id = EXCLUDED.target_id,
        details = EXCLUDED.details;
    `);

    // Synchronization of Legacy Table Records into Master Tables
    await client.query(`
      -- Sync machines -> machinery_listings
      INSERT INTO machinery_listings (id, seller_id, machine_type, model_name, daily_rate, hourly_rate, available_units, current_availability_status, coverage_acres_per_day, description, location)
      SELECT 
        m.id, 
        m.seller_id, 
        CASE 
          WHEN LOWER(m.type) LIKE '%super%' THEN 'super_seeder'
          WHEN LOWER(m.type) LIKE '%happy%' THEN 'happy_seeder'
          WHEN LOWER(m.type) LIKE '%baler%' THEN 'baler'
          WHEN LOWER(m.type) LIKE '%chop%' THEN 'paddy_straw_chopper'
          ELSE 'zero_till_drill'
        END,
        COALESCE(m.name, 'Machinery Unit'),
        COALESCE(m.rate_per_acre, 5000),
        COALESCE(m.rate_per_acre / 8, 800),
        1,
        CASE WHEN m.status = 'available' THEN 'available' ELSE 'busy' END,
        COALESCE(m.max_capacity_acres_per_day, 15),
        COALESCE(m.name, 'Machine'),
        COALESCE(m.address, 'Punjab')
      FROM old_machines m
      ON CONFLICT (id) DO NOTHING;

      -- Sync buyer_listings -> residue_buyer_offers
      INSERT INTO residue_buyer_offers (id, seller_id, offered_price_per_ton, required_tons, residue_type, pickup_provided, min_order_tons, description)
      SELECT 
        bl.id, 
        bl.seller_id, 
        COALESCE(bl.price_per_ton, 2000), 
        COALESCE(bl.required_tons, 100), 
        CASE 
          WHEN LOWER(bl.crop_type) LIKE '%basmati%' THEN 'basmati_straw'
          WHEN LOWER(bl.crop_type) LIKE '%mustard%' THEN 'mustard_husk'
          ELSE 'paddy_straw'
        END,
        1,
        5,
        COALESCE(bl.buying_purpose, 'Residue procurement')
      FROM old_buyer_listings bl
      ON CONFLICT (id) DO NOTHING;
    `);

    await client.query('COMMIT');
    console.log('🎉 Hay Burning Master Migration & Ingestion Completed Successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration Error:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  migrateAndSeedMaster()
    .then(() => pool.end())
    .catch(() => {
      pool.end();
      process.exitCode = 1;
    });
}

module.exports = migrateAndSeedMaster;
