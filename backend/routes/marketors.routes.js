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
router.get("/api/suppliers/with-marketer/:marketerId", marketorController.getSuppliersWithMarketer); // Assuming you have a method to get suppliers with marketer by marketer ID
//get marketors wekly plan 
router.get("/api/marketervisits/:marketorId",marketorController.getweaklypalnofmarketor); // Assuming you have a method to get visit plan by ID
module.exports = router;
