// src/middleware/validate.js
// Reads validation errors from express-validator and returns them
// Used after every validator chain in routes

const { validationResult } = require('express-validator');
const { sendError } = require('../utils/response');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Format errors into a clean array
    const formatted = errors.array().map(e => ({
      field: e.path,
      message: e.msg,
    }));
    return sendError(res, 422, 'بيانات غير صالحة', formatted);
  }
  next();
};

module.exports = validate;
