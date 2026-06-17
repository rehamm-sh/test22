// src/validators/job.validators.js

const { body, query, param } = require('express-validator');

const createJobValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('عنوان الوظيفة مطلوب')
    .isLength({ min: 3, max: 250 }).withMessage('عنوان الوظيفة يجب أن يكون بين 3 و 250 حرف'),

  body('company_name')
    .trim()
    .notEmpty().withMessage('اسم الشركة مطلوب')
    .isLength({ max: 200 }).withMessage('اسم الشركة طويل جداً'),

  body('city')
    .trim()
    .notEmpty().withMessage('المدينة مطلوبة')
    .isLength({ max: 100 }).withMessage('اسم المدينة طويل جداً'),

  body('description')
    .trim()
    .notEmpty().withMessage('وصف الوظيفة مطلوب')
    .isLength({ min: 20 }).withMessage('وصف الوظيفة يجب أن يكون 20 حرف على الأقل'),

  body('requirements')
    .trim()
    .notEmpty().withMessage('متطلبات الوظيفة مطلوبة')
    .isLength({ min: 10 }).withMessage('المتطلبات يجب أن تكون 10 أحرف على الأقل'),

  body('job_type')
    .notEmpty().withMessage('نوع الوظيفة مطلوب')
    .isIn(['full_time', 'part_time', 'remote', 'contract'])
    .withMessage('نوع الوظيفة غير صالح'),

  body('category_id')
    .optional()
    .isInt({ min: 1 }).withMessage('الفئة غير صالحة'),

  body('deadline')
    .optional()
    .isDate().withMessage('تاريخ الإغلاق غير صالح')
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error('تاريخ الإغلاق يجب أن يكون في المستقبل');
      }
      return true;
    }),
];

const updateJobValidator = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 250 }).withMessage('عنوان الوظيفة يجب أن يكون بين 3 و 250 حرف'),

  body('city')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('اسم المدينة طويل جداً'),

  body('description')
    .optional()
    .trim()
    .isLength({ min: 20 }).withMessage('وصف الوظيفة يجب أن يكون 20 حرف على الأقل'),

  body('job_type')
    .optional()
    .isIn(['full_time', 'part_time', 'remote', 'contract'])
    .withMessage('نوع الوظيفة غير صالح'),

  body('deadline')
    .optional()
    .isDate().withMessage('تاريخ الإغلاق غير صالح'),
];

const jobQueryValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('رقم الصفحة غير صالح'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('عدد النتائج يجب أن يكون بين 1 و 50'),

  query('category_id')
    .optional()
    .isInt({ min: 1 }).withMessage('الفئة غير صالحة'),

  query('job_type')
    .optional()
    .isIn(['full_time', 'part_time', 'remote', 'contract'])
    .withMessage('نوع الوظيفة غير صالح'),
];

module.exports = { createJobValidator, updateJobValidator, jobQueryValidator };
