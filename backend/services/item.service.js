const db = require('../config/db.config');

// Add item
async function createItem(itemData) {
  const { 
    name, 
    description, 
    category,
    currentStock, 
    unitPrice, 
    salePrice, 
    minStockLevel, 
    notes, 
    supplierId, 
    collectionDate,
    image,
    size,
    dimension
  } = itemData;

  // Validation
  if (!name || unitPrice === undefined || currentStock === undefined) {
    throw new Error("Name, unitPrice, and currentStock are required fields");
  }

  // Insert query
  const result = await db.query(
    `INSERT INTO items 
      (name, description, category, current_stock, unit_price, sale_price, min_stock_level, notes, supplier_id, collection_date, image, size, dimension) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name, 
      description || null, 
      category || null,
      currentStock, 
      unitPrice, 
      salePrice || null, 
      minStockLevel || 0, 
      notes || null, 
      supplierId || null, 
      collectionDate || new Date(),
      image || null,
      size || null,
      dimension || null
    ]
  );

  // Fetch and return newly inserted item
  const [rows] = await db.query('SELECT * FROM items WHERE id = ?', [result.insertId]);
  return rows[0];
}
async function getAllItems() {
  const rows = await db.query(`
    SELECT 
      i.id,
      i.name,
      i.description,
      i.category,
      i.current_stock,
      i.unit_price,
      i.sale_price,
      i.min_stock_level,
      i.notes,
      i.collection_date,
      i.image,
      i.size,
      i.dimension,
      s.id AS supplier_id,
      s.name AS supplier_name,
      s.contact_person,
      s.email AS supplier_email,
      s.phone AS supplier_phone,

      -- total value (stock * unit price)
      (i.current_stock * i.unit_price) AS total_unit_value,

      -- total value (stock * sale price)
      (i.current_stock * i.sale_price) AS total_sale_value

    FROM items i
    LEFT JOIN item_suppliers s ON i.supplier_id = s.id
    ORDER BY i.id DESC
  `);

  return rows;
}


//add item provider
async function createItemProvider(itemProviderData) {
    const { 
        name, 
        contact_person, 
        phone, 
        email, 
        license_number, 
        address, 
        sector, 
        status = 'active' 
    } = itemProviderData;

    // ✅ Validation
    if (!name || !contact_person || !phone || !email || !license_number || !address || !sector) {
        throw new Error("All fields except status are required");
    }

    // ✅ Insert into item_suppliers table
    const result = await db.query(
        `INSERT INTO item_suppliers 
        (name, contact_person, phone, email, license_number, address, sector, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, contact_person, phone, email, license_number, address, sector, status]
    );
  console.log("Insert Result:", result);
    const newItemProviderId = result.insertId;

    // ✅ Fetch and return the newly created supplier
    const [rows] = await db.query('SELECT * FROM item_suppliers WHERE id = ?', [newItemProviderId]);
    return rows[0];
}

async function getAllItemProviders() {
    const rows = await db.query('SELECT * FROM item_suppliers');
    return rows;
}




module.exports = {
    createItem,
    createItemProvider,
    getAllItemProviders,getAllItems
};
