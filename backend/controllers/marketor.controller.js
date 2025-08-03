const marketorService = require("../services/marketor.service");

async function assignMarketer(req, res) {
  try {
    const { marketerId, supplierId } = req.body;
    if (!marketerId || !supplierId) {
      return res.status(400).json({
        status: 'error',
        message: 'Marketer ID and Supplier ID are required',
      });
    }

    const result = await marketorService.assignMarketerToSupplier(marketerId, supplierId);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    console.error('Error assigning marketer:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
}

async function getMarketerAssignments(req, res) {
  try {
    const assignments = await marketorService.getMarketerAssignments(); // Assuming you have a service method to get assignments
    res.status(200).json({
      status: 'success',
        data: assignments,
    });
  } catch (error) {
    console.error('Error retrieving marketer assignments:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
}

async function removeMarketerFromSupplier(req, res) {
  try {
    const supplierId = req.params.supplierId;

    if (!supplierId) {
      return res.status(400).json({
        status: 'error',
        message: 'Supplier ID is required',
      });
    }

    const result = await marketorService.removeMarketerFromSupplier(supplierId); // Assuming you have a service method to remove marketer

    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    console.error('Error removing marketer from supplier:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
    }
}

async function getSuppliersByMarketerId(req, res) {
  try { 
    const marketerId = req.params.marketerId;
    if (!marketerId) {
      return res.status(400).json({
        status: 'error',
        message: 'Marketer ID is required',
      });
    }

    const suppliers = await marketorService.getSuppliersByMarketerId(marketerId);
    res.status(200).json({
      status: 'success',
      data: suppliers,
    });
  } catch (error) {
    console.error('Error retrieving suppliers by marketer ID:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
}
}             

async function submitMarketerVisitPlan(req, res) {
  try {
    console.log("Submitting visit plan:", req.body);
    const { plans } = req.body; // Assuming plans is an array of visit plans
    if (!plans || !Array.isArray(plans)) {
      return res.status(400).json({
        status: 'error',
        message: 'Visit plans are required',
      });
    }

    // Call the service to save the visit plans
    await marketorService.saveVisitPlans(plans); // Assuming you have a service method to save visit plans

    res.status(200).json({
      status: 'success',
      message: 'Visit plan submitted successfully',
    });
  } catch (error) {
    console.error('Error submitting visit plan:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
}

async function marketorsVisitPlans(req, res) {
  try {
    const plans = await marketorService.getMarketerVisitPlans(); // Assuming you have a service method to get visit plans
    res.status(200).json({
      status: 'success',
      data: plans,
    });
  } catch (error) {
    console.error('Error retrieving marketer visit plans:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
}

async function deletevisiting(req, res) {
  try {
    const visitId = req.params.visitId;
    if (!visitId) {
      return res.status(400).json({
        status: 'error',
        message: 'Visit ID is required',
      });
    }

    await marketorService.deleteVisitPlan(visitId); // Assuming you have a service method to delete visit plans

    res.status(200).json({
      status: 'success',
      message: 'Visit plan deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting visit plan:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
}

module.exports = {
  assignMarketer,
    getMarketerAssignments,
    removeMarketerFromSupplier,
    getSuppliersByMarketerId,
  submitMarketerVisitPlan,
  marketorsVisitPlans,
  deletevisiting
};