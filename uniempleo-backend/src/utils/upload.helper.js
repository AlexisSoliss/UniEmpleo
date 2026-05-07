// src/utils/upload.helper.js
// Configuración de multer para subida de CVs en PDF (máx. 5 MB) — RF-08

const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

// Carpeta donde se guardan los CVs localmente
const CV_DIR = path.join(__dirname, '../../uploads/cvs');
if (!fs.existsSync(CV_DIR)) fs.mkdirSync(CV_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, CV_DIR),
  filename: (_req, file, cb) => {
    const ts   = Date.now();
    const ext  = path.extname(file.originalname);
    cb(null, `cv_${ts}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos PDF.'), false);
  }
};

const uploadCV = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

module.exports = { uploadCV };
