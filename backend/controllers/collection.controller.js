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
async function saveWeeklyPlans(req, res) {
  try {
    const { plans, createdBy } = req.body;

    if (!Array.isArray(plans) || plans.length === 0) {
      return res.status(400).json({ message: 'Invalid plans data' });
    }

    if (!createdBy) {
      return res.status(400).json({ message: 'Missing createdBy user ID' });
    }

    await collectionService.saveWeeklyPlans(plans, createdBy);

    res.status(201).json({ message: 'Weekly plans saved successfully' });
  } catch (error) {
    console.error('Error saving weekly plans:', error);
    res.status(500).json({ message: 'Failed to save weekly plans' });
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
  SectorData
  
};
