const express = require("express");
const router = express.Router();

const monthlyController = require("../controllers/monthly.controller");
// Define marketor-related routes
router.get("/api/monthly-report", monthlyController.monthlyReport); // Assuming you have a
// fetch employee munthly performance

router.get("/api/employee-monthly-performance", monthlyController.employeeMonthlyPerformance); // Assuming you have a


module.exports = router;