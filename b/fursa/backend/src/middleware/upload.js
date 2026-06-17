// src/middleware/upload.js
// Handles CV file uploads using multer
// Validates file type and size before saving

const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Where and how to save uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/cvs'));
  },
  filename: (req, file, cb) => {
    // Generate unique filename: uuid + original extension
    // This prevents overwriting and hides original filenames
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `cv_${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

// Filter: only allow PDF, DOC, DOCX
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  const allowedExts = ['.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error('نوع الملف غير مسموح به. يُقبل فقط: PDF, DOC, DOCX'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 5) * 1024 * 1024, // 5MB default
  },
});

module.exports = upload;
