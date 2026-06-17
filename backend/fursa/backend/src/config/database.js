// src/config/database.js
// Manages the PostgreSQL connection pool
// pg.Pool reuses connections instead of opening a new one every request (much faster)

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // On Render.com the DB uses SSL - this handles both local (no SSL) and production (SSL)
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
  max: 10,              // maximum 10 simultaneous connections in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test the connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1); // Stop the server if DB is unreachable
  } else {
    console.log('✅ PostgreSQL connected successfully');
    release();
  }
});

// Helper function: run a query with automatic error logging
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DB] ${duration}ms | ${text.substring(0, 60)}...`);
    }
    return result;
  } catch (error) {
    console.error('[DB Error]', error.message);
    throw error;
  }
};

module.exports = { pool, query };
