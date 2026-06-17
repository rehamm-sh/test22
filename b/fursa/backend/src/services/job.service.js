// src/services/job.service.js
// All database logic for job listings

const { query } = require('../config/database');

/**
 * Create a new job (status = 'pending' by default, awaiting admin approval)
 */
const createJob = async (employerId, jobData) => {
  const { title, company_name, city, description, requirements, job_type, category_id, deadline } = jobData;

  const result = await query(
    `INSERT INTO jobs
      (employer_id, category_id, title, company_name, city, description, requirements, job_type, deadline)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [employerId, category_id || null, title, company_name, city, description, requirements, job_type, deadline || null]
  );
  return result.rows[0];
};

/**
 * Get all APPROVED jobs (public listing)
 * Supports: search, category filter, city filter, job_type filter, pagination
 */
const getApprovedJobs = async ({ page = 1, limit = 10, search, category_id, city, job_type }) => {
  const offset = (page - 1) * limit;
  const conditions = [`j.status = 'approved'`];
  const params = [];
  let paramIndex = 1;

  if (search) {
    conditions.push(`(j.title ILIKE $${paramIndex} OR j.description ILIKE $${paramIndex} OR j.company_name ILIKE $${paramIndex})`);
    params.push(`%${search}%`);
    paramIndex++;
  }
  if (category_id) {
    conditions.push(`j.category_id = $${paramIndex}`);
    params.push(parseInt(category_id));
    paramIndex++;
  }
  if (city) {
    conditions.push(`j.city ILIKE $${paramIndex}`);
    params.push(`%${city}%`);
    paramIndex++;
  }
  if (job_type) {
    conditions.push(`j.job_type = $${paramIndex}`);
    params.push(job_type);
    paramIndex++;
  }

  const whereClause = conditions.join(' AND ');

  // Get total count for pagination
  const countResult = await query(
    `SELECT COUNT(*) FROM jobs j WHERE ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);

  // Get paginated results
  const jobsResult = await query(
    `SELECT
       j.id, j.title, j.company_name, j.city, j.job_type,
       j.deadline, j.views_count, j.created_at,
       LEFT(j.description, 200) AS description_preview,
       c.name_ar AS category_name
     FROM jobs j
     LEFT JOIN categories c ON j.category_id = c.id
     WHERE ${whereClause}
     ORDER BY j.created_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  );

  return {
    jobs: jobsResult.rows,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get single job details (increments view count)
 */
const getJobById = async (jobId, isPublic = true) => {
  // Increment views only for public (non-admin/employer) requests
  if (isPublic) {
    await query('UPDATE jobs SET views_count = views_count + 1 WHERE id = $1', [jobId]);
  }

  const result = await query(
    `SELECT
       j.*,
       c.name_ar AS category_name,
       u.name AS employer_name,
       ep.company_name, ep.company_about, ep.company_website
     FROM jobs j
     LEFT JOIN categories c ON j.category_id = c.id
     LEFT JOIN users u ON j.employer_id = u.id
     LEFT JOIN employer_profiles ep ON u.id = ep.user_id
     WHERE j.id = $1`,
    [jobId]
  );

  if (result.rows.length === 0) {
    const error = new Error('الوظيفة غير موجودة');
    error.statusCode = 404;
    throw error;
  }

  const job = result.rows[0];

  // For public: only return approved jobs
  if (isPublic && job.status !== 'approved') {
    const error = new Error('الوظيفة غير متاحة');
    error.statusCode = 404;
    throw error;
  }

  return job;
};

/**
 * Update a job (employer can update only their own pending/rejected jobs)
 */
const updateJob = async (jobId, employerId, updateData) => {
  // Verify ownership and that job is editable
  const existing = await query(
    'SELECT id, status FROM jobs WHERE id = $1 AND employer_id = $2',
    [jobId, employerId]
  );

  if (existing.rows.length === 0) {
    const error = new Error('الوظيفة غير موجودة أو ليس لديك صلاحية تعديلها');
    error.statusCode = 403;
    throw error;
  }

  if (existing.rows[0].status === 'approved') {
    const error = new Error('لا يمكن تعديل وظيفة معتمدة. يرجى التواصل مع الإدارة');
    error.statusCode = 400;
    throw error;
  }

  // Build dynamic UPDATE query
  const fields = [];
  const values = [];
  let idx = 1;

  const allowed = ['title', 'company_name', 'city', 'description', 'requirements', 'job_type', 'category_id', 'deadline'];
  for (const key of allowed) {
    if (updateData[key] !== undefined) {
      fields.push(`${key} = $${idx}`);
      values.push(updateData[key]);
      idx++;
    }
  }

  if (fields.length === 0) {
    const error = new Error('لا توجد بيانات للتحديث');
    error.statusCode = 400;
    throw error;
  }

  // Reset to pending so admin re-reviews the edited job
  fields.push(`status = 'pending'`);
  fields.push(`updated_at = NOW()`);

  values.push(jobId);
  const result = await query(
    `UPDATE jobs SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );

  return result.rows[0];
};

/**
 * Delete a job (employer deletes their own, admin can delete any)
 */
const deleteJob = async (jobId, userId, userRole) => {
  let result;
  if (userRole === 'admin') {
    result = await query('DELETE FROM jobs WHERE id = $1 RETURNING id', [jobId]);
  } else {
    result = await query(
      'DELETE FROM jobs WHERE id = $1 AND employer_id = $2 RETURNING id',
      [jobId, userId]
    );
  }

  if (result.rows.length === 0) {
    const error = new Error('الوظيفة غير موجودة أو ليس لديك صلاحية حذفها');
    error.statusCode = 403;
    throw error;
  }

  return { deleted: true };
};

/**
 * Get all jobs posted by a specific employer
 */
const getEmployerJobs = async (employerId, { page = 1, limit = 10, status }) => {
  const offset = (page - 1) * limit;
  const conditions = ['j.employer_id = $1'];
  const params = [employerId];
  let idx = 2;

  if (status) {
    conditions.push(`j.status = $${idx}`);
    params.push(status);
    idx++;
  }

  const whereClause = conditions.join(' AND ');

  const countResult = await query(
    `SELECT COUNT(*) FROM jobs j WHERE ${whereClause}`, params
  );
  const total = parseInt(countResult.rows[0].count);

  const result = await query(
    `SELECT j.*, c.name_ar AS category_name,
       (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) AS application_count
     FROM jobs j
     LEFT JOIN categories c ON j.category_id = c.id
     WHERE ${whereClause}
     ORDER BY j.created_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, limit, offset]
  );

  return {
    jobs: result.rows,
    pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
  };
};

module.exports = { createJob, getApprovedJobs, getJobById, updateJob, deleteJob, getEmployerJobs };
