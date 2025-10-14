const inventoryController = require('../services/inventory.controller');

async function CreateInventory(req, res) {
  try {
    const inventoryData = req.body;
    console.log('inventoryData:', inventoryData);
    const newInventory = await inventoryController.createInventory(inventoryData);
    res.status(201).json({
      status: 'success',
      data: newInventory,
    });
    } catch (error) {
    console.error('Error creating inventory:', error.message);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
}

async function getAllInventory(req, res) {
  try {
    const inventories = await inventoryController.getAllInventories();
    res.status(200).json({
      status: 'success',
      data: inventories,
    });
  } catch (error) {
    console.error('Error retrieving inventories:', error);
    res.status(500).json({
      status: 'error',
        message: 'Internal server error',
    });
  }
}
// Add more controller functions as needed
async function CreateInventorySell(req, res) {
  try {
    const inventorySellData = req.body;
    const newInventorySell = await inventoryController.createInventorySell(inventorySellData);
    res.status(201).json({
      status: 'success',
      data: newInventorySell,
    });
  }
    catch (error) {
    console.error('Error creating inventory sell:', error.message);
    res.status(400).json({
      status: 'error',
        message: error.message || 'Internal server error',
    });
    }
}

async function getAllInventorySell(req, res) {
  try {
    const inventorySells = await inventoryController.getAllInventorySells();
    res.status(200).json({
      status: 'success',
      data: inventorySells,
    });
  } catch (error) {
    console.error('Error retrieving inventory sells:', error);
    res.status(500).json({
        status: 'error',
        message: 'Internal server error',
    });
  }
}


async function getLastInventory(req, res) {
  try {
    const lastInventory = await inventoryController.getLastInventoryEntry();
    res.status(200).json({
        status: 'success',
        data: lastInventory,
    });
  } catch (error) {
    console.error('Error retrieving last inventory entry:', error);
    res.status(500).json({
        status: 'error',
        message: 'Internal server error',
    });
  }
}
module.exports = {
    CreateInventory,
    getAllInventory,
    CreateInventorySell,
    getAllInventorySell,
    getLastInventory,
    // Export other functions as needed
};