const { pool } = require('./index');

async function migrateSimulations() {
  try {
    console.log('Migrating simulation tables to Neon PostgreSQL...');
    await pool.query(`
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

      CREATE TABLE IF NOT EXISTS sensor_results (
          id SERIAL PRIMARY KEY,
          simulation_id INTEGER REFERENCES simulations(id) ON DELETE CASCADE,
          sensor VARCHAR(40) NOT NULL,
          confidence DOUBLE PRECISION NOT NULL,
          fire_detected BOOLEAN NOT NULL,
          resolution VARCHAR(30) NOT NULL
      );

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
    `);

    const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_name IN ('simulations', 'sensor_results', 'simulation_context')");
    console.log('Verified Tables in Neon DB:', tables.rows.map(r => r.table_name));

    const indexes = await pool.query("SELECT indexname FROM pg_indexes WHERE indexname IN ('simulation_location_idx', 'simulation_time_idx', 'sensor_simulation_idx')");
    console.log('Verified Indexes in Neon DB:', indexes.rows.map(r => r.indexname));

  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await pool.end();
  }
}

migrateSimulations();
