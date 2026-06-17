// src/services/admin.service.js

const { query } = require('../config/database');

/**
 * Get admin dashboard statistics
 */
const getDashboardStats = async () => {
  const [users, jobs, applications, pendingJobs] = await Promise.all([
    query(`SELECT
             COUNT(*) AS total,
             COUNT(*) FILTER (WHERE role = 'job_seeker') AS job_seekers,
             COUNT(*) FILTER (WHERE role = 'employer') AS employers
           FROM users WHERE role != 'admin'`),
    query(`SELECT
             COUNT(*) AS total,
             COUNT(*) FILTER (WHERE status = 'pending')  AS pending,
             COUNT(*) FILTER (WHERE status = 'approved') AS approved,
             COUNT(*) FILTER (WHERE status = 'rejected') AS rejected
           FROM jobs`),
    query('SELECT COUNT(*) AS total FROM applications'),
    query(`SELECT
             j.id, j.title, j.company_name, j.city, j.created_at,
             u.name AS employer_name
           FROM jobs j
           JOIN users u ON j.employer_id = u.id
           WHERE j.status = 'pending'
           ORDER BY j.created_at ASC
           LIMIT 5`),
  ]);

  return {
    users: users.rows[0],
    jobs: jobs.rows[0],
    applications: applications.rows[0],
    latest_pending_jobs: pendingJobs.rows,
  };
};

/**
 * Get all jobs for admin (all statuses, with filters)
 */
const getAllJobs = async ({ page = 1, limit = 15, status, search }) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];
  let idx = 1;

  if (status) {
    conditions.push(`j.status = $${idx}`);
    params.push(status);
    idx++;
  }
  if (search) {
    conditions.push(`(j.title ILIKE $${idx} OR j.company_name ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await query(`SELECT COUNT(*) FROM jobs j ${where}`, params);
  const total = parseInt(countResult.rows[0].count);

  const result = await query(
    `SELECT
       j.id, j.title, j.company_name, j.city, j.job_type,
       j.status, j.created_at, j.views_count,
       u.name AS employer_name, u.email AS employer_email,
       c.name_ar AS category_name,
       (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) AS application_count
     FROM jobs j
     JOIN users u ON j.employer_id = u.id
     LEFT JOIN categories c ON j.category_id = c.id
     ${where}
     ORDER BY
       CASE j.status WHEN 'pending' THEN 1 WHEN 'approved' THEN 2 ELSE 3 END,
       j.created_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, limit, offset]
  );

  return {
    jobs: result.rows,
    pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
  };
};

/**
 * Approve or reject a job
 */
const reviewJob = async (jobId, action, rejection_reason) => {
  if (!['approved', 'rejected'].includes(action)) {
    const error = new Error('الإجراء غير صالح');
    error.statusCode = 400;
    throw error;
  }

  if (action === 'rejected' && !rejection_reason) {
    const error = new Error('سبب الرفض مطلوب عند رفض الوظيفة');
    error.statusCode = 400;
    throw error;
  }

  const result = await query(
    `UPDATE jobs
     SET status = $1, rejection_reason = $2, updated_at = NOW()
     WHERE id = $3
     RETURNING id, title, status`,
    [action, rejection_reason || null, jobId]
  );

  if (result.rows.length === 0) {
    const error = new Error('الوظيفة غير موجودة');
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
};

/**
 * Get all users (with optional role filter and search)
 */
const getAllUsers = async ({ page = 1, limit = 15, role, search }) => {
  const offset = (page - 1) * limit;
  const conditions = [`u.role != 'admin'`];
  const params = [];
  let idx = 1;

  if (role) {
    conditions.push(`u.role = $${idx}`);
    params.push(role);
    idx++;
  }
  if (search) {
    conditions.push(`(u.name ILIKE $${idx} OR u.email ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  const where = `WHERE ${conditions.join(' AND ')}`;

  const countResult = await query(`SELECT COUNT(*) FROM users u ${where}`, params);
  const total = parseInt(countResult.rows[0].count);

  const result = await query(
    `SELECT
       u.id, u.name, u.email, u.role, u.is_active, u.created_at,
       ep.company_name
     FROM users u
     LEFT JOIN employer_profiles ep ON u.id = ep.user_id
     ${where}
     ORDER BY u.created_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, limit, offset]
  );

  return {
    users: result.rows,
    pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
  };
};

/**
 * Toggle user active/inactive
 */
const toggleUserStatus = async (userId) => {
  const result = await query(
    `UPDATE users
     SET is_active = NOT is_active, updated_at = NOW()
     WHERE id = $1 AND role != 'admin'
     RETURNING id, name, is_active`,
    [userId]
  );

  if (result.rows.length === 0) {
    const error = new Error('المستخدم غير موجود');
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
};

/**
 * Get all categories
 */
const getCategories = async () => {
  const result = await query(
    `SELECT c.*, COUNT(j.id) AS job_count
     FROM categories c
     LEFT JOIN jobs j ON c.id = j.category_id AND j.status = 'approved'
     GROUP BY c.id
     ORDER BY c.name_ar`
  );
  return result.rows;
};

/**
 * Create a new category
 */
const createCategory = async ({ name, name_ar, icon }) => {
  const result = await query(
    `INSERT INTO categories (name, name_ar, icon)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [name, name_ar, icon || null]
  );
  return result.rows[0];
};

/**
 * Toggle category active/inactive
 */
const toggleCategoryStatus = async (categoryId) => {
  const result = await query(
    `UPDATE categories SET is_active = NOT is_active WHERE id = $1 RETURNING *`,
    [categoryId]
  );
  if (result.rows.length === 0) {
    const error = new Error('الفئة غير موجودة');
    error.statusCode = 404;
    throw error;
  }
  return result.rows[0];
};

/**
 * Get all applications (admin overview)
 */
const getAllApplications = async ({ page = 1, limit = 15 }) => {
  const offset = (page - 1) * limit;
  const countResult = await query('SELECT COUNT(*) FROM applications');
  const total = parseInt(countResult.rows[0].count);

  const result = await query(
    `SELECT
       a.id, a.full_name, a.email, a.phone, a.status, a.applied_at,
       j.title AS job_title, j.company_name,
       u.name AS applicant_username
     FROM applications a
     JOIN jobs j ON a.job_id = j.id
     JOIN users u ON a.applicant_id = u.id
     ORDER BY a.applied_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return {
    applications: result.rows,
    pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
  };
};

// (exports moved to end)

/**
 * Get single job detail (admin view - any status)
 */
const getJobDetail = async (jobId) => {
  const result = await query(
    `SELECT j.*, c.name_ar AS category_name,
       u.name AS employer_name, u.email AS employer_email,
       ep.company_name, ep.phone AS employer_phone,
       (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) AS application_count
     FROM jobs j
     LEFT JOIN categories c ON j.category_id = c.id
     JOIN users u ON j.employer_id = u.id
     LEFT JOIN employer_profiles ep ON u.id = ep.user_id
     WHERE j.id = $1`,
    [jobId]
  );
  if (!result.rows.length) {
    const e = new Error('الوظيفة غير موجودة'); e.statusCode = 404; throw e;
  }
  return result.rows[0];
};

/**
 * Admin deletes any job
 */
const deleteJobAdmin = async (jobId) => {
  const result = await query(
    'DELETE FROM jobs WHERE id = $1 RETURNING id, title',
    [jobId]
  );
  if (!result.rows.length) {
    const e = new Error('الوظيفة غير موجودة'); e.statusCode = 404; throw e;
  }
  return result.rows[0];
};

/**
 * Get single user detail with profile
 */
const getUserDetail = async (userId) => {
  const userResult = await query(
    'SELECT id, name, email, role, is_active, created_at FROM users WHERE id = $1',
    [userId]
  );
  if (!userResult.rows.length) {
    const e = new Error('المستخدم غير موجود'); e.statusCode = 404; throw e;
  }
  const user = userResult.rows[0];

  let profile = null;
  if (user.role === 'employer') {
    const p = await query(
      'SELECT * FROM employer_profiles WHERE user_id = $1', [userId]
    );
    profile = p.rows[0] || null;
  } else if (user.role === 'job_seeker') {
    const p = await query(
      'SELECT * FROM job_seeker_profiles WHERE user_id = $1', [userId]
    );
    profile = p.rows[0] || null;
  }

  // Count jobs or applications
  let stats = {};
  if (user.role === 'employer') {
    const s = await query(
      `SELECT COUNT(*) AS total,
         COUNT(*) FILTER (WHERE status='approved') AS approved,
         COUNT(*) FILTER (WHERE status='pending') AS pending
       FROM jobs WHERE employer_id = $1`, [userId]
    );
    stats = s.rows[0];
  } else if (user.role === 'job_seeker') {
    const s = await query(
      'SELECT COUNT(*) AS total FROM applications WHERE applicant_id = $1', [userId]
    );
    stats = s.rows[0];
  }

  return { ...user, profile, stats };
};

/**
 * Admin permanently deletes a user (cascades to their jobs/applications)
 */
const deleteUser = async (userId) => {
  // Prevent deleting admins
  const check = await query(
    'SELECT role FROM users WHERE id = $1', [userId]
  );
  if (!check.rows.length) {
    const e = new Error('المستخدم غير موجود'); e.statusCode = 404; throw e;
  }
  if (check.rows[0].role === 'admin') {
    const e = new Error('لا يمكن حذف حساب مدير'); e.statusCode = 403; throw e;
  }

  await query('DELETE FROM users WHERE id = $1', [userId]);
  return { deleted: true };
};

/**
 * Delete a category (only if no approved jobs use it)
 */
const deleteCategory = async (categoryId) => {
  const check = await query(
    `SELECT COUNT(*) AS cnt FROM jobs
     WHERE category_id = $1 AND status = 'approved'`,
    [categoryId]
  );
  if (parseInt(check.rows[0].cnt) > 0) {
    const e = new Error('لا يمكن حذف فئة تحتوي على وظائف معتمدة');
    e.statusCode = 400; throw e;
  }
  // Set category_id to NULL on remaining jobs
  await query('UPDATE jobs SET category_id = NULL WHERE category_id = $1', [categoryId]);
  await query('DELETE FROM categories WHERE id = $1', [categoryId]);
  return { deleted: true };
};

module.exports = {
  getDashboardStats, getAllJobs, getJobDetail, reviewJob, deleteJobAdmin,
  getAllUsers, getUserDetail, toggleUserStatus, deleteUser,
  getCategories, createCategory, toggleCategoryStatus, deleteCategory,
  getAllApplications,
};
