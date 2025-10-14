const conn = require("../config/db.config");

// ✅ Create Inventory Record
async function createInventory(inventoryData) {
  console.log('inventoryData in service:', inventoryData);
  const { paperType, kgAmount, totalBags,date } = inventoryData;

  // 1️⃣ Find paper type by name or code (case-insensitive)
  const paperRows = await conn.query(
    `SELECT id FROM PaperType WHERE LOWER(code) = LOWER(?) OR LOWER(description) = LOWER(?) LIMIT 1`,
    [paperType, paperType]
  );

  if (!paperRows || paperRows.length === 0) {
    throw new Error(`Paper type "${paperType}" not found in PaperType table`);
  }

  const paperTypeId = paperRows[0].id;

  // 2️⃣ Insert record into Inventory
  const result = await conn.query(
    `INSERT INTO Inventory (paper_type_id, total_kg, total_bag, collection_date)
     VALUES (?, ?, ?, ?)`,
    [paperTypeId, kgAmount, totalBags,date]
  );

  // 3️⃣ Return created record
  return {
    inventoryId: result.insertId,
    paperType,
    kgAmount,
    totalBags,
  };
}

// ✅ Get All Inventories (joined with PaperType)
async function getAllInventories() {
  // Get per-paper-type totals (include types with no inventory)
  const rows = await conn.query(`
    SELECT 
      pt.code AS paperTypeCode,
      pt.description AS paperTypeName,
      COALESCE(SUM(inv.total_kg), 0) AS totalKg,
      COALESCE(SUM(inv.total_bag), 0) AS totalBags
    FROM PaperType pt
    LEFT JOIN Inventory inv ON pt.id = inv.paper_type_id
    GROUP BY pt.id, pt.code, pt.description
    ORDER BY pt.code;
  `);

  // Overall totals
  const [overall] = await conn.query(`
    SELECT 
      COALESCE(SUM(total_kg), 0) AS overallTotalKg,
      COALESCE(SUM(total_bag), 0) AS overallTotalBags
    FROM Inventory;
  `);

  return {
    byPaperType: rows,
    overallTotals: overall[0],
  };
}


async function createInventorySell(inventorySellData) {
  console.log("inventorySellData in service:", inventorySellData);

  const {
    paperType,
    kgAmount,
    quantityBags,
    buyerName,
    saleDate,
    pricePerKg,
    totalPrices,
    createdBy,
    
    // optional: user_id if available
  } = inventorySellData;

  // 1️⃣ Find paper type by name or code
  const paperRows = await conn.query(
    `
    SELECT id FROM PaperType 
    WHERE LOWER(code) = LOWER(?) OR LOWER(description) = LOWER(?)
    LIMIT 1
    `,
    [paperType, paperType]
  );

  if (!paperRows || paperRows.length === 0) {
    throw new Error(`Paper type "${paperType}" not found in PaperType table`);
  }

  const paperTypeId = paperRows[0].id;

  // 2️⃣ Insert record into storeSales
  const result = await conn.query(
    `
    INSERT INTO storeSales 
      (paper_type_id, quantity_kg, quantity_bag, sale_date, buyer_name, price_per_kg,total_price,created_by)
    VALUES (?, ?, ?, ?, ?,?,?, ?)
    `,
    [paperTypeId, kgAmount, quantityBags, saleDate, buyerName || null,pricePerKg,totalPrices, createdBy || null]
  );

  // 3️⃣ Deduct from Inventory
  await conn.query(
    `
    UPDATE Inventory
    SET total_kg = total_kg - ?, total_bag = total_bag - ?
    WHERE paper_type_id = ?
    `,
    [kgAmount, quantityBags, paperTypeId]
  );

  // 4️⃣ Calculate total price
  const totalPrice = parseFloat(kgAmount) * parseFloat(pricePerKg || 0);

  // 5️⃣ Return structured response
  return {
    storeSaleId: result.insertId,
    paperType,
    kgAmount,
    quantityBags,
    buyerName,
    saleDate,
    pricePerKg,
    totalPrice,
    message: "Sale recorded successfully and inventory updated.",
  };
}

async function getAllInventorySells() {
  // 1️⃣ Get all sale records for the current month
  const salesList = await conn.query(`
    SELECT 
      ss.id AS saleId,
      pt.code AS paperTypeCode,
      pt.description AS paperTypeName,
      ss.quantity_kg AS quantityKg,
      ss.quantity_bag AS quantityBags,
      ss.price_per_kg AS pricePerKg,
      ss.total_price AS totalPrice,
      ss.sale_date AS saleDate,
      ss.buyer_name AS buyerName,
      u.first_name AS createdBy
    FROM storeSales ss
    JOIN PaperType pt ON ss.paper_type_id = pt.id
    LEFT JOIN Users u ON ss.created_by = u.user_id
    WHERE MONTH(ss.sale_date) = MONTH(CURRENT_DATE())
      AND YEAR(ss.sale_date) = YEAR(CURRENT_DATE())
    ORDER BY ss.sale_date DESC, ss.id DESC;
  `);

  // 2️⃣ Totals for the current month only
  const totals = await conn.query(`
    SELECT 
      COALESCE(SUM(quantity_kg), 0) AS totalKgSold,
      COALESCE(SUM(quantity_bag), 0) AS totalBagsSold,
      COALESCE(SUM(total_price), 0) AS totalBirr
    FROM storeSales
    WHERE MONTH(sale_date) = MONTH(CURRENT_DATE())
      AND YEAR(sale_date) = YEAR(CURRENT_DATE());
  `);

  // 3️⃣ Return structured data
  return {
    salesList: salesList.map(sale => ({
      saleId: sale.saleId,
      paperTypeCode: sale.paperTypeCode,
      paperTypeName: sale.paperTypeName,
      quantityKg: parseFloat(sale.quantityKg),
      quantityBags: sale.quantityBags,
      pricePerKg: parseFloat(sale.pricePerKg),
      totalPrice: parseFloat(sale.totalPrice),
      saleDate: sale.saleDate,
      buyerName: sale.buyerName,
      createdBy: sale.createdBy
    })),
    overallTotals: totals[0],
  };
}

// Get the last inserted inventory record
// Get the last inserted inventory record for the current month
async function getLastInventoryEntry() {
 const rows = await conn.query(`
    SELECT 
      inv.id AS inventoryId,
      pt.code AS paperTypeCode,
      pt.description AS paperTypeName,
      inv.total_kg AS kgAmount,
      inv.total_bag AS totalBags,
      inv.collection_date AS collectionDate,
      inv.created_at AS createdAt
    FROM Inventory inv
    JOIN PaperType pt ON inv.paper_type_id = pt.id
    WHERE MONTH(inv.collection_date) = MONTH(CURDATE())
      AND YEAR(inv.collection_date) = YEAR(CURDATE())
    ORDER BY inv.collection_date ASC, inv.created_at ASC
  `);

  // 2️⃣ Calculate totals for the current month
  const totals = await conn.query(`
    SELECT 
      COALESCE(SUM(total_kg), 0) AS totalKg,
      COALESCE(SUM(total_bag), 0) AS totalBags
    FROM Inventory
    WHERE MONTH(collection_date) = MONTH(CURDATE())
      AND YEAR(collection_date) = YEAR(CURDATE())
  `);

  // 3️⃣ Return structured, professional report
  return {
    reportMonth: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
    totalEntries: rows.length,
    totals: totals[0],
    entries: rows,
  };
}










module.exports = {
  createInventory,
  getAllInventories,
    createInventorySell,
    getAllInventorySells,
    getLastInventoryEntry,
};
