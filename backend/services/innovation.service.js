const conn = require('../config/db.config');
const fs = require('fs');
const path = require('path');

// ✅ Create Innovation
async function createInnovation(data) {
  const {
    product_name,
    material,
    color,
    shape,
    height,
    length,
    width,
    void_length,
    void_height,
    print_type,
    technique,
    finishing_material,
    special_feature,
    additional_notes,
    image_path, // File path from multer
    status = 'active',
  } = data;

  if (!product_name || !material) {
    throw new Error('Product name and material are required.');
  }

  // ✅ Insert record into DB
  const result = await conn.query(
    `INSERT INTO innovations (
      product_name, material, color, shape, height, length, width,
      void_length, void_height, print_type, technique, finishing_material,
      special_feature, additional_notes, image_path, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      product_name,
      material,
      color,
      shape,
      height,
      length,
      width,
      void_length,
      void_height,
      print_type,
      technique,
      finishing_material,
      special_feature,
      additional_notes,
      image_path,
      status,
    ]
  );

  return {
    id: result.insertId,
    product_name,
    material,
    color,
    shape,
    height,
    length,
    width,
    void_length,
    void_height,
    print_type,
    technique,
    finishing_material,
    special_feature,
    additional_notes,
    image_path,
    status,
  };
}

// ✅ Fetch All Innovations
async function getAllInnovations() {
  const rows = await conn.query('SELECT * FROM innovations ORDER BY created_date DESC');
  return rows;
}

// ✅ Delete Innovation
async function deleteInnovation(id) {
  try {
    // First, get the innovation to find the image path
    const [innovation] = await conn.query('SELECT * FROM innovations WHERE id = ?', [id]);
    
    if (!innovation) {
      throw new Error('Innovation not found');
    }

    // Delete the image file if it exists
    if (innovation.image_path) {
      const imagePath = path.join(__dirname, '..', innovation.image_path);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log('🗑️ Deleted image file:', imagePath);
      }
    }

    // Delete the record from database
    const result = await conn.query('DELETE FROM innovations WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      throw new Error('Innovation not found');
    }

    return { id, message: 'Innovation deleted successfully' };
  } catch (error) {
    console.error('❌ Error in deleteInnovation service:', error);
    throw error;
  }
}

module.exports = {
  createInnovation,
  getAllInnovations,
  deleteInnovation, // ✅ Added delete function
};