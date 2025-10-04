const express = require("express");
const router = express.Router();

// Import controller
const collectionController = require("../controllers/collection.controller");

// Define collection-related routes
router.get("/collectionstype", collectionController.CollectionsType); // Assuming this exists
router.get("/papertypes", collectionController.papertypes);
router.get("/payment", collectionController.getCollectionsByDateRange);
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
router.get("/api/collection/getWeeklyCollectionData", collectionController.getWeeklyCollectionData); // Assuming this exists
router.get("/api/getCollectionTypeData", collectionController.getCollectionTypeData); // Assuming this exists
router.get("/api/getMonthlyTrendData", collectionController.getMonthlyTrendData); // Assuming this exists
router.get("/api/getDashboardStats", collectionController.getDashboardStats); // Assuming this exists
router.get("/api/suppliers-stats", collectionController.suppliersstats); // Assuming this exists
router.get("/api/most-active-days", collectionController.mostactivedays); // Assuming this exists


router.post("/api/collection-plans",collectionController.createregularpaln); // Assuming this exists
router.post("/api/in-store-plans",collectionController.createinstoreplan); // Assuming this exists

// /collection-sessions
router.post("/api/collection-sessions",collectionController.createCollectionSession); // Assuming this exists
router.get("/collection-sessions", collectionController.getCollectionSession); // Assuming this exists
router.put("/api/collection-sessions/:sessionId", collectionController.updatesessions); // Assuming this exists
router.post("/site-evaluation-reports",collectionController.siteevaluationreports)
router.get("/site-evaluation-reports",collectionController.getAllCostEvaluations)
router.delete("/site-evaluation-reports/:id",collectionController.siteevaluationdelet)
router.get("/api/collectioncorninatordashbord",collectionController.collectioncordinatordashbord)
router.get("/api/marketersperformance/:marketerId/suppliers",collectionController.getSuppliersWithCollections)
module.exports = router;  
