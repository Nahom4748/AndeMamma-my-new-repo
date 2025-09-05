const e = require('express');
const db = require('../config/db.config'); // <-- Import the pool

async function assignMarketerToSupplier(marketerId, supplierId) {
  if (!marketerId || !supplierId) {
    throw new Error('Marketer ID and Supplier ID are required');
  }

  console.log("Assigning marketer:", marketerId, "to supplier:", supplierId);
  // Check if the marketer exists
  const marketerRows= await db.query('SELECT user_id FROM users WHERE user_id = ?', [marketerId]);
  if (marketerRows.length === 0) {
    throw new Error(`Marketer with ID "${marketerId}" not found`);
  }

  // Check if the supplier exists
  const supplierRows = await db.query('SELECT id FROM suppliers WHERE id = ?', [supplierId]);
  if (supplierRows.length === 0) {
    throw new Error(`Supplier with ID "${supplierId}" not found`);
  }

  // Check if the supplier is already assigned
  const assignmentRows = await db.query(
    'SELECT * FROM SupplierMarketerAssignments WHERE supplier_id = ?',
    [supplierId]
  );

  if (assignmentRows.length > 0) {
    // Delete old assignment
    await db.query('DELETE FROM SupplierMarketerAssignments WHERE supplier_id = ?', [supplierId]);
  }

  // Insert new assignment
  await db.query(
    'INSERT INTO SupplierMarketerAssignments (supplier_id, marketer_id) VALUES (?, ?)',
    [supplierId, marketerId]
  );

  return { message: 'Marketer assigned to supplier successfully' };
}

async function getMarketerAssignments() {
  const query = `
    SELECT 
      s.id AS supplier_id,
      s.company_name,
      s.contact_person,
      s.phone,
      s.location,
      s.region_id,
      s.sector_id,
      r.name AS region_name,
      sma.marketer_id,
      CONCAT(u.first_name, ' ', u.last_name) AS marketer_name
    FROM suppliers s
    LEFT JOIN SupplierMarketerAssignments sma ON s.id = sma.supplier_id
    LEFT JOIN Users u ON sma.marketer_id = u.user_id
    LEFT JOIN regions r ON s.region_id = r.id
    LEFT JOIN sectors se ON s.sector_id = se.id
  `;

  const rows = await db.query(query);
  console.log(rows)
  return rows;
}

async function removeMarketerFromSupplier(supplierId) {
    console.log("first", supplierId)
  if (!supplierId) {
    throw new Error('Supplier ID is required');
  }
    // Check if the supplier exists
    const [supplierRows] = await db.query('SELECT id FROM suppliers WHERE id = ?', [supplierId]);
    if (supplierRows.length === 0) {
        throw new Error(`Supplier with ID "${supplierId}" not found`);
        }
    // Remove the marketer from the supplier
    await db.query('DELETE FROM SupplierMarketerAssignments WHERE supplier_id = ?', [supplierId]);
    return { message: 'Marketer removed from supplier successfully' };
}

async function getSuppliersByMarketerId(marketerId) {
  if (!marketerId) {
    throw new Error('Marketer ID is required');
  }

  const query = `
    SELECT 
      s.id AS supplier_id,
      s.company_name,
      s.contact_person,
      s.phone,
      s.location,
      r.name AS region_name
    FROM suppliers s
    JOIN SupplierMarketerAssignments sma ON s.id = sma.supplier_id
    JOIN Users u ON sma.marketer_id = u.user_id
    JOIN regions r ON s.region_id = r.id
    WHERE sma.marketer_id = ?
  `;

  const rows = await db.query(query, [marketerId]);
  return rows;
}

async function saveVisitPlans(plans) {
  if (!Array.isArray(plans) || plans.length === 0) {
    throw new Error('Visit plans must be a non-empty array');
  }

  const visitPlanPromises = plans.map(plan => {
    const {
      visit_date,
      supplier_id,
       type,
      details,
      status,
      notes,
      marketer_id
    } = plan;
console.log("Visit plan uuuuuuuuuuuuuuuuuuuuu from marketors service:", plan);
    if (
      supplier_id === undefined ||
      visit_date === undefined ||
      type === undefined ||
      marketer_id === undefined
    ) {
      throw new Error('Missing required fields in visit plan');
    }

    // Use null for optional fields
    const notess = details !== undefined ? details : null;

    return db.query(
      `INSERT INTO MarketerVisitPlans 
        (supplier_id, visit_date, type, notes, status, created_by) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [supplier_id, visit_date, type, notess, status, marketer_id]
    );
  });

  await Promise.all(visitPlanPromises);
  return { message: 'Visit plans submitted successfully' };
}

async function getMarketerVisitPlans() {
  const query = `
    SELECT 
      mvp.*,
      s.id AS supplier_id,
      s.company_name,
      s.contact_person,
      s.phone AS supplier_phone,
      s.location AS supplier_location,
      s.created_at AS supplier_created_at,
      s.updated_at AS supplier_updated_at,
      
      u.user_id AS marketer_id,
      u.first_name,
      u.last_name,
      u.phone_number AS marketer_phone,
      u.added_date AS marketer_added_date,
      CONCAT(u.first_name, ' ', u.last_name) AS marketer_name
    FROM MarketerVisitPlans mvp
    JOIN suppliers s ON mvp.supplier_id = s.id
    JOIN Users u ON mvp.created_by = u.user_id
  `;

  const rows = await db.query(query);
  return rows;
}

async function deleteVisitPlan(visitId) {
  if (!visitId) {
    throw new Error('Visit ID is required');
  }

  // Check if the visit plan exists
  const [visitRows] = await db.query('SELECT * FROM MarketerVisitPlans WHERE id = ?', [visitId]);
  if (visitRows.length === 0) {
    throw new Error(`Visit plan with ID "${visitId}" not found`);
  }

  // Delete the visit plan
  await db.query('DELETE FROM MarketerVisitPlans WHERE id = ?', [visitId]);
  return { message: 'Visit plan deleted successfully' };
}

async function updateVisit(visitId, status) {
  try {
   

    // Update the visit plan status
    await db.query(
      'UPDATE MarketerVisitPlans SET status = ?  WHERE id = ?',
      [status.status, visitId]
    );
    await db.query(
      'UPDATE MarketerVisitPlans SET feedback = ? WHERE id = ?',
      [status.feedback, visitId]
    );

    await db.query(
      'UPDATE MarketerVisitPlans SET visit_date = NOW() WHERE id = ?',
      [visitId]
    );

    //udate notes if provided
    if (status.notes) {
      await db.query(
        'UPDATE MarketerVisitPlans SET notes = ? WHERE id = ?',
        [status.notes, visitId]
      );
    }

    return { message: 'Visit plan status updated successfully' };
  } catch (error) {
    console.error('Error updating visit plan status:', error);
    throw new Error('Failed to update visit plan status');

  }
}

async function getweaklypalnofmarketor (marketorId) {
  if (!marketorId) {
    throw new Error('Marketer ID is required');
  }
  console.log("Marketor ID received in service:", marketorId);

  const query = `
    SELECT 
      mvp.*,
      s.id AS supplier_id,
      s.company_name,
      s.contact_person,
      s.phone AS supplier_phone,
      s.location AS supplier_location,
      s.created_at AS supplier_created_at,
      s.updated_at AS supplier_updated_at,
      
      u.user_id AS marketer_id,
      u.first_name,
      u.last_name,
      u.phone_number AS marketer_phone,
      u.added_date AS marketer_added_date,
      CONCAT(u.first_name, ' ', u.last_name) AS marketer_name
    FROM MarketerVisitPlans mvp
    JOIN suppliers s ON mvp.supplier_id = s.id
    JOIN Users u ON mvp.created_by = u.user_id
    WHERE mvp.created_by = ?
    ORDER BY mvp.visit_date DESC
  `;

  const rows = await db.query(query, [marketorId]);
  console.log("Weekly plan rows for marketer:", rows);
  return rows;
}




async function getWeeklyPlan(startDate, endDate) {
  try {
    console.log("Service received dates:", startDate, endDate);

    const rows = await db.query(
      `
      SELECT 
        wp.id,
        wp.plan_date,
        wp.created_at,
        wp.created_by,
        ct.name AS collection_type,
        s.id AS supplier_id,
        s.company_name,
        s.contact_person,
        s.phone,
        s.location,
        s.region_id,
        s.sector_id
      FROM WeeklyPlan wp
      JOIN CollectionType ct ON wp.collection_type_id = ct.id
      JOIN suppliers s ON wp.supplier_id = s.id
      WHERE wp.plan_date BETWEEN ? AND ?
      ORDER BY wp.plan_date ASC, s.company_name ASC;
      `,
      [startDate, endDate]
    );
console.log("Weekly plan rows:", rows);
    return rows; // returns array of objects with weekly plan + supplier info
  } catch (error) {
    console.error("❌ Error in getWeeklyPlan service:", error);
    throw error;
  }
}



async function getSuppliersWithMarketer(marketerId) {
  if (!marketerId) {
    throw new Error("Marketer ID is required");
  }

  const query = `
    SELECT 
      s.id AS supplier_id,
      s.company_name,
      s.contact_person,
      s.phone,
      s.location,
      r.name AS region_name,
      sec.name AS sector_name,
      u.user_id AS marketer_id,
      CONCAT(u.first_name, ' ', u.last_name) AS marketer_name
    FROM suppliers s
    INNER JOIN SupplierMarketerAssignments sma 
      ON s.id = sma.supplier_id
    INNER JOIN Users u 
      ON sma.marketer_id = u.user_id
    LEFT JOIN regions r 
      ON s.region_id = r.id
    LEFT JOIN sectors sec
      ON s.sector_id = sec.id
    WHERE sma.marketer_id = ?
    ORDER BY s.company_name ASC
  `;

  const rows = await db.query(query, [marketerId]); // ✅ no destructuring

  return rows.map((row) => ({
    supplierId: row.supplier_id,
    companyName: row.company_name,
    contactPerson: row.contact_person,
    phone: row.phone,
    location: row.location,
    region: row.region_name || "Unknown",
    sector: row.sector_name || "Unknown",
    marketer: {
      id: row.marketer_id,
      name: row.marketer_name,
    },
  }));
}












module.exports = {
  assignMarketerToSupplier,
    getMarketerAssignments,
    removeMarketerFromSupplier,
    getSuppliersByMarketerId,
  saveVisitPlans,
  getMarketerVisitPlans,
  deleteVisitPlan,
  updateVisit,
  getWeeklyPlan,
  getSuppliersWithMarketer,
  getweaklypalnofmarketor
};
