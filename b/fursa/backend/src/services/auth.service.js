// src/services/auth.service.js
// Business logic for authentication
// Controllers call these functions - they never touch the DB directly

const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { generateToken } = require('../utils/jwt');

/**
 * Register a new user
 * @param {object} data - { name, email, password, role, company_name? }
 * @returns {object} - { user, token }
 */
const signup = async ({ name, email, password, role, company_name }) => {
  // 1. Check if email already exists
  const existing = await query(
    'SELECT id FROM users WHERE email = $1', [email]
  );
  if (existing.rows.length > 0) {
    const error = new Error('هذا البريد الإلكتروني مسجل مسبقاً');
    error.statusCode = 409;
    throw error;
  }

  // 2. Hash password with bcrypt (cost factor 12)
  // Higher cost = more secure but slower. 12 is a good balance.
  const hashedPassword = await bcrypt.hash(password, 12);

  // 3. Insert new user
  const userResult = await query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, created_at`,
    [name, email, hashedPassword, role]
  );
  const user = userResult.rows[0];

  // 4. Create the corresponding profile
  if (role === 'job_seeker') {
    await query(
      'INSERT INTO job_seeker_profiles (user_id) VALUES ($1)',
      [user.id]
    );
  } else if (role === 'employer') {
    await query(
      'INSERT INTO employer_profiles (user_id, company_name) VALUES ($1, $2)',
      [user.id, company_name]
    );
  }

  // 5. Generate JWT
  const token = generateToken({ id: user.id, email: user.email, role: user.role });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
    },
    token,
  };
};

/**
 * Login an existing user
 * @param {object} data - { email, password }
 * @returns {object} - { user, token }
 */
const login = async ({ email, password }) => {
  // 1. Find user by email
  const result = await query(
    'SELECT id, name, email, password, role, is_active FROM users WHERE email = $1',
    [email]
  );

  // Use a generic error message to prevent email enumeration attacks
  // (attacker can't tell if email exists or password is wrong)
  const invalidError = new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
  invalidError.statusCode = 401;

  if (result.rows.length === 0) throw invalidError;

  const user = result.rows[0];

  // 2. Check if account is active
  if (!user.is_active) {
    const error = new Error('تم تعطيل هذا الحساب، يرجى التواصل مع الإدارة');
    error.statusCode = 403;
    throw error;
  }

  // 3. Compare password with hashed version
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) throw invalidError;

  // 4. Generate JWT
  const token = generateToken({ id: user.id, email: user.email, role: user.role });

  // 5. Fetch profile info based on role
  let profile = null;
  if (user.role === 'employer') {
    const profileResult = await query(
      'SELECT company_name, company_city FROM employer_profiles WHERE user_id = $1',
      [user.id]
    );
    profile = profileResult.rows[0] || null;
  } else if (user.role === 'job_seeker') {
    const profileResult = await query(
      'SELECT city, major FROM job_seeker_profiles WHERE user_id = $1',
      [user.id]
    );
    profile = profileResult.rows[0] || null;
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      profile,
    },
    token,
  };
};

/**
 * Get current user profile
 * @param {number} userId
 * @returns {object} user with profile
 */
const getMe = async (userId) => {
  const result = await query(
    'SELECT id, name, email, role, is_active, created_at FROM users WHERE id = $1',
    [userId]
  );
  if (result.rows.length === 0) {
    const error = new Error('المستخدم غير موجود');
    error.statusCode = 404;
    throw error;
  }
  const user = result.rows[0];

  let profile = null;
  if (user.role === 'job_seeker') {
    const p = await query(
      'SELECT phone, city, major, experience, cv_filename, bio FROM job_seeker_profiles WHERE user_id = $1',
      [userId]
    );
    profile = p.rows[0] || null;
  } else if (user.role === 'employer') {
    const p = await query(
      'SELECT company_name, company_city, company_website, company_about, phone, is_verified FROM employer_profiles WHERE user_id = $1',
      [userId]
    );
    profile = p.rows[0] || null;
  }

  return { ...user, profile };
};

module.exports = { signup, login, getMe };
