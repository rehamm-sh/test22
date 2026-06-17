// src/server.js
// Entry point of the entire backend

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const authRoutes        = require('./routes/auth.routes');
const jobRoutes         = require('./routes/job.routes');
const applicationRoutes = require('./routes/application.routes');
const adminRoutes       = require('./routes/admin.routes');
const categoryRoutes    = require('./routes/category.routes');
const profileRoutes     = require('./routes/profile.routes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

// ─── SECURITY MIDDLEWARE ────────────────────────────────────────
// helmet: sets secure HTTP headers automatically
app.use(helmet());

// CORS: allows your frontend to call this API
app.use(cors({
  // In development allow any origin (file://, localhost:3000, etc.)
  // In production set FRONTEND_URL in .env to your real domain
  origin: process.env.NODE_ENV === 'production'
    ? (process.env.FRONTEND_URL || '*')
    : '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Rate limiter: prevents brute-force attacks
// Max 100 requests per IP per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'طلبات كثيرة جداً، يرجى الانتظار قليلاً' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Stricter limiter for auth endpoints (prevent password guessing)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  // 10 in production, 1000 in development (so you can test freely)
  max: process.env.NODE_ENV === 'production' ? 10 : 1000,
  message: { success: false, message: 'محاولات كثيرة جداً، يرجى الانتظار 15 دقيقة' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);

// ─── GENERAL MIDDLEWARE ─────────────────────────────────────────
// Parse JSON request bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logging (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Serve uploaded CVs as static files
// e.g. GET /uploads/cvs/cv_abc123.pdf
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── ROUTES ────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/profile',      profileRoutes);
app.use('/api/jobs',         jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin',        adminRoutes);
app.use('/api/categories',   categoryRoutes);

// Health check endpoint (used by Render.com to verify the server is alive)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Root
app.get('/', (req, res) => {
  res.json({
    message: 'Fursa API - منصة فُرَص للوظائف',
    version: '1.0.0',
    docs: '/health',
  });
});

// ─── ERROR HANDLING ────────────────────────────────────────────
// 404 handler (must be AFTER all routes)
app.use(notFound);

// Global error handler (must be LAST)
app.use(errorHandler);

// ─── START SERVER ───────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('\n═══════════════════════════════════════════');
  console.log(`  🚀 Fursa API running on port ${PORT}`);
  console.log(`  🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  🔗 http://localhost:${PORT}`);
  console.log('═══════════════════════════════════════════\n');
});

module.exports = app;
