// src/services/application.service.js

const { query } = require('../config/database');

/**
 * Submit an application for a job
 */
const applyToJob = async (jobId, applicantId, applicationData, cvFile) => {
  // 1. Check job exists and is approved
  const jobResult = await query(
    `SELECT id, status, deadline FROM jobs WHERE id = $1`,
    [jobId]
  );

  if (jobResult.rows.length === 0) {
    const error = new Error('الوظيفة غير موجودة');
    error.statusCode = 404;
    throw error;
  }

  const job = jobResult.rows[0];

  if (job.status !== 'approved') {
    const error = new Error('هذه الوظيفة غير متاحة للتقديم');
    error.statusCode = 400;
    throw error;
  }

  if (job.deadline && new Date(job.deadline) < new Date()) {
    const error = new Error('انتهت مدة التقديم على هذه الوظيفة');
    error.statusCode = 400;
    throw error;
  }

  // 2. Check if already applied
  const existing = await query(
    'SELECT id FROM applications WHERE job_id = $1 AND applicant_id = $2',
    [jobId, applicantId]
  );

  if (existing.rows.length > 0) {
    const error = new Error('لقد تقدمت على هذه الوظيفة مسبقاً');
    error.statusCode = 409;
    throw error;
  }

  // 3. Insert application
  const { full_name, email, phone, major, experience, cover_letter } = applicationData;
  const cv_filename = cvFile ? cvFile.originalname : null;
  const cv_path    = cvFile ? cvFile.path : null;

  const result = await query(
    `INSERT INTO applications
      (job_id, applicant_id, full_name, email, phone, major, experience, cover_letter, cv_filename, cv_path)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id, job_id, status, applied_at`,
    [jobId, applicantId, full_name, email, phone || null, major || null,
     experience || null, cover_letter || null, cv_filename, cv_path]
  );

  return result.rows[0];
};

/**
 * Get all applications for a specific job (employer view)
 * Only the employer who owns the job can see this
 */
const getJobApplications = async (jobId, employerId) => {
  // Verify job belongs to this employer
  const jobCheck = await query(
    'SELECT id FROM jobs WHERE id = $1 AND employer_id = $2',
    [jobId, employerId]
  );

  if (jobCheck.rows.length === 0) {
    const error = new Error('الوظيفة غير موجودة أو ليس لديك صلاحية الاطلاع على طلباتها');
    error.statusCode = 403;
    throw error;
  }

  const result = await query(
    `SELECT
       a.id, a.full_name, a.email, a.phone, a.major,
       a.experience, a.cover_letter, a.cv_filename,
       a.status, a.applied_at,
       u.name AS user_name
     FROM applications a
     LEFT JOIN users u ON a.applicant_id = u.id
     WHERE a.job_id = $1
     ORDER BY a.applied_at DESC`,
    [jobId]
  );

  return result.rows;
};

/**
 * Get all applications submitted by the logged-in job seeker
 */
const getMyApplications = async (applicantId, { page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;

  const countResult = await query(
    'SELECT COUNT(*) FROM applications WHERE applicant_id = $1',
    [applicantId]
  );
  const total = parseInt(countResult.rows[0].count);

  const result = await query(
    `SELECT
       a.id, a.status, a.applied_at,
       j.title AS job_title, j.company_name, j.city, j.job_type
     FROM applications a
     JOIN jobs j ON a.job_id = j.id
     WHERE a.applicant_id = $1
     ORDER BY a.applied_at DESC
     LIMIT $2 OFFSET $3`,
    [applicantId, limit, offset]
  );

  return {
    applications: result.rows,
    pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
  };
};

/**
 * Update application status (employer action)
 */
const updateApplicationStatus = async (applicationId, employerId, status) => {
  const validStatuses = ['reviewed', 'accepted', 'rejected'];
  if (!validStatuses.includes(status)) {
    const error = new Error('حالة الطلب غير صالحة');
    error.statusCode = 400;
    throw error;
  }

  // Verify employer owns the job this application belongs to
  const result = await query(
    `UPDATE applications a
     SET status = $1, updated_at = NOW()
     FROM jobs j
     WHERE a.id = $2
       AND a.job_id = j.id
       AND j.employer_id = $3
     RETURNING a.id, a.status`,
    [status, applicationId, employerId]
  );

  if (result.rows.length === 0) {
    const error = new Error('الطلب غير موجود أو ليس لديك صلاحية تعديله');
    error.statusCode = 403;
    throw error;
  }

  return result.rows[0];
};

module.exports = { applyToJob, getJobApplications, getMyApplications, updateApplicationStatus };
