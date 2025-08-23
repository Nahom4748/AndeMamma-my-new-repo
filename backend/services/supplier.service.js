// services/supplier.service.js
const db = require('../config/db.config'); // <-- Import the pool


async function createSupplier(supplierData) {
  console.log(supplierData)
  const { company_name, contact_persons, phone, location, region_code, janitors,sector_code } = supplierData;
  if (!company_name || !contact_persons || !phone || !location || !region_code) {
    throw new Error('Missing required fields');
  }

  console.log("Received region_code:", region_code);

  const regionRows = await db.query('SELECT id FROM regions WHERE code = ?', [region_code]);

  if (!Array.isArray(regionRows) || regionRows.length === 0) {
    throw new Error(`Region with code "${region_code}" not found`);
  }

  const regionId = regionRows[0].id;

  const supplierResult = await db.query(
    'INSERT INTO suppliers (company_name, contact_person,contact_phone,contact_email, phone, location, region_id,sector_id) VALUES (?, ?,?,?, ?, ?, ?,?)',
    [company_name, contact_persons[0].name,contact_persons[0].phone,contact_persons[0].email, phone, location, regionId,sector_code]
  );

  const supplierId = supplierResult.insertId;

  if (janitors && janitors.length > 0) {
    const janitorValues = [];
    const placeholders = [];

    janitors.forEach(j => {
      const name = j.name ?? null;
      const phone = j.phone ?? null;
      const account = j.account ?? null;

      placeholders.push('(?, ?, ?, ?)');
      janitorValues.push(supplierId, name, phone, account);
    });

    const insertJanitorsQuery = `
      INSERT INTO janitors (supplier_id, name, phone, account)
      VALUES ${placeholders.join(', ')}
    `;

    await db.query(insertJanitorsQuery, janitorValues);
    console.log("✅ Janitors added for supplier.");
  }

  return { id: supplierId };
}



async function getSuppliers() {
  const rows = await db.query(`
    SELECT 
      s.id AS supplier_id,
      s.company_name,
      s.contact_person,
      s.contact_phone,
      s.contact_email,
      s.phone AS supplier_phone,
      s.location,
      s.created_at AS supplier_created_at,
      s.updated_at AS supplier_updated_at,
      r.name AS region_name,
      r.code AS region_code,
      sec.name AS sector_name,
      sec.code AS sector_code,
      j.id AS janitor_id,
      j.name AS janitor_name,
      j.phone AS janitor_phone,
      j.account AS janitor_account
    FROM suppliers s
    JOIN regions r ON s.region_id = r.id
    JOIN sectors sec ON s.sector_id = sec.id
    LEFT JOIN janitors j ON s.id = j.supplier_id
    ORDER BY s.id, j.id
  `);

  const suppliersMap = new Map();

  rows.forEach(row => {
    if (!suppliersMap.has(row.supplier_id)) {
      suppliersMap.set(row.supplier_id, {
        id: row.supplier_id,
        company_name: row.company_name,
        contact_person: row.contact_person,
        contact_phone: row.contact_phone,
        contact_email: row.contact_email,
        phone: row.supplier_phone,
        location: row.location,
        region_name: row.region_name,
        region_code: row.region_code,
        sector_name: row.sector_name,
        sector_code: row.sector_code,
        created_at: row.supplier_created_at,
        updated_at: row.supplier_updated_at,
        janitors: []
      });
    }

    if (row.janitor_id) {
      suppliersMap.get(row.supplier_id).janitors.push({
        id: row.janitor_id,
        name: row.janitor_name,
        phone: row.janitor_phone,
        account: row.janitor_account
      });
    }
  });

  return Array.from(suppliersMap.values());
}


async function getRegions() {
  const rows = await db.query('SELECT * FROM regions ORDER BY name');
  return rows;
}

async function updateSupplier(supplierId, supplierData) {
  console.log('supplierData:', supplierData, supplierId);
  const { company_name, contact_person, phone, location, region_code, sector_code, janitors } = supplierData;

  if (!supplierId || !company_name || !contact_person || !phone || !location || !region_code) {
    throw new Error('Missing required fields');
  }

  // Get region ID
  const regionRows = await db.query('SELECT id FROM regions WHERE code = ?', [region_code]);
  if (!regionRows.length) {
    throw new Error(`Region with code "${region_code}" not found`);
  }
  const regionId = regionRows[0].id;

  // Update supplier info
  const updateResult = await db.query(
    'UPDATE suppliers SET company_name = ?, contact_person = ?, phone = ?, location = ?, region_id = ?,sector_id=? WHERE id = ?',
    [company_name, contact_person, phone, location, regionId, sector_code,supplierId]
  );
  if (updateResult.affectedRows === 0) {
    throw new Error(`Supplier with ID ${supplierId} not found`);
  }

  // Handle janitors
  if (Array.isArray(janitors)) {
    // Fetch existing janitor IDs
    const existingJanitors = await db.query('SELECT id FROM janitors WHERE supplier_id = ?', [supplierId]);
    const existingIds = existingJanitors.map(j => j.id);
    const incomingIds = janitors.filter(j => j.id).map(j => j.id);

    // Delete janitors removed from the update
    const toDelete = existingIds.filter(id => !incomingIds.includes(id));
    if (toDelete.length > 0) {
      const placeholders = toDelete.map(() => '?').join(', ');
      const sqlDelete = `DELETE FROM janitors WHERE id IN (${placeholders})`;
      await db.query(sqlDelete, toDelete);
    }

    // Upsert janitors (update existing or insert new)
    for (const janitor of janitors) {
      const { id, name, phone, account } = janitor;

      if (id && existingIds.includes(id)) {
        // Update existing janitor
        await db.query(
          'UPDATE janitors SET name = ?, phone = ?, account = ? WHERE id = ? AND supplier_id = ?',
          [name, phone, account, id, supplierId]
        );
      } else {
        // Insert new janitor
        await db.query(
          'INSERT INTO janitors (supplier_id, name, phone, account) VALUES (?, ?, ?, ?)',
          [supplierId, name ?? null, phone ?? null, account ?? null]
        );
      }
    }
  }

  return { id: supplierId };
}

async function deleteSupplier(supplierId) {
  if (!supplierId) {
    throw new Error('Supplier ID is required');
  }

  // Delete janitors first
  await db.query('DELETE FROM janitors WHERE supplier_id = ?', [supplierId]);

  // Then delete supplier
  const result = await db.query('DELETE FROM suppliers WHERE id = ?', [supplierId]);

  if (result.affectedRows === 0) {
    const error = new Error(`Supplier with ID ${supplierId} not found`);
    error.status = 404; // Custom status for controller
    throw error;
  }

  return { message: `Supplier with ID ${supplierId} deleted successfully` };
}




module.exports = {
  createSupplier,
  getSuppliers,
  getRegions,
  updateSupplier,
  deleteSupplier,
};
