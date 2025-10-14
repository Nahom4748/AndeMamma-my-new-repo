const express = require('express');
const router = express.Router();
const innovationController = require('../controllers/innovation.controller');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ✅ Ensure upload directory exists
const innovationUploadDir = path.join(__dirname, '..', 'uploads', 'innovations');
if (!fs.existsSync(innovationUploadDir)) {
  fs.mkdirSync(innovationUploadDir, { recursive: true });
  console.log('📁 Created folder:', innovationUploadDir);
}

// ✅ Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, innovationUploadDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  },
});

// ✅ Routes
router.post('/innovations', upload.single('image'), innovationController.createInnovation);
router.get('/innovations', innovationController.getAllInnovations);
router.delete('/innovations/:id', innovationController.deleteInnovation); // ✅ Added delete route

module.exports = router;