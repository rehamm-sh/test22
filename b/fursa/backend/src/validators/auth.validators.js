// src/validators/auth.validators.js
// Rules for validating signup and login request bodies

const { body } = require('express-validator');

const signupValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('الاسم مطلوب')
    .isLength({ min: 2, max: 150 }).withMessage('الاسم يجب أن يكون بين 2 و 150 حرف'),

  body('email')
    .trim()
    .notEmpty().withMessage('البريد الإلكتروني مطلوب')
    .isEmail().withMessage('البريد الإلكتروني غير صالح')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('كلمة المرور مطلوبة')
    .isLength({ min: 8 }).withMessage('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .matches(/[A-Z]/).withMessage('كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل')
    .matches(/[0-9]/).withMessage('كلمة المرور يجب أن تحتوي على رقم واحد على الأقل'),

  body('role')
    .notEmpty().withMessage('نوع الحساب مطلوب')
    .isIn(['job_seeker', 'employer']).withMessage('نوع الحساب غير صالح'),

  // Required only if role is employer
  body('company_name')
    .if(body('role').equals('employer'))
    .trim()
    .notEmpty().withMessage('اسم الشركة مطلوب للمستخدمين من نوع صاحب عمل')
    .isLength({ max: 200 }).withMessage('اسم الشركة طويل جداً'),
];

const loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('البريد الإلكتروني مطلوب')
    .isEmail().withMessage('البريد الإلكتروني غير صالح')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('كلمة المرور مطلوبة'),
];

module.exports = { signupValidator, loginValidator };
