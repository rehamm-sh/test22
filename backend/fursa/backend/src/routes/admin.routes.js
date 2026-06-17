// src/routes/admin.routes.js

const router = require('express').Router();
const adminController    = require('../controllers/admin.controller');
const jobController      = require('../controllers/job.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { body }           = require('express-validator');
const validate           = require('../middleware/validate');

// Every admin route requires login + admin role
router.use(authenticate, authorize('admin'));

// ── DASHBOARD ─────────────────────────────────────────────────
router.get('/dashboard', adminController.getDashboard);

// ── JOBS ──────────────────────────────────────────────────────
router.get('/jobs',                 adminController.getAllJobs);
router.get('/jobs/:jobId',          adminController.getJobDetail);
router.delete('/jobs/:jobId',       adminController.deleteJob);

router.patch('/jobs/:jobId/review',
  [
    body('action')
      .isIn(['approved', 'rejected'])
      .withMessage('الإجراء يجب أن يكون approved أو rejected'),
    body('rejection_reason')
      .if(body('action').equals('rejected'))
      .notEmpty().withMessage('سبب الرفض مطلوب عند رفض الوظيفة'),
  ],
  validate,
  adminController.reviewJob
);

// ── USERS ─────────────────────────────────────────────────────
router.get('/users',                    adminController.getAllUsers);
router.get('/users/:userId',            adminController.getUserDetail);
router.patch('/users/:userId/toggle',   adminController.toggleUserStatus);
router.delete('/users/:userId',         adminController.deleteUser);

// ── CATEGORIES ────────────────────────────────────────────────
router.get('/categories',               adminController.getCategories);
router.post('/categories',
  [
    body('name').trim().notEmpty().withMessage('اسم الفئة (إنجليزي) مطلوب'),
    body('name_ar').trim().notEmpty().withMessage('اسم الفئة (عربي) مطلوب'),
  ],
  validate,
  adminController.createCategory
);
router.patch('/categories/:categoryId/toggle', adminController.toggleCategoryStatus);
router.delete('/categories/:categoryId',       adminController.deleteCategory);

// ── APPLICATIONS ──────────────────────────────────────────────
router.get('/applications',             adminController.getAllApplications);

module.exports = router;
