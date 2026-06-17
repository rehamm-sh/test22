// src/routes/category.routes.js
// Public routes for categories (no auth needed)

const router = require('express').Router();
const { query } = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

// GET /api/categories  - list all active categories
router.get('/', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT c.id, c.name, c.name_ar, c.icon,
         COUNT(j.id) AS job_count
       FROM categories c
       LEFT JOIN jobs j ON c.id = j.category_id AND j.status = 'approved'
       WHERE c.is_active = true
       GROUP BY c.id
       ORDER BY c.name_ar`
    );
    return sendSuccess(res, 200, 'تم جلب الفئات', result.rows);
  } catch (error) { next(error); }
});

module.exports = router;
