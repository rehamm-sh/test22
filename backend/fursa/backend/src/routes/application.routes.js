// src/routes/application.routes.js

const router = require('express').Router();
const appController = require('../controllers/application.controller');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/applications/my   - job seeker sees their submitted applications
router.get('/my',
  authenticate, authorize('job_seeker'),
  appController.getMyApplications
);

// PATCH /api/applications/:applicationId/status  - employer updates status
router.patch('/:applicationId/status',
  authenticate, authorize('employer'),
  appController.updateApplicationStatus
);

module.exports = router;
