const salesService = require('../services/sales.service');
// Function to handle creating a new sale
async function createSale(req, res) {
    try {
        const saleData = req.body;
        console.log("Received sale data:", saleData);
        const newSale = await salesService.createSale(saleData);
        res.status(201).json({
        status: "success",
        data: newSale,
        });
    } catch (error) {
        res.status(500).json({
        status: "error",
        message: error.message,
        });
    }
    }
// Function to handle fetching sales receipts
async function getSalesReceipts(req, res) {
    try {
        console.log("Fetching sales receipts");
        const receipts = await salesService.getSalesReceipts();
        res.status(200).json({
        status: "success",
        data: receipts,
        });
    } catch (error) {
        res.status(500).json({
        status: "error",
        message: error.message,
        });
    }
    }


module.exports = {
    createSale,
    getSalesReceipts
};