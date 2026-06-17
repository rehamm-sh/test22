// src/routes/job.routes.js

const router = require('express').Router();
const jobController = require('../controllers/job.controller');
const appController = require('../controllers/application.controller');
const { createJobValidator, updateJobValidator, jobQueryValidator } = require('../validators/job.validators');
const { applyValidator } = require('../validators/application.validators');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// ─── PUBLIC ROUTES ─────────────────────────────────────────────
// GET  /api/jobs           - list approved jobs (with filters)
router.get('/', jobQueryValidator, validate, jobController.getJobs);

// GET  /api/jobs/:id       - get single job details
router.get('/:id', jobController.getJobById);

// ─── EMPLOYER ROUTES ────────────────────────────────────────────
// POST /api/jobs           - create a new job
router.post('/',
  authenticate, authorize('employer'),
  createJobValidator, validate,
  jobController.createJob
);

// GET  /api/jobs/my/list   - employer sees their own jobs
router.get('/my/list',
  authenticate, authorize('employer'),
  jobController.getMyJobs
);

// PUT  /api/jobs/:id       - update own job
router.put('/:id',
  authenticate, authorize('employer'),
  updateJobValidator, validate,
  jobController.updateJob
);

// DELETE /api/jobs/:id     - delete own job (admin can also delete)
router.delete('/:id',
  authenticate, authorize('employer', 'admin'),
  jobController.deleteJob
);

// GET  /api/jobs/:jobId/applications  - employer sees applications for their job
router.get('/:jobId/applications',
  authenticate, authorize('employer'),
  appController.getJobApplications
);

// ─── JOB SEEKER ROUTES ─────────────────────────────────────────
// POST /api/jobs/:jobId/apply  - apply to a job
router.post('/:jobId/apply',
  authenticate, authorize('job_seeker'),
  upload.single('cv'),          // 'cv' = field name in the form
  applyValidator, validate,
  appController.applyToJob
);

module.exports = router;
