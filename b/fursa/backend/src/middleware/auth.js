// src/middleware/auth.js
// Two middleware functions:
// 1. authenticate  → checks JWT token, adds user to req.user
// 2. authorize     → checks if the user has the required role(s)

const { verifyToken } = require('../utils/jwt');
const { sendError } = require('../utils/response');
const { query } = require('../config/database');

/**
 * authenticate
 * Reads the Bearer token from the Authorization header,
 * verifies it, fetches the user from DB, and attaches to req.user
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header: "Authorization: Bearer <token>"
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, 'يجب تسجيل الدخول للوصول إلى هذه الصفحة');
    }

    const token = authHeader.split(' ')[1];

    // Verify the token signature and expiry
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return sendError(res, 401, 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً');
      }
      return sendError(res, 401, 'رمز المصادقة غير صالح');
    }

    // Fetch fresh user data from DB (in case account was deactivated)
    const result = await query(
      'SELECT id, name, email, role, is_active FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return sendError(res, 401, 'المستخدم غير موجود');
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return sendError(res, 403, 'تم تعطيل هذا الحساب، يرجى التواصل مع الإدارة');
    }

    // Attach user to request object for use in controllers
    req.user = user;
    next();

  } catch (error) {
    console.error('[Auth Middleware Error]', error.message);
    return sendError(res, 500, 'خطأ في التحقق من الهوية');
  }
};

/**
 * authorize(...roles)
 * Usage: authorize('admin'), authorize('employer', 'admin')
 * Must be used AFTER authenticate
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, 'يجب تسجيل الدخول أولاً');
    }
    if (!roles.includes(req.user.role)) {
      return sendError(res, 403, 'ليس لديك صلاحية للوصول إلى هذه الصفحة');
    }
    next();
  };
};

module.exports = { authenticate, authorize };
