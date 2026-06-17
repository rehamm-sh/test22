// src/controllers/auth.controller.js

const authService = require('../services/auth.service');
const { sendSuccess, sendError } = require('../utils/response');

const signup = async (req, res, next) => {
  try {
    const result = await authService.signup(req.body);
    return sendSuccess(res, 201, 'تم إنشاء الحساب بنجاح', result);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    return sendSuccess(res, 200, 'تم تسجيل الدخول بنجاح', result);
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    return sendSuccess(res, 200, 'تم جلب بيانات المستخدم', user);
  } catch (error) {
    next(error);
  }
};

module.exports = { signup, login, getMe };
