// src/services/profile.service.js

const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

/**
 * Update job seeker profile
 */
const updateJobSeekerProfile = async (userId, data) => {
  const { name, phone, city, major, experience, bio } = data;

  // Update name in users table
  if (name) {
    await query(
      'UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2',
      [name, userId]
    );
  }

  // Upsert profile (INSERT if missing, UPDATE if exists)
  await query(
    `INSERT INTO job_seeker_profiles (user_id, phone, city, major, experience, bio)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id) DO UPDATE SET
       phone      = EXCLUDED.phone,
       city       = EXCLUDED.city,
       major      = EXCLUDED.major,
       experience = EXCLUDED.experience,
       bio        = EXCLUDED.bio,
       updated_at = NOW()`,
    [userId, phone || null, city || null, major || null, experience || null, bio || null]
  );

  return getJobSeekerProfile(userId);
};

/**
 * Update job seeker CV file
 */
const updateCV = async (userId, cvFile) => {
  await query(
    `UPDATE job_seeker_profiles
     SET cv_filename = $1, cv_path = $2, updated_at = NOW()
     WHERE user_id = $3`,
    [cvFile.originalname, cvFile.path, userId]
  );
  return { cv_filename: cvFile.originalname, cv_path: cvFile.path };
};

/**
 * Get job seeker full profile
 */
const getJobSeekerProfile = async (userId) => {
  const result = await query(
    `SELECT
       u.id, u.name, u.email, u.role, u.created_at,
       p.phone, p.city, p.major, p.experience, p.bio, p.cv_filename
     FROM users u
     LEFT JOIN job_seeker_profiles p ON u.id = p.user_id
     WHERE u.id = $1`,
    [userId]
  );
  if (!result.rows.length) {
    const e = new Error('المستخدم غير موجود'); e.statusCode = 404; throw e;
  }
  return result.rows[0];
};

/**
 * Update employer profile
 */
const updateEmployerProfile = async (userId, data) => {
  const { name, company_name, company_city, company_website, company_about, phone } = data;

  if (name) {
    await query(
      'UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2',
      [name, userId]
    );
  }

  await query(
    `INSERT INTO employer_profiles (user_id, company_name, company_city, company_website, company_about, phone)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id) DO UPDATE SET
       company_name    = EXCLUDED.company_name,
       company_city    = EXCLUDED.company_city,
       company_website = EXCLUDED.company_website,
       company_about   = EXCLUDED.company_about,
       phone           = EXCLUDED.phone,
       updated_at      = NOW()`,
    [userId,
     company_name   || null,
     company_city   || null,
     company_website|| null,
     company_about  || null,
     phone          || null]
  );

  return getEmployerProfile(userId);
};

/**
 * Get employer full profile
 */
const getEmployerProfile = async (userId) => {
  const result = await query(
    `SELECT
       u.id, u.name, u.email, u.role, u.created_at,
       ep.company_name, ep.company_city, ep.company_website,
       ep.company_about, ep.phone, ep.is_verified
     FROM users u
     LEFT JOIN employer_profiles ep ON u.id = ep.user_id
     WHERE u.id = $1`,
    [userId]
  );
  if (!result.rows.length) {
    const e = new Error('المستخدم غير موجود'); e.statusCode = 404; throw e;
  }
  return result.rows[0];
};

/**
 * Change password (requires current password verification)
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  // Fetch current hashed password
  const result = await query(
    'SELECT password FROM users WHERE id = $1',
    [userId]
  );
  if (!result.rows.length) {
    const e = new Error('المستخدم غير موجود'); e.statusCode = 404; throw e;
  }

  const match = await bcrypt.compare(currentPassword, result.rows[0].password);
  if (!match) {
    const e = new Error('كلمة المرور الحالية غير صحيحة'); e.statusCode = 401; throw e;
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await query(
    'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
    [hashed, userId]
  );

  return { changed: true };
};

module.exports = {
  updateJobSeekerProfile, updateCV, getJobSeekerProfile,
  updateEmployerProfile, getEmployerProfile,
  changePassword,
};
