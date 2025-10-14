const innovationService = require('../services/innovation.service');

// ✅ Create Innovation
async function createInnovation(req, res) {
  try {
    const innovationData = req.body;
    
    // Handle file upload if present
    if (req.file) {
      innovationData.image_path = `/uploads/innovations/${req.file.filename}`;
    }

    console.log('Innovation data:', innovationData);

    const newInnovation = await innovationService.createInnovation(innovationData);

    res.status(201).json({
      status: 'success',
      data: newInnovation,
    });
  } catch (error) {
    console.error('❌ Error creating innovation:', error.message);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
}

// ✅ Get All Innovations
async function getAllInnovations(req, res) {
  try {
    const innovations = await innovationService.getAllInnovations();
    res.status(200).json({
      status: 'success',
      data: innovations,
    });
  } catch (error) {
    console.error('❌ Error fetching innovations:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
}

// ✅ Delete Innovation
async function deleteInnovation(req, res) {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        status: 'error',
        message: 'Innovation ID is required',
      });
    }

    const result = await innovationService.deleteInnovation(id);
    
    res.status(200).json({
      status: 'success',
      message: 'Innovation deleted successfully',
      data: result,
    });
  } catch (error) {
    console.error('❌ Error deleting innovation:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
}

module.exports = {
  createInnovation,
  getAllInnovations,
  deleteInnovation, // ✅ Added delete function
};