// src/controllers/application.controller.js

const appService = require('../services/application.service');
const { sendSuccess } = require('../utils/response');

const applyToJob = async (req, res, next) => {
  try {
    const application = await appService.applyToJob(
      parseInt(req.params.jobId),
      req.user.id,
      req.body,
      req.file || null
    );
    return sendSuccess(res, 201, 'تم إرسال طلبك بنجاح', application);
  } catch (error) { next(error); }
};

const getJobApplications = async (req, res, next) => {
  try {
    const applications = await appService.getJobApplications(
      parseInt(req.params.jobId),
      req.user.id
    );
    return sendSuccess(res, 200, 'تم جلب الطلبات', applications);
  } catch (error) { next(error); }
};

const getMyApplications = async (req, res, next) => {
  try {
    const result = await appService.getMyApplications(req.user.id, req.query);
    return sendSuccess(res, 200, 'تم جلب طلباتك', result);
  } catch (error) { next(error); }
};

const updateApplicationStatus = async (req, res, next) => {
  try {
    const application = await appService.updateApplicationStatus(
      parseInt(req.params.applicationId),
      req.user.id,
      req.body.status
    );
    return sendSuccess(res, 200, 'تم تحديث حالة الطلب', application);
  } catch (error) { next(error); }
};

module.exports = { applyToJob, getJobApplications, getMyApplications, updateApplicationStatus };
