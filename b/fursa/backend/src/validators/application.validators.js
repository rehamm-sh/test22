// src/validators/application.validators.js

const { body } = require('express-validator');

const applyValidator = [
  body('full_name')
    .trim()
    .notEmpty().withMessage('الاسم الكامل مطلوب')
    .isLength({ min: 2, max: 150 }).withMessage('الاسم يجب أن يكون بين 2 و 150 حرف'),

  body('email')
    .trim()
    .notEmpty().withMessage('البريد الإلكتروني مطلوب')
    .isEmail().withMessage('البريد الإلكتروني غير صالح')
    .normalizeEmail(),

  body('phone')
    .optional()
    .trim()
    .matches(/^[+\d\s\-()]{7,20}$/).withMessage('رقم الهاتف غير صالح'),

  body('major')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('التخصص طويل جداً'),

  body('experience')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('الخبرات طويلة جداً'),

  body('cover_letter')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('رسالة التقديم طويلة جداً'),
];

module.exports = { applyValidator };
