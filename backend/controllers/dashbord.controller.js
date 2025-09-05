const dashbordService = require('../services/dashbord.service');

async function GetYearlyDashboardStats(req, res) {
  try {
    const stats = await dashbordService.getYearlyDashboardStats();
    res.status(200).json({
      status: 'success',
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
}

async function getSupplierPerformance(req, res) {
  try {
    const performance = await dashbordService.getSupplierPerformance();
    res.status(200).json({
        status: 'success',
        data: performance,
        });
    }
        catch (error) {
            res.status(500).json({
            status: 'error',
            message: error.message,
            });
        }
}

async function getCollectionTypeBreakdown(req, res) {
  try {
    const breakdown = await dashbordService.getCollectionTypeBreakdown();
    res.status(200).json({
        status: 'success',
        data: breakdown,
        });
    }
        catch (error) {
            res.status(500).json({
            status: 'error',
            message: error.message,
            });
        }
}

async function getWeeklyCollectionTrends(req, res) {
  try {
    const breakdown = await dashbordService.getWeeklyCollectionTrends();
    res.status(200).json({
        status: 'success',
        data: breakdown,
        });
    }
        catch (error) {
            res.status(500).json({
            status: 'error',
            message: error.message,
            });
        }
}

async function getMonthlyData(req, res) {
  try {
    const breakdown = await dashbordService.getMonthlyData();
    res.status(200).json({
        status: 'success',
        data: breakdown,
        });
    }
        catch (error) {
            res.status(500).json({
            status: 'error',
            message: error.message,
            });
        }
}

async function getEmployeePerformance(req, res) {
  try {
    const performance = await dashbordService.getEmployeePerformance();
    res.status(200).json({
        status: 'success',
        data: performance,
        });
    }
        catch (error) {
            res.status(500).json({
            status: 'error',
            message: error.message,
            });
        }
}

async function getdayPlan(req, res) {
  try {
    const { date } = req.params; // example: /api/weekly-plan/2025-08-29
    const schedule = await dashbordService.getWeeklyPlanByDate(date);
    res.json(schedule);
  } catch (error) {
    console.error("Error retrieving weekly plan:", error);
    res.status(500).json({ error: "Failed to fetch weekly plan" });
  }
}


module.exports = {
  GetYearlyDashboardStats,
    getSupplierPerformance,
    getCollectionTypeBreakdown,
    getWeeklyCollectionTrends,
    getMonthlyData,
    getEmployeePerformance,
    getdayPlan
};
