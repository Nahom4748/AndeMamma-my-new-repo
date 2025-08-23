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
    let plans = req.body;

    console.log("Received visit plans:", plans);

    // Normalize: wrap single object into an array
    if (!Array.isArray(plans)) {
      plans = [plans];
    }

    // Validate
    for (const [index, plan] of plans.entries()) {
      const { supplier_id, marketer_id, visit_date, type, status } = plan;
      if (!supplier_id || !marketer_id || !visit_date || !type || !status) {
        return res.status(400).json({
          status: 'error',
          message: `Missing required fields in plan at index ${index}`,
        });
      }
    }

    // Save
    await marketorService.saveVisitPlans(plans);

    res.status(200).json({
      status: 'success',
      message: 'Visit plan(s) submitted successfully',
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

// controller
async function UpdateVisitStatus(req, res) {
  try {
    const { visitId } = req.params;
    const updateData = req.body; // Can contain status, date, notes, etc.
    console.log("Updating visit status:", visitId, updateData);

    if (!visitId || Object.keys(updateData).length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Visit ID and update data are required',
      });
    }

    const updatedVisit = await marketorService.updateVisit(visitId, updateData);

    if (!updatedVisit) {
      return res.status(404).json({
        status: 'error',
        message: 'Visit not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: updatedVisit,
    });
  } catch (error) {
    console.error('Error updating visit:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
}

async function weeklyplan(req, res) {
  try {
    const { start_date, end_date } = req.query;

    // Log incoming parameters
    console.log("Weekly plan request params:", { start_date, end_date });

    // Validate required params
    if (!start_date || !end_date) {
      return res.status(400).json({
        error: "Both start_date and end_date query parameters are required."
      });
    }

    // Call service to fetch weekly plan data
    const rows = await marketorService.getWeeklyPlan(start_date, end_date);

    // Send JSON response
    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error retrieving weekly plan:", error);
    return res.status(500).json({ 
      success: false,
      error: "Failed to fetch weekly plan",
      details: error.message, // optionally expose error message for debugging
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
  deletevisiting,
  UpdateVisitStatus,
  weeklyplan
};