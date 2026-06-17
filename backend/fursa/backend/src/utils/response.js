// src/utils/response.js
// Every API response goes through these helpers
// This keeps the format consistent across the entire app

/**
 * Send a success response
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status (200, 201, etc.)
 * @param {string} message - Human-readable message
 * @param {*} data - The actual data to return
 */
const sendSuccess = (res, statusCode = 200, message = 'Success', data = null) => {
  const response = { success: true, message };
  if (data !== null) response.data = data;
  return res.status(statusCode).json(response);
};

/**
 * Send an error response
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status (400, 401, 403, 404, 500, etc.)
 * @param {string} message - Error message
 * @param {*} errors - Validation errors array (optional)
 */
const sendError = (res, statusCode = 500, message = 'Server error', errors = null) => {
  const response = { success: false, message };
  if (errors !== null) response.errors = errors;
  return res.status(statusCode).json(response);
};

module.exports = { sendSuccess, sendError };
