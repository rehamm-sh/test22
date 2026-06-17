// src/middleware/errorHandler.js
// Global error handler - catches any error thrown in controllers
// Must be registered LAST in server.js (after all routes)

const { sendError } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error('[Global Error]', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
  });

  // PostgreSQL unique constraint violation (e.g. duplicate email)
  if (err.code === '23505') {
    return sendError(res, 409, 'هذا البريد الإلكتروني مسجل مسبقاً');
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return sendError(res, 400, 'بيانات مرجعية غير صالحة');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 401, 'رمز المصادقة غير صالح');
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 401, 'انتهت صلاحية الجلسة');
  }

  // Multer file errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return sendError(res, 400, 'حجم الملف يتجاوز الحد المسموح به (5 ميغابايت)');
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return sendError(res, 400, 'حقل الملف غير متوقع');
  }

  // Default server error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'حدث خطأ في الخادم';

  return sendError(
    res,
    statusCode,
    process.env.NODE_ENV === 'development' ? message : 'حدث خطأ في الخادم'
  );
};

// Handle 404 - route not found
const notFound = (req, res) => {
  return sendError(res, 404, `المسار غير موجود: ${req.method} ${req.originalUrl}`);
};

module.exports = { errorHandler, notFound };
