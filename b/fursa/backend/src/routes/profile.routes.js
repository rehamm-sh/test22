// src/routes/profile.routes.js

const router = require('express').Router();
const profileController = require('../controllers/profile.controller');
const { updateProfileValidator, changePasswordValidator } = require('../validators/profile.validators');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All profile routes require authentication
router.use(authenticate);

// GET  /api/profile          - get current user's profile
router.get('/', profileController.getProfile);

// PUT  /api/profile          - update profile (works for both roles)
router.put('/', updateProfileValidator, validate, profileController.updateProfile);

// POST /api/profile/cv       - job seeker uploads their CV to profile
router.post('/cv',
  authorize('job_seeker'),
  upload.single('cv'),
  profileController.uploadCV
);

// PATCH /api/profile/password - change password
router.patch('/password', changePasswordValidator, validate, profileController.changePassword);

module.exports = router;
