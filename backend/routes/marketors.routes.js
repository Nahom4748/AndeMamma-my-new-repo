const express = require("express");
const router = express.Router();
const marketorController = require("../controllers/marketor.controller");

// Define marketor-related routes
router.post("/suppliers/assign-marketer", marketorController.assignMarketer);
router.get("/suppliers/marketer-assignments", marketorController.getMarketerAssignments);
// get suplayer by marketer id
router.get("/suppliers/by-marketer/:marketerId", marketorController.getSuppliersByMarketerId); // Assuming you have a method to get suppliers by marketer ID
//remove the marketer from the supplier
router.delete("/suppliers/remove-marketer/:supplierId", marketorController.removeMarketerFromSupplier); // Assuming you have a method to remove marketer
router.post("/api/marketer-visits", marketorController.submitMarketerVisitPlan); // Assuming you have a method to submit visit plans
router.get("/api/marketer-visits",marketorController.marketorsVisitPlans)
router.delete("/api/marketer-visits/:visitId",marketorController.deletevisiting); // Assuming you have a method to remove marketer from supplier
router.put("/api/weekly-plan/:visitId",marketorController.UpdateVisitStatus); // Assuming you have a method to get visit plan by ID
router.get("/api/weeklyplan", marketorController.weeklyplan); // Assuming you have a method to get visit plan by ID
//get suplauers with suppliers with marketer id
router.get("/api/getMarketerSuppliersWithPerformance/:marketerId", marketorController.getMarketerSuppliersWithPerformancewithmarketorid); // Assuming you have a method to get suppliers with marketer performance
router.get("/api/suppliers-performance/with-marketer", marketorController.getSuppliersWithMarketerPerformance); // Assuming you have a method to get suppliers with marketer performance
router.get("/api/suppliers-performance/with-marketer/year-mounth", marketorController.getSuppliersWithMarketerPerformanceCountmouth); // Assuming you have a method to get suppliers with marketer performance count mouth
router.get("/api/suppliers/with-marketer/:marketerId", marketorController.getSuppliersWithMarketer); // Assuming you have a method to get suppliers with marketer by marketer ID
//get marketors wekly plan 
router.post("/suppliers/bulk-assign-marketer",marketorController.bulkAssign)
router.post("/api/marketer-orders",marketorController.marketerOrders)
router.get("/api/marketer-orders/:marketerId",marketorController.getActiveOrders)
router.put("/api/marketer-orders/:orderId",marketorController.updateOrderStatus)
router.get("/api/marketer-orders",marketorController.getOrders)

router.get("/api/marketers/:marketerId/suppliers",marketorController.getMarketerSuppliersFull)
router.get("/api/marketervisits/:marketorId",marketorController.getweaklypalnofmarketor); // Assuming you have a method to get visit plan by ID
module.exports = router;
