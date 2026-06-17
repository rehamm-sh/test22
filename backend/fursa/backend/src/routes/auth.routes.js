// src/routes/auth.routes.js

const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const { signupValidator, loginValidator } = require('../validators/auth.validators');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

// POST /api/auth/signup
router.post('/signup', signupValidator, validate, authController.signup);

// POST /api/auth/login
router.post('/login', loginValidator, validate, authController.login);

// GET /api/auth/me  (protected)
router.get('/me', authenticate, authController.getMe);

module.exports = router;
