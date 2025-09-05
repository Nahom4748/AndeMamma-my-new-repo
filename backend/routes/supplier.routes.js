// routes/supplier.routes.js

const express = require("express");
const router = express.Router();

// Import controller
const supplierController = require("../controllers/supplier.controller");
const collectionController = require("../controllers/collection.controller");

// Define supplier-related routes
router.post("/suppliers", supplierController.CreateSupplier);
router.get("/suppliers", supplierController.Suppliers); // Assuming this exists
router.get("/regions", supplierController.Suppliersregions);
router.put("/suppliers/:id", supplierController.UpdateSupplier); // Assuming this exists
router.delete('/suppliers/:id', supplierController.DeleteSupplier);
router.get("/drivers", collectionController.Drivers); // Assuming this exists
router.get("/coordinators", collectionController.collectioncoordinator); // Assuming this exists
router.post("/collections", collectionController.CreateCollection); // Assuming this exists
router.post("/api/weekly-plan", collectionController.saveWeeklyPlans); // Assuming this exists

router.get("/api/weekly-plan", collectionController.getWeeklyPlan); // Assuming this exists
router.post("/api/weekly-plan/status", collectionController.weeklyplanstatus); // Assuming this exists
// post suplayer history
router.post("/supplier-history/:id", supplierController.addSupplierHistory); // Assuming this exists
// AVERVATION YEAR FOUND IGIBSTIOA LOGO WITH AVRIVATION ICON COLOR 
router.get("/api/SuppliersWithHistory",supplierController.getSuppliersWithHistory); // Assuming this exists
router.get("/api/collection/reports/papertype", collectionController.getCollectionReportByPaperType); // Assuming this exists
router.get("/api/reports/summarydata",collectionController.reportsummaryData); 
router.get("/sectors", collectionController.SectorData); // Assuming this exists
router.post("/customers", collectionController.addcustomer); // Assuming this exists
router.get("/customers", collectionController.getAllCustomers); // Assuming this exists
router.put("/customers/:id",collectionController.updateCustomer)
router.delete("/customers/:id",collectionController.deleteCustomer)


module.exports = router;
