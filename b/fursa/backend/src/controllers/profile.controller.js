// src/controllers/profile.controller.js

const profileService = require('../services/profile.service');
const { sendSuccess } = require('../utils/response');

const getProfile = async (req, res, next) => {
  try {
    let profile;
    if (req.user.role === 'employer') {
      profile = await profileService.getEmployerProfile(req.user.id);
    } else {
      profile = await profileService.getJobSeekerProfile(req.user.id);
    }
    return sendSuccess(res, 200, 'تم جلب الملف الشخصي', profile);
  } catch (err) { next(err); }
};

const updateProfile = async (req, res, next) => {
  try {
    let profile;
    if (req.user.role === 'employer') {
      profile = await profileService.updateEmployerProfile(req.user.id, req.body);
    } else {
      profile = await profileService.updateJobSeekerProfile(req.user.id, req.body);
    }
    return sendSuccess(res, 200, 'تم تحديث الملف الشخصي', profile);
  } catch (err) { next(err); }
};

const uploadCV = async (req, res, next) => {
  try {
    if (!req.file) {
      return require('../utils/response').sendError(res, 400, 'لم يتم رفع أي ملف');
    }
    const result = await profileService.updateCV(req.user.id, req.file);
    return sendSuccess(res, 200, 'تم رفع السيرة الذاتية بنجاح', result);
  } catch (err) { next(err); }
};

const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    await profileService.changePassword(req.user.id, current_password, new_password);
    return sendSuccess(res, 200, 'تم تغيير كلمة المرور بنجاح');
  } catch (err) { next(err); }
};

module.exports = { getProfile, updateProfile, uploadCV, changePassword };
