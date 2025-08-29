const monthlyService = require('../services/monthly.service');

// Function to handle monthly report generation
async function monthlyReport(req, res) {
try {
    const { month, year } = req.query;

    const report = await monthlyService.generateMonthlyReport(
      month ? parseInt(month) : new Date().getMonth() + 1,
      year ? parseInt(year) : new Date().getFullYear()
    );

    res.status(200).json({
      status: "success",
      data: report,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
}
// Function to fetch employee monthly performance
// Controller: employeeMonthlyPerformance.js
async function employeeMonthlyPerformance(req, res) {
  try {
    const { month, year } = req.query;

    // Default to current month/year if not provided
    const m = month ? parseInt(month) : new Date().getMonth() + 1;
    const y = year ? parseInt(year) : new Date().getFullYear();

    // Call the service
    const performance = await monthlyService.getEmployeeMonthlyPerformance(m, y);

    res.status(200).json({
      status: "success",
      data: performance,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
}

module.exports = {
  employeeMonthlyPerformance,
};

module.exports = {
    monthlyReport,
    employeeMonthlyPerformance
    };
