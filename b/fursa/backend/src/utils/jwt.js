// src/utils/jwt.js
// Handles creating and verifying JWT tokens

const jwt = require('jsonwebtoken');

/**
 * Generate a JWT token for a user
 * @param {object} payload - { id, email, role }
 * @returns {string} signed JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * Verify a JWT token
 * @param {string} token
 * @returns {object} decoded payload or throws error
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateToken, verifyToken };
