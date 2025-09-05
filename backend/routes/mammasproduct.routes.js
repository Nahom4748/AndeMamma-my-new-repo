const express = require("express");
const router = express.Router();

const mammasProductController = require("../controllers/mammasproduct.controller");

// Define mammas product-related routes
router.post("/api/mammasproduct", mammasProductController.createMammasProduct);
router.get("/api/mammasproduct", mammasProductController.getAllMammasProducts);
router.put("/api/mammasproduct/:id", mammasProductController.updateMammasProduct);
router.delete("/api/mammasproduct/:id", mammasProductController.deleteMammasProduct);
router.post("/api/mammas-products", mammasProductController.createMultipleMammasProducts);
//get all mamas payments
router.get("/api/mamas/payments", mammasProductController.getMamaPayments);

module.exports = router;