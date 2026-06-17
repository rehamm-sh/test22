// src/controllers/admin.controller.js

const adminService = require('../services/admin.service');
const { sendSuccess } = require('../utils/response');

const getDashboard = async (req, res, next) => {
  try {
    const stats = await adminService.getDashboardStats();
    return sendSuccess(res, 200, 'إحصائيات لوحة التحكم', stats);
  } catch (err) { next(err); }
};

// ── JOBS ──────────────────────────────────────────────────────
const getAllJobs = async (req, res, next) => {
  try {
    const result = await adminService.getAllJobs(req.query);
    return sendSuccess(res, 200, 'تم جلب جميع الوظائف', result);
  } catch (err) { next(err); }
};

const getJobDetail = async (req, res, next) => {
  try {
    const job = await adminService.getJobDetail(parseInt(req.params.jobId));
    return sendSuccess(res, 200, 'تفاصيل الوظيفة', job);
  } catch (err) { next(err); }
};

const reviewJob = async (req, res, next) => {
  try {
    const { action, rejection_reason } = req.body;
    const job = await adminService.reviewJob(parseInt(req.params.jobId), action, rejection_reason);
    const msg = action === 'approved' ? 'تمت الموافقة على الوظيفة' : 'تم رفض الوظيفة';
    return sendSuccess(res, 200, msg, job);
  } catch (err) { next(err); }
};

const deleteJob = async (req, res, next) => {
  try {
    const result = await adminService.deleteJobAdmin(parseInt(req.params.jobId));
    return sendSuccess(res, 200, 'تم حذف الوظيفة', result);
  } catch (err) { next(err); }
};

// ── USERS ─────────────────────────────────────────────────────
const getAllUsers = async (req, res, next) => {
  try {
    const result = await adminService.getAllUsers(req.query);
    return sendSuccess(res, 200, 'تم جلب جميع المستخدمين', result);
  } catch (err) { next(err); }
};

const getUserDetail = async (req, res, next) => {
  try {
    const user = await adminService.getUserDetail(parseInt(req.params.userId));
    return sendSuccess(res, 200, 'تفاصيل المستخدم', user);
  } catch (err) { next(err); }
};

const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await adminService.toggleUserStatus(parseInt(req.params.userId));
    const msg = user.is_active ? 'تم تفعيل الحساب' : 'تم تعطيل الحساب';
    return sendSuccess(res, 200, msg, user);
  } catch (err) { next(err); }
};

const deleteUser = async (req, res, next) => {
  try {
    await adminService.deleteUser(parseInt(req.params.userId));
    return sendSuccess(res, 200, 'تم حذف المستخدم');
  } catch (err) { next(err); }
};

// ── CATEGORIES ────────────────────────────────────────────────
const getCategories = async (req, res, next) => {
  try {
    const categories = await adminService.getCategories();
    return sendSuccess(res, 200, 'تم جلب الفئات', categories);
  } catch (err) { next(err); }
};

const createCategory = async (req, res, next) => {
  try {
    const category = await adminService.createCategory(req.body);
    return sendSuccess(res, 201, 'تم إنشاء الفئة', category);
  } catch (err) { next(err); }
};

const toggleCategoryStatus = async (req, res, next) => {
  try {
    const category = await adminService.toggleCategoryStatus(parseInt(req.params.categoryId));
    return sendSuccess(res, 200, 'تم تحديث حالة الفئة', category);
  } catch (err) { next(err); }
};

const deleteCategory = async (req, res, next) => {
  try {
    await adminService.deleteCategory(parseInt(req.params.categoryId));
    return sendSuccess(res, 200, 'تم حذف الفئة');
  } catch (err) { next(err); }
};

// ── APPLICATIONS ──────────────────────────────────────────────
const getAllApplications = async (req, res, next) => {
  try {
    const result = await adminService.getAllApplications(req.query);
    return sendSuccess(res, 200, 'تم جلب جميع الطلبات', result);
  } catch (err) { next(err); }
};

module.exports = {
  getDashboard,
  getAllJobs, getJobDetail, reviewJob, deleteJob,
  getAllUsers, getUserDetail, toggleUserStatus, deleteUser,
  getCategories, createCategory, toggleCategoryStatus, deleteCategory,
  getAllApplications,
};
