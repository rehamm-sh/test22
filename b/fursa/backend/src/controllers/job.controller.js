// src/controllers/job.controller.js

const jobService = require('../services/job.service');
const { sendSuccess, sendError } = require('../utils/response');

const createJob = async (req, res, next) => {
  try {
    const job = await jobService.createJob(req.user.id, req.body);
    return sendSuccess(res, 201,
      'تم إرسال الوظيفة بنجاح وهي بانتظار مراجعة الإدارة', job);
  } catch (error) { next(error); }
};

const getJobs = async (req, res, next) => {
  try {
    const result = await jobService.getApprovedJobs(req.query);
    return sendSuccess(res, 200, 'تم جلب الوظائف', result);
  } catch (error) { next(error); }
};

const getJobById = async (req, res, next) => {
  try {
    const job = await jobService.getJobById(parseInt(req.params.id), true);
    return sendSuccess(res, 200, 'تم جلب تفاصيل الوظيفة', job);
  } catch (error) { next(error); }
};

const updateJob = async (req, res, next) => {
  try {
    const job = await jobService.updateJob(parseInt(req.params.id), req.user.id, req.body);
    return sendSuccess(res, 200, 'تم تحديث الوظيفة وأُعيد إرسالها للمراجعة', job);
  } catch (error) { next(error); }
};

const deleteJob = async (req, res, next) => {
  try {
    await jobService.deleteJob(parseInt(req.params.id), req.user.id, req.user.role);
    return sendSuccess(res, 200, 'تم حذف الوظيفة');
  } catch (error) { next(error); }
};

const getMyJobs = async (req, res, next) => {
  try {
    const result = await jobService.getEmployerJobs(req.user.id, req.query);
    return sendSuccess(res, 200, 'تم جلب وظائفك', result);
  } catch (error) { next(error); }
};

module.exports = { createJob, getJobs, getJobById, updateJob, deleteJob, getMyJobs };
