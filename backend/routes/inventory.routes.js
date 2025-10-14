const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const e = require('express');

// Routes
router.post('/inventory', inventoryController.CreateInventory);
router.get('/inventory', inventoryController.getAllInventory);
router.get('/last-inventory', inventoryController.getLastInventory);
router.post('/inventorysell', inventoryController.CreateInventorySell);
router.get('/inventorysell', inventoryController.getAllInventorySell);

module.exports = router;