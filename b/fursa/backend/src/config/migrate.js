// src/config/migrate.js
// Run with: npm run db:migrate
// This creates ALL tables in the correct order (respecting foreign keys)

require('dotenv').config();
const { pool } = require('./database');

const createTables = async () => {
  console.log('🚀 Starting database migration...\n');

  try {
    // ─────────────────────────────────────────
    // TABLE 1: users
    // Central auth table for ALL roles
    // role: 'job_seeker' | 'employer' | 'admin'
    // ─────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id          SERIAL PRIMARY KEY,
        name        VARCHAR(150) NOT NULL,
        email       VARCHAR(255) UNIQUE NOT NULL,
        password    VARCHAR(255) NOT NULL,
        role        VARCHAR(20)  NOT NULL DEFAULT 'job_seeker'
                    CHECK (role IN ('job_seeker', 'employer', 'admin')),
        is_active   BOOLEAN      NOT NULL DEFAULT true,
        created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✅ Table: users');

    // ─────────────────────────────────────────
    // TABLE 2: job_seeker_profiles
    // Extra info specific to job seekers
    // ─────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS job_seeker_profiles (
        id            SERIAL PRIMARY KEY,
        user_id       INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        phone         VARCHAR(30),
        city          VARCHAR(100),
        major         VARCHAR(200),
        experience    TEXT,
        cv_filename   VARCHAR(255),
        cv_path       VARCHAR(500),
        bio           TEXT,
        updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✅ Table: job_seeker_profiles');

    // ─────────────────────────────────────────
    // TABLE 3: employer_profiles
    // Extra info specific to employers
    // ─────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS employer_profiles (
        id               SERIAL PRIMARY KEY,
        user_id          INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        company_name     VARCHAR(200) NOT NULL,
        company_city     VARCHAR(100),
        company_website  VARCHAR(255),
        company_about    TEXT,
        phone            VARCHAR(30),
        is_verified      BOOLEAN NOT NULL DEFAULT false,
        updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✅ Table: employer_profiles');

    // ─────────────────────────────────────────
    // TABLE 4: categories
    // Job categories (managed by admin)
    // ─────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id          SERIAL PRIMARY KEY,
        name        VARCHAR(150) UNIQUE NOT NULL,
        name_ar     VARCHAR(150) UNIQUE NOT NULL,
        icon        VARCHAR(100),
        is_active   BOOLEAN NOT NULL DEFAULT true,
        created_at  TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✅ Table: categories');

    // ─────────────────────────────────────────
    // TABLE 5: jobs
    // Core job listings
    // status: 'pending' | 'approved' | 'rejected' | 'closed'
    // ─────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id              SERIAL PRIMARY KEY,
        employer_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category_id     INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        title           VARCHAR(250) NOT NULL,
        company_name    VARCHAR(200) NOT NULL,
        city            VARCHAR(100) NOT NULL,
        description     TEXT NOT NULL,
        requirements    TEXT NOT NULL,
        job_type        VARCHAR(50) NOT NULL DEFAULT 'full_time'
                        CHECK (job_type IN ('full_time', 'part_time', 'remote', 'contract')),
        deadline        DATE,
        status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'approved', 'rejected', 'closed')),
        rejection_reason TEXT,
        views_count     INTEGER NOT NULL DEFAULT 0,
        created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✅ Table: jobs');

    // ─────────────────────────────────────────
    // TABLE 6: applications
    // Job applications submitted by job seekers
    // status: 'pending' | 'reviewed' | 'accepted' | 'rejected'
    // ─────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id              SERIAL PRIMARY KEY,
        job_id          INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        applicant_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        full_name       VARCHAR(150) NOT NULL,
        email           VARCHAR(255) NOT NULL,
        phone           VARCHAR(30),
        major           VARCHAR(200),
        experience      TEXT,
        cv_filename     VARCHAR(255),
        cv_path         VARCHAR(500),
        cover_letter    TEXT,
        status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
        applied_at      TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
        -- Prevent duplicate applications
        UNIQUE(job_id, applicant_id)
      );
    `);
    console.log('✅ Table: applications');

    // ─────────────────────────────────────────
    // INDEXES for performance
    // These make searches much faster
    // ─────────────────────────────────────────
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_jobs_status      ON jobs(status);
      CREATE INDEX IF NOT EXISTS idx_jobs_employer     ON jobs(employer_id);
      CREATE INDEX IF NOT EXISTS idx_jobs_category     ON jobs(category_id);
      CREATE INDEX IF NOT EXISTS idx_jobs_city         ON jobs(city);
      CREATE INDEX IF NOT EXISTS idx_applications_job  ON applications(job_id);
      CREATE INDEX IF NOT EXISTS idx_applications_user ON applications(applicant_id);
      CREATE INDEX IF NOT EXISTS idx_users_email       ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role        ON users(role);
    `);
    console.log('✅ Indexes created');

    console.log('\n🎉 Migration completed successfully!');
    console.log('👉 Now run: npm run db:seed\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
};

createTables();
