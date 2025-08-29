const express = require("express");
const router = express.Router();

const salesController = require("../controllers/sales.controller");

// Define sales-related routes
router.post("/sales", salesController.createSale);
//get resipts of sales

router.get("/api/receipts", salesController.getSalesReceipts);

//export the router
module.exports = router;