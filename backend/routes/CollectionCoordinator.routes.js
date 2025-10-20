const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const collectionCoordinatorController = require("../controllers/CollectionCoordinator.controller");

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/collection/"); // Save in collection folder
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"), false);
  }
});

// Routes
router.get("/api/collection-asignments/:userId", collectionCoordinatorController.getCollectionAssignments);
router.post("/api/collection-reports", upload.array('photos'), collectionCoordinatorController.submitCollectionReport);
router.get("/api/collection-report", collectionCoordinatorController.getCollectionReports);

module.exports = router;
