// src/validators/profile.validators.js

const { body } = require('express-validator');

const updateProfileValidator = [
  body('name')
    .optional().trim()
    .isLength({ min: 2, max: 150 }).withMessage('الاسم يجب أن يكون بين 2 و 150 حرف'),

  body('phone')
    .optional().trim()
    .matches(/^[+\d\s\-()]{7,20}$/).withMessage('رقم الهاتف غير صالح'),

  body('city')
    .optional().trim()
    .isLength({ max: 100 }).withMessage('اسم المدينة طويل جداً'),

  body('major')
    .optional().trim()
    .isLength({ max: 200 }).withMessage('التخصص طويل جداً'),

  body('experience')
    .optional().trim()
    .isLength({ max: 3000 }).withMessage('الخبرات طويلة جداً'),

  body('company_name')
    .optional().trim()
    .isLength({ max: 200 }).withMessage('اسم الشركة طويل جداً'),

  body('company_website')
    .optional().trim()
    .isURL({ require_protocol: false }).withMessage('رابط الموقع غير صالح'),
];

const changePasswordValidator = [
  body('current_password')
    .notEmpty().withMessage('كلمة المرور الحالية مطلوبة'),

  body('new_password')
    .notEmpty().withMessage('كلمة المرور الجديدة مطلوبة')
    .isLength({ min: 8 }).withMessage('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل')
    .matches(/[A-Z]/).withMessage('يجب أن تحتوي على حرف كبير')
    .matches(/[0-9]/).withMessage('يجب أن تحتوي على رقم'),
];

module.exports = { updateProfileValidator, changePasswordValidator };
