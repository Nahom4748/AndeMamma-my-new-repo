const express = require("express");
const router = express.Router();

// Import controller
const collectionController = require("../controllers/collection.controller");

// Define collection-related routes
router.get("/collectionstype", collectionController.CollectionsType); // Assuming this exists
router.get("/papertypes", collectionController.papertypes);
router.get("/drivers", collectionController.Drivers); // Assuming this exists
router.post("/collections", collectionController.CreateCollection); // Assuming this exists
router.get("/api/collection/summary",collectionController.collectionsummary); // Assuming this exists
router.get("/api/collection/types", collectionController.collectiontypes); // Assuming this exists
// router.get("/api/collection/list", collectionController.collectionlist); // Assuming this exists
router.get("/api/collection/list", collectionController.collectionlist); // Assuming this exists
// router.get("/api/reports/summary", collectionController.reportsummary); // Assuming this exists
router.get("/api/reports/summary", collectionController.reportsummary); // Assuming this exists
router.get("/api/daily-collections", collectionController.dailyCollectionReport); // Assuming this exists
//get collection repert by papertype 
router.get("/api/collection/reports/papertype", collectionController.getCollectionReportByPaperType); // Assuming this exists
// Assuming this exists
module.exports = router;  
