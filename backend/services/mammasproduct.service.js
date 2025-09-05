const db = require('../config/db.config'); //

// add mammas product
async function createMammasProduct(productData) {
  const { name, description, price_with_tube, price_without_tube } = productData;

  // Validation
  if (!name || price_with_tube === undefined || price_without_tube === undefined) {
    throw new Error("Name, price, and stock are required fields");
  }
    // Insert query
    const result = await db.query(  
    `INSERT INTO mammasproducts (name,price_with_tube,price_without_tube,description	)
    VALUES (?, ?, ?, ? )`,
    [name, price_with_tube , price_without_tube, description || null]
  );
    // Fetch and return newly inserted mammas product
    const [rows] = await db.query('SELECT * FROM mammasproducts WHERE id = ?', [result.insertId]);
    return rows[0];
}

// get all mammas products
async function getAllMammasProducts() {
  const rows = await db.query('SELECT * FROM mammasproducts');
  return rows;
}
// update mammas product by id
async function updateMammasProduct(productId, updateData) {
    const {name, description, price_with_tube, price_without_tube  } = updateData;
    const result = await db.query(
        `UPDATE mammasproducts 
             SET name = ?, price_with_tube = ?, price_without_tube = ?, description = ?
            WHERE id = ?`,  
        [name, price_with_tube, price_without_tube, description || null, productId]
    );  
    if (result.affectedRows === 0) {
        throw new Error('Mammas product not found');
    }
    const [rows] = await db.query('SELECT * FROM mammasproducts WHERE id = ?', [productId]);
    return rows[0];
}
// delete mammas product by id
async function deleteMammasProduct(productId) {
    const result = await db.query(
        'DELETE FROM mammasproducts WHERE id = ?',
        [productId]
    );
    if (result.affectedRows === 0) {
        throw new Error('Mammas product not found');
    }
    return;
}
// this is sercive.js create multiple mammas products

async function mamasDaylyProduct(productsData) {
  try {
    const { mamaId, date, grandTotal, products } = productsData;
    // Loop through products and save each one
    for (const product of products) {
      await db.query(
        `INSERT INTO mama_dayly_products_make 
          (mama_id, product_id, type, quantity, unit_price, total_amount,days_to_complete, notes, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?,?, NOW())`,
        [
          mamaId,
          product.productId,
          product.type,
          product.quantity,
          product.unitPrice,
          product.totalAmount,
          date,
          product.notes,
        ]
      );
    }

    return { success: true, mamaId, savedProducts: products.length };
  } catch (err) {
    throw err;
  } 
}

async function getMamaPaymentsByDateRange(startDate, endDate) {
  try {
    const rows = await db.query(
      `
      SELECT 
        m.id AS mamaId,
        m.fullName AS fullName,   -- make sure column name in mamas table is correct
        m.accountNumber AS accountNumber,
        mdpm.id AS recordId,
        mdpm.product_id AS productId,
        p.name AS productName,
        mdpm.type,
        mdpm.quantity,
        mdpm.unit_price AS unitPrice,
        mdpm.total_amount AS totalAmount,
        mdpm.notes,
        DATE(mdpm.created_at) AS date
      FROM mama_dayly_products_make mdpm
      INNER JOIN mamas m ON mdpm.mama_id = m.id
      INNER JOIN mammasproducts p ON mdpm.product_id = p.id
      WHERE DATE(mdpm.created_at) BETWEEN ? AND ?
      ORDER BY mdpm.created_at ASC
      `,
      [startDate, endDate]
    );

    // Group by mama
    const grouped = {};
    for (const row of rows) {
      if (!grouped[row.mamaId]) {
        grouped[row.mamaId] = {
          mamaId: row.mamaId,
          fullName: row.fullName,
         accountNumber: row.accountNumber,
          date: row.date,
          products: [],
          grandTotal: 0,
        };
      }

      grouped[row.mamaId].products.push({
        productId: row.productId,
        productName: row.productName,
        type: row.type,
        quantity: row.quantity,
        unitPrice: row.unitPrice,
        totalAmount: row.totalAmount,
        notes: row.notes,
      });

      grouped[row.mamaId].grandTotal += parseFloat(row.totalAmount);
    }

    return Object.values(grouped);
  } catch (err) {
    console.error("❌ Error executing query:", err);
    throw err;
  }
}


module.exports = {
  createMammasProduct,
  getAllMammasProducts,
    updateMammasProduct,
    deleteMammasProduct ,
    mamasDaylyProduct,
    getMamaPaymentsByDateRange
};
