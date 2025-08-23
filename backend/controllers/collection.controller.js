// Import services
const collectionService = require('../services/collection.service');

async function CollectionsType(req, res) {
  try {
    const types = await collectionService.getcollectionType(); // ✅ Correct usage

    res.status(200).json({
      status: 'success',
      data: types,
    });
  } catch (error) {
    console.error('Error retrieving collection types:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
}

async function papertypes(req, res) {
  try {
    // Assuming you have a service method to get paper types
    const paperTypes = await collectionService.getPaperTypes(); // Replace with actual service method

    res.status(200).json({
      status: 'success',
      data: paperTypes,
    });
  } catch (error) {
    console.error('Error retrieving paper types:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
}   
async function CreateCollection(req, res) {
  try {
    const collectionData = req.body;
    console.log("collectionData", collectionData)
    const newCollection = await collectionService.createCollection(collectionData);

    res.status(201).json({
      status: 'success',
      data: newCollection,
    });
  } catch (error) {
    console.error('Error creating collection:', error); // FULL object
    res.status(400).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
}
async function Drivers(req, res) {
  try {
    console.log("first")
    const drivers = await collectionService.getDrivers(); // Assuming you have a service method to get drivers

    res.status(200).json({
      status: 'success',
      data: drivers,
    });
  } catch (error) {
    console.error('Error retrieving drivers:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
}
async function collectioncoordinator(req, res) {
    try {
        const collectioncoordinator = await collectionService.getcollectioncoordinator(); // Assuming you have a service method to get collection coordinators
     console.log("collectioncoordinator", collectioncoordinator)
        res.status(200).json({
        status: 'success',
        data: collectioncoordinator,
        });
    } catch (error) {
        console.error('Error retrieving collection coordinators:', error);
        res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        });
    }
    }
async function collectionsummary(req, res) {
    try {
        const collectionsummary = await collectionService.getcollectionsummary(); // Assuming you have a service method to get collection summary
        console.log("collectionsummary", collectionsummary)
        res.status(200).json({
        status: 'success',
        data: collectionsummary,
        });
    } catch (error) {
        console.error('Error retrieving collection summary:', error);
        res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        });
    }
    }

async function collectiontypes(req, res) {
    try {
        const collectionTypes = await collectionService.getCollectionTypes(); // Assuming you have a service method to get collection types
    
        res.status(200).json({
        status: 'success',
        data: collectionTypes,
        });
    } catch (error) {
        console.error('Error retrieving collection types:', error);
        res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        });
    }
    }
async function collectionlist(req, res) {
    try {
        const collections = await collectionService.getCollectionList(); // Assuming you have a service method to get collection list
    
        res.status(200).json({
        status: 'success',
        data: collections,
        });
    } catch (error) {
        console.error('Error retrieving collection list:', error);
        res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        });
    }
    }
async function reportsummary(req, res) {
    try {
        const reportSummary = await collectionService.getReportSummary(req,res); // Assuming you have a service method to get report summary
    
        res.status(200).json({
        status: 'success',
        data: reportSummary,
        });
    } catch (error) {
        console.error('Error retrieving report summary:', error);
        res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        });
    }
    }

// services/collection.service.js
// Save Weekly Plans Controller
async function saveWeeklyPlans(req, res) {
  try {
    const { plans } = req.body;

    // Validate input
    if (!Array.isArray(plans) || plans.length === 0) {
      return res.status(400).json({ message: "Invalid plans data" });
    }

    const { createdBy } = plans[0];
    if (!createdBy) {
      return res.status(400).json({ message: "Missing createdBy user ID" });
    }

    // Call service
    await collectionService.saveWeeklyPlans(plans);

    res.status(201).json({ message: "Weekly plans saved successfully" });
  } catch (error) {
    console.error("Error saving weekly plans:", error);
    res.status(500).json({ message: "Failed to save weekly plans" });
  }
}



async function getWeeklyPlan(req, res) {
  try {
    const weeklyPlans = await collectionService.getWeeklyPlan(); // Assuming you have a service method to get weekly plans

    res.status(200).json({
      status: 'success',
      data: weeklyPlans,
    });
  } catch (error) {
    console.error('Error retrieving weekly plans:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
}
async function dailyCollectionReport(req, res) {
  try {
    const { date } = req.query;
    const dailyCollections = await collectionService.getDailyCollectionReport(date);
    res.status(200).json({
      status: 'success',
      data: dailyCollections,
    });
  } catch (error) {
    console.error('Error retrieving daily collections:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
}

async function getCollectionReportByPaperType(req, res) {
  try {
    const collectionReport = await collectionService.getCollectionReportByPaperType();
    res.status(200).json({
      status: 'success',
      data: collectionReport,
    });
  } catch (error) {
    console.error('Error retrieving collection report by paper type:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
}

async function reportsummaryData(req, res) {
 try {
    const { startDate, endDate, region } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Missing date range' });
    }

 const data = await collectionService.getreportsummaryData(startDate, endDate, region || 'all');
    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'No data found for this range.' });
    }

    const summary = {};
    data.forEach(item => {
      if (!summary[item.paper_type]) {
        summary[item.paper_type] = 0;
      }
      summary[item.paper_type] += parseFloat(item.total_kg);
    });

    const result = Object.entries(summary).map(([type, kg]) => ({
      type,
      total_kg: kg
    }));
    console.log(result)

    res.json({ data: result });

  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
}

async function SectorData(req, res) {
  try {
    const sectors = await collectionService.getSectors(); // Assuming you have a service method to get sectors
    res.status(200).json({
      status: 'success',
      data: sectors,
    });
  } catch (error) {
    console.error('Error retrieving sectors:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
}

async function getWeeklyCollectionData(req, res) {
  try {
    const weeklyData = await collectionService.getWeeklyCollectionData(); // Assuming you have a service method to get weekly collection data
    res.status(200).json({
      status: 'success',
      data: weeklyData,
    });
  } catch (error) {
    console.error('Error retrieving weekly collection data:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
}

async function getCollectionTypeData(req, res) {
  try {
    const collectionTypeData = await collectionService.getCollectionTypeData(); // Assuming you have a service method to get collection type data
    res.status(200).json({
      status: 'success',
      data: collectionTypeData,
    });
  } catch (error) {
    console.error('Error retrieving collection type data:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
}
async function getMonthlyTrendData(req, res) {
  try {
    const monthlyTrendData = await collectionService.getMonthlyTrendData(); // Assuming you have a service method to get monthly trend data
    res.status(200).json({
      status: 'success',
      data: monthlyTrendData,
    });
  } catch (error) {
    console.error('Error retrieving monthly trend data:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
}

async function getDashboardStats(req, res) {
  try {
    const dashboardStats = await collectionService.getDashboardStats(); // Assuming you have a service method to get dashboard stats
    res.status(200).json({
      status: 'success',
      data: dashboardStats,
    });
  } catch (error) {
    console.error('Error retrieving dashboard stats:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
}

async function suppliersstats(req, res) {
  try {
    const suppliersStats = await collectionService.getSuppliersStats(); // Assuming you have a service method to get suppliers stats
    res.status(200).json({
      status: 'success',
      data: suppliersStats,
    });
  } catch (error) {
    console.error('Error retrieving suppliers stats:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
}

async function mostactivedays(req, res) {
  try {
    const mostActiveDays = await collectionService.getMostActiveDays(); // Assuming you have a service method to get most active days
    res.status(200).json({
      status: 'success',
      data: mostActiveDays,
    });
  } catch (error) {
    console.error('Error retrieving most active days:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
}

// collectionController.js
async function createCollectionSession(req, res) {
  try {
    const sessionData = req.body;
    console.log("Session Data:", sessionData);
    
    // Validate request body
    if (!sessionData || typeof sessionData !== 'object') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid request body'
      });
    }

    const newSession = await collectionService.createCollectionSession(sessionData);

    res.status(201).json({
      status: 'success',
      data: newSession,
    });
  } catch (error) {
    console.error('Error creating collection session:', error.message);
    
    // More specific error handling
    if (error.message.includes('Missing required fields')) {
      return res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
    
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid foreign key reference (supplier, marketer, or coordinator not found)'
      });
    }

    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
}

async function getCollectionSession(req, res) {
  try {
    const sessions = await collectionService.getCollectionSession(); // Assuming you have a service method to get collection sessions

    res.status(200).json({
      status: 'success',
      data: sessions,
    });
  } catch (error) {
    console.error('Error retrieving collection sessions:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
}

async function updatesessions(req, res) {
  try {
    const { sessionId } = req.params;
    const sessionData = req.body;

    // Validate request body
    if (!sessionData || typeof sessionData !== 'object') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid request body'
      });
    }

    const updatedSession = await collectionService.updateSession(sessionId, sessionData);

    res.status(200).json({
      status: 'success',
      data: updatedSession,
    });
  } catch (error) {
    console.error('Error updating collection session:', error.message);
    
    // More specific error handling
    if (error.message.includes('Session not found')) {
      return res.status(404).json({
        status: 'error',
        message: error.message
      });
    }

    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
}
async function siteevaluationreports(req, res) {
  try {
    console.log("Incoming request body:", req.body);

    const result = await collectionService.createcostevaluation(req.body);

    res.status(201).json({
      success: true,
      message: "Site evaluation report created successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error creating site evaluation report:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to create site evaluation report",
      error: error.message,
    });
  }
}

async function getAllCostEvaluations(req, res) {
  try {
    const results = await collectionService.getAllCostEvaluations();
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function siteevaluationdelet(req, res) {
  try {
    const { id } = req.params;
    const success = await collectionService.deleteSiteEvaluation(id);

    if (!success) {
      return res.status(404).json({ message: "Site Evaluation not found" });
    }

    res.status(200).json({ message: "Site Evaluation deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function addcustomer(req,res){
 try {
    const response = await collectionService.createCustomer(req.body);
    res.json({ status: "success", data: response });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
}

async function getAllCustomers(req, res) {
  try {
    const response = await collectionService.getCustomers();
    res.json( 
      {

      status:"success",
      data:response});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function updateCustomer(req, res) {
  try {
    const response = await collectionService.updateCustomer(req.params.id, req.body);
    res.json({ status: "success", data: response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function deleteCustomer(req, res) {
  try {
    await collectionService.deleteCustomer(req.params.id);
        res.json({ status: "success", message: "Customer deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}


// Export
module.exports = {
  CollectionsType,
  papertypes,
    CreateCollection,
    Drivers,
    collectioncoordinator,
    collectionsummary,
    collectiontypes,
    collectionlist,
    reportsummary,saveWeeklyPlans,
  getWeeklyPlan,dailyCollectionReport,
  getCollectionReportByPaperType,
  reportsummaryData,
  SectorData,
  getWeeklyCollectionData,
  getCollectionTypeData,
  getMonthlyTrendData,
  getDashboardStats,
  suppliersstats,
  mostactivedays,
  updatesessions,
  createCollectionSession,
  getCollectionSession,
  siteevaluationreports,
  getAllCostEvaluations,
  siteevaluationdelet,addcustomer,getAllCustomers,updateCustomer,deleteCustomer
};
