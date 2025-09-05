//i ma in controller define server and routes for mammas product
const mammasProductService = require("../services/mammasproduct.service");

// Create a new mammas product
async function createMammasProduct(req, res) {
  try {
    const productData = req.body;
    console.log(productData);
    const newProduct = await mammasProductService.createMammasProduct(productData);
    res.status(201).json({ status: 'success', data: newProduct });
  } catch (error) {
    console.error('Error creating mammas product:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
}
// Get all mammas products
async function getAllMammasProducts(req, res) {
  try {
    const products = await mammasProductService.getAllMammasProducts();
    res.status(200).json({ status: 'success', data: products });
  } catch (error) {
    console.error('Error fetching mammas products:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
}

// Update a mammas product by ID
async function updateMammasProduct(req, res) {
    try {
        const productId = req.params.id;
        const updateData = req.body;
        console.log(productId, updateData);
        const updatedProduct = await mammasProductService.updateMammasProduct(productId, updateData);
        res.status(200).json({ status: 'success', data: updatedProduct });
    } catch (error) {
        console.error('Error updating mammas product:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
}
// Delete a mammas product by ID
async function deleteMammasProduct(req, res) {
    try {
        const productId = req.params.id;
        await mammasProductService.deleteMammasProduct(productId);
        res.status(200).json({ status: 'success', message: 'Mammas product deleted successfully' });
    } catch (error) {
        console.error('Error deleting mammas product:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
}

// mama dayl
async function createMultipleMammasProducts(req, res) {
    try {
        const productsData = req.body;
        console.log(productsData);
    
      
            const newProduct = await mammasProductService.mamasDaylyProduct(productsData);
        
        res.status(201).json({ status: 'success', data: newProduct });
    } catch (error) {
        console.error('Error creating multiple mammas products:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
}


async function getMamaPayments(req, res) {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "startDate and endDate are required" });
    }

    const data = await mammasProductService.getMamaPaymentsByDateRange(startDate, endDate);

    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("Error fetching mama payments:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}


module.exports = {
  createMammasProduct,
  getAllMammasProducts,
  updateMammasProduct,
  deleteMammasProduct,
    createMultipleMammasProducts,
    getMamaPayments
};


