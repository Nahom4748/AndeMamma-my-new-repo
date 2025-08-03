// controllers/supplier.controller.js
const supplierService = require('../services/supplier.service');

async function CreateSupplier(req, res) {
  try {
    const supplierData = req.body;
    const newSupplier = await supplierService.createSupplier(supplierData);
    res.status(201).json({
      status: 'success',
      data: newSupplier,
    });
  } catch (error) {
    console.error('Error creating supplier:', error.message);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
}

async function Suppliers(req, res) {
  try {
    const suppliers = await supplierService.getSuppliers();

    res.status(200).json({
      status: 'success',
      data: suppliers,
    });
  } catch (error) {
    console.error('Error retrieving suppliers:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
}

async function Suppliersregions(req, res) {
  try {
    const regions = await supplierService.getRegions();
    res.status(200).json({
      status: 'success',
      data: regions,
    });
  } catch (error) {
    console.error('Error retrieving regions:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
}
async function UpdateSupplier(req, res) {
  try {
    const supplierId = req.params.id;
    const supplierData = req.body;

    if (!supplierId || !supplierData) {
      return res.status(400).json({
        status: 'error',
        message: 'Supplier ID and data are required',
      });
    }

    const updatedSupplier = await supplierService.updateSupplier(supplierId, supplierData);

    res.status(200).json({
      status: 'success',
      data: updatedSupplier,
    });
  } catch (error) {
    console.error('Error updating supplier:', error.message);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
}

async function DeleteSupplier(req, res) {
  try {
    const supplierId = req.params.id;

    if (!supplierId) {
      return res.status(400).json({
        status: 'error',
        message: 'Supplier ID is required',
      });
    }

    await supplierService.deleteSupplier(supplierId);

    res.status(200).json({
      status: 'success',
      message: 'Supplier deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting supplier:', error.message);
    res.status(error.status || 400).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
}






module.exports = {
  CreateSupplier,
  Suppliers,
  Suppliersregions,
  UpdateSupplier,
  DeleteSupplier
};
