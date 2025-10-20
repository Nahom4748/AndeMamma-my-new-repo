// import Service
const collectionCoordinatorService = require("../services/CollectionCoordinator.service");

// ✅ Get Collection Assignments
async function getCollectionAssignments(req, res) {
  try {
    const userId  = req.params;
    const assignments = await collectionCoordinatorService.getAssignedCollectionSessionsByUserId(userId);
    res.status(200).json({
      status: "success",
      data: assignments,
    });
  } catch (error) {
    console.error("❌ Error fetching collection assignments:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
}

// ✅ Update Collection Assignment Status
async function submitCollectionReport(req, res) {
  try {
    const { session_id, supplier_id, marketer_id, reports } = req.body;
    console.log(session_id, supplier_id, marketer_id, reports);
    if (!session_id || !supplier_id || !reports) {
      return res.status(400).json({ status: "error", message: "Missing required fields" });
    }

    // Parse reports JSON if sent as string
    const parsedReports = typeof reports === "string" ? JSON.parse(reports) : reports;

    const result = await collectionCoordinatorService.saveCollectionReports(
      session_id,
      supplier_id,
      marketer_id,
      parsedReports
    );

    res.status(201).json({ status: "success", data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", message: error.message });
  }
}

// ✅ Add Comments with Photo to Collection Assignment
async function addCommentsWithPhoto(req, res) {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    let photoPath = null;
    if (req.file) {
      photoPath = `/uploads/${req.file.filename}`;
    }
    const updatedAssignment = await collectionCoordinatorService.addCommentsWithPhoto(id, comments, photoPath);
    res.status(200).json({
      status: "success",
      data: updatedAssignment,
    });
  } catch (error) {
    console.error("❌ Error adding comments with photo:", error);
    res.status(500).json({
        status: "error",
        message: "Internal server error",
    });
  }
}

async function getCollectionReports(req, res) {
  try {
    const reports = await collectionCoordinatorService.getAllCollectionReports();
    res.status(200).json({
      status: "success",
      data: reports,
    });
  }
    catch (error) {
    console.error("❌ Error fetching collection reports:", error);
    res.status(500).json({
        status: "error",
        message: "Internal server error",
    });
  }
}


module.exports = {
  getCollectionAssignments,
  submitCollectionReport,
    addCommentsWithPhoto,
    getCollectionReports
};