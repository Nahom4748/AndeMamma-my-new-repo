const express = require("express");
const router = express.Router();

// Import controller
const dashbordController = require("../controllers/dashbord.controller");

// Define dashboard-related routes
router.get("/api/getYearlyDashboardStats", dashbordController.GetYearlyDashboardStats);
//define getSupplierPerformance
router.get("/api/getSupplierPerformance", dashbordController.getSupplierPerformance);
//get getCollectionTypeBreakdown
router.get("/api/getCollectionTypeBreakdown", dashbordController.getCollectionTypeBreakdown);
//get getWeeklyCollectionTrends
router.get("/api/getWeeklyCollectionTrends", dashbordController.getWeeklyCollectionTrends);

//get getMonthlyData
router.get("/api/getMonthlyData", dashbordController.getMonthlyData);
router.get("/api/getYearlyData/:year", dashbordController.getYearlyData);

//get getEmployeePerformance
router.get("/api/getEmployeePerformance", dashbordController.getEmployeePerformance);
router.get("/api/weekly-plans", dashbordController.getdayPlan);



module.exports = router;