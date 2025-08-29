const itemService = require("../services/item.service");

async function CreateItem(req, res) {
  try {
    let itemData = req.body;
    
    // Parse numeric fields
    itemData.currentStock = parseInt(itemData.currentStock) || 0;
    itemData.unitPrice = parseFloat(itemData.unitPrice) || 0;
    itemData.salePrice = parseFloat(itemData.salePrice) || 0;
    itemData.minStockLevel = parseInt(itemData.minStockLevel) || 5;
    itemData.supplierId = parseInt(itemData.supplierId) || null;
    
    // Save image path (relative URL to access later)
    if (req.file) {
      itemData.image = `/uploads/${req.file.filename}`;
    }

    const newItem = await itemService.createItem(itemData);
    res.status(201).json({
      status: 'success',
      data: newItem,
    });
  } catch (error) {
    console.error('Error creating item:', error.message);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
}

async function GetAllItems(req, res) {
  try {
    const items = await itemService.getAllItems();
    res.status(200).json({
        status: 'success',
        data: items,
        });
    } catch (error) {
        console.error('Error retrieving items:', error);
        res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        });
    }
}



//add item provider
async function CreateItemProvider(req, res) {
    try {
        const itemProviderData = req.body;
        const newItemProvider = await itemService.createItemProvider(itemProviderData);
        res.status(201).json({
        status: "success",
        data: newItemProvider,
        });
    } catch (error) {
        console.error("Error creating item provider:", error.message);
        res.status(400).json({
        status: "error",
        message: error.message || "Internal server error",
        });
    }
    }
async function GetAllItemProviders(req, res) {
    try {
        const itemProviders = await itemService.getAllItemProviders();
        res.status(200).json({
        status: "success",
        data: itemProviders,
        });
    } catch (error) {
        console.error("Error retrieving item providers:", error);
        res.status(500).json({
        status: "error",
        message: "Internal server error",
        });
    }
    }
module.exports = {
    CreateItem,
    CreateItemProvider,
    GetAllItemProviders,
    GetAllItems
};

