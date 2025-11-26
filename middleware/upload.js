const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 1. Ensure uploads directory exists automatically
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Use original extension or default to .jpg
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  // 1. Check if the mime type starts with "image/" (Standard way)
  if (file.mimetype.startsWith('image/')) {
    return cb(null, true);
  }

  // 2. FALLBACK: Check extensions if mimetype is generic (Fixes Flutter 'application/octet-stream' issue)
  // This list covers basically every image type
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|tiff|svg|ico|heic|heif)$/i;
  
  if (imageExtensions.test(file.originalname)) {
    return cb(null, true);
  }

  cb(new Error('Only image files are allowed!'), false);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

module.exports = upload;