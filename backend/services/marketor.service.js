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

async function getweaklypalnofmarketor(marketerId) {
  if (!marketerId) {
    throw new Error('Marketer ID is required');
  }

  console.log("Marketer ID received in service:", marketerId);

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
      AND YEARWEEK(mvp.visit_date, 1) = YEARWEEK(CURDATE(), 1)
    ORDER BY mvp.visit_date DESC
  `;

  const rows = await db.query(query, [marketerId]);
  console.log("Current week plan rows for marketer:", rows);
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


// ✅ Bulk assignment service
async function bulkAssignMarketer(marketerId, supplierIds) {
  const results = [];

  for (const supplierId of supplierIds) {
    try {
      const assignmentResult = await assignMarketerToSupplier(marketerId, supplierId);
      results.push({ supplierId, status: 'success', message: assignmentResult.message });
    } catch (err) {
      results.push({ supplierId, status: 'error', message: err.message });
    }
  }

  return { marketerId, results };
}


async function getMarketerSuppliersFull(marketerId) {
  if (!marketerId) {
    throw new Error("Marketer ID is required");
  }

  // ✅ Fetch suppliers assigned to marketer
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

  const suppliers = await db.query(query, [marketerId]);
  const results = [];

  for (const row of suppliers) {
    // ✅ Supplier history
    const history = await db.query(
      `SELECT id, history_details, created_at 
       FROM supplier_history 
       WHERE supplier_id = ? 
       ORDER BY created_at DESC`,
      [row.supplier_id]
    );

    // ✅ Latest plan for this marketer + supplier
    const lastPlan = await db.query(
      `SELECT id, visit_date, type, notes, status, created_by 
       FROM MarketerVisitPlans 
       WHERE supplier_id = ? AND created_by = ?
       ORDER BY visit_date DESC 
       LIMIT 1`,
      [row.supplier_id, marketerId]
    );

    results.push({
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
      history: history.map(h => ({
        id: h.id,
        details: h.history_details,
        createdAt: h.created_at,
      })),
      lastPlan: lastPlan.length > 0 ? {
        id: lastPlan[0].id,
        visitDate: lastPlan[0].visit_date,
        type: lastPlan[0].type,
        notes: lastPlan[0].notes,
        status: lastPlan[0].status,
        marketerId: lastPlan[0].created_by,
      } : null,
    });
  }

  return results;
}

async function createMarketerOrder(orderData) {
  const {
    supplierId,
    marketerId,
    intentionDate,
    contactPerson,
    phoneNumber,
    estimatedKg,
    requireShredder,
    additionalNotes
  } = orderData;

  const result = await db.query(
    `INSERT INTO MarketerOrders 
      (supplier_id, marketer_id, intention_date, contact_person, phone_number, estimated_kg, require_shredder, additional_notes, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
    [
      supplierId,
      marketerId,
      intentionDate,
      contactPerson,
      phoneNumber,
      estimatedKg,
      requireShredder ? 1 : 0,
      additionalNotes || null
    ]
  );

  return { id: result.insertId, status: "active", ...orderData };
}

// ✅ Fetch active orders for a marketer
async function getActiveOrdersByMarketer(marketerId) {
  const rows = await db.query(
    `SELECT 
        mo.id, mo.supplier_id, s.company_name,
        mo.intention_date, mo.contact_person, mo.phone_number,
        mo.estimated_kg, mo.require_shredder, mo.additional_notes,
        mo.status, mo.created_at
     FROM MarketerOrders mo
     INNER JOIN suppliers s ON mo.supplier_id = s.id
     WHERE mo.marketer_id = ?
     ORDER BY mo.intention_date DESC`,
    [marketerId]
  );

  return rows;
}

async function getActiveOrders() {
  const rows = await db.query(
    `SELECT 
        mo.id AS order_id,
        mo.intention_date,
        mo.contact_person,
        mo.phone_number,
        mo.estimated_kg,
        mo.require_shredder,
        mo.additional_notes,
        mo.status,
        mo.created_at,

        -- Supplier Info
        s.id AS supplier_id,
        s.company_name,
        s.location,
        r.name AS region_name,
        sec.name AS sector_name,

        -- Marketer Info
        u.user_id AS marketer_id,
        CONCAT(u.first_name, ' ', u.last_name) AS marketer_name,
        u.phone_number AS marketer_phone

     FROM MarketerOrders mo
     INNER JOIN suppliers s ON mo.supplier_id = s.id
     INNER JOIN regions r ON s.region_id = r.id
     INNER JOIN sectors sec ON s.sector_id = sec.id
     INNER JOIN Users u ON mo.marketer_id = u.user_id
     
     -- ✅ Filter for current month and last month
     WHERE mo.intention_date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)

     ORDER BY mo.intention_date DESC`
  );

  return rows;
}


// get getMarketerSuppliersWithPerformancewithmarketorid
async function getMarketerSuppliersWithPerformance(marketerId) {
  if (!marketerId) {
    throw new Error("Marketer ID is required");
  }

  const query = `
    SELECT 
      s.company_name AS supplier_name,

      -- ✅ Last collection info
      lc.collection_date AS last_collection_date,
      CASE 
        WHEN lc.collection_type_id = 1 THEN 'Instore'
        WHEN lc.collection_type_id = 2 THEN 'Regular'
        ELSE 'None'
      END AS last_collection_type,
      lc.total_kg AS last_collection_kg,

      -- ✅ Totals
      COALESCE(tc.total_collections, 0) AS total_collections,
      COALESCE(tc.total_kg, 0) AS total_collected_kg,

      -- ✅ Active status (last 3 months)
      CASE 
        WHEN recent.last_collection_date IS NOT NULL THEN 'Active'
        ELSE 'Not Active'
      END AS status

    FROM suppliers s
    INNER JOIN SupplierMarketerAssignments sma 
      ON s.id = sma.supplier_id

    -- ✅ Last collection
    LEFT JOIN (
      SELECT ac1.supplier_id, ac1.collection_date, ac1.total_kg, ac1.collection_type_id
      FROM (
        SELECT supplier_id, collection_date, total_kg, collection_type_id,
               ROW_NUMBER() OVER (PARTITION BY supplier_id ORDER BY collection_date DESC) as rn
        FROM (
          SELECT supplier_id, collection_date, total_kg, 1 AS collection_type_id
          FROM InstoreCollection
          UNION ALL
          SELECT supplier_id, collection_date, total_kg, 2 AS collection_type_id
          FROM RegularCollection
        ) ac
      ) ac1
      WHERE ac1.rn = 1
    ) lc ON s.id = lc.supplier_id

    -- ✅ Totals (count + sum of kg)
    LEFT JOIN (
      SELECT supplier_id, COUNT(*) AS total_collections, SUM(total_kg) AS total_kg
      FROM (
        SELECT supplier_id, total_kg FROM InstoreCollection
        UNION ALL
        SELECT supplier_id, total_kg FROM RegularCollection
      ) t
      GROUP BY supplier_id
    ) tc ON s.id = tc.supplier_id

    -- ✅ Recent collection in last 3 months
    LEFT JOIN (
      SELECT supplier_id, MAX(collection_date) AS last_collection_date
      FROM (
        SELECT supplier_id, collection_date FROM InstoreCollection
        UNION ALL
        SELECT supplier_id, collection_date FROM RegularCollection
      ) r
      WHERE collection_date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
      GROUP BY supplier_id
    ) recent ON s.id = recent.supplier_id

    WHERE sma.marketer_id = ?
    ORDER BY s.company_name ASC
  `;

  const rows = await db.query(query, [marketerId]);

  return rows.map(row => ({
    supplierName: row.supplier_name,
    performance: {
      lastCollectionDate: row.last_collection_date,
      lastCollectionType: row.last_collection_type,
      lastCollectionKg: row.last_collection_kg,
      totalCollections: row.total_collections,
      totalCollectedKg: row.total_collected_kg,
      status: row.status
    }
  }));
}

// ✅ Update Order + Related Collection Session Status



async function updateOrderStatus(marketerId, orderId, newStatus, collectedKg = null, note = null) {
  if (!marketerId || !orderId || !newStatus) {
    throw new Error("Marketer ID, Order ID, and new status are required");
  }

  const validStatuses = ["scheduled", "onprocess", "active", "completed", "cancelled"];
  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Invalid status. Valid statuses are: ${validStatuses.join(", ")}`);
  }

  // Build dynamic fields for MarketerOrders
  const updateFields = { status: newStatus };
  if (newStatus === "completed" && collectedKg) {
    updateFields.total_collected_kg = collectedKg;
  }
  if (note) {
    updateFields.additional_notes = note;
  }

  const setClause = Object.keys(updateFields)
    .map(field => `${field} = ?`)
    .join(", ");
  const values = [...Object.values(updateFields), orderId, marketerId];

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1️⃣ Update MarketerOrders
    const [orderResult] = await connection.query(
      `UPDATE MarketerOrders SET ${setClause} WHERE id = ? AND marketer_id = ?`,
      values
    );

    if (orderResult.affectedRows === 0) {
      throw new Error("No order found for the given Marketer ID and Order ID");
    }

    // 2️⃣ Update related session depending on status
    if (newStatus === "completed" || newStatus === "cancelled") {
      await connection.query(
        `UPDATE collection_sessions
         SET status = ?
         WHERE marketer_id = ?
           AND supplier_id = (SELECT supplier_id FROM MarketerOrders WHERE id = ?)`,
        [newStatus, marketerId, orderId]
      );
    }

    await connection.commit();

    // 3️⃣ Fetch updated order + session
    const [[updatedOrder]] = await connection.query(
      `SELECT * FROM MarketerOrders WHERE id = ? AND marketer_id = ?`,
      [orderId, marketerId]
    );

    const [[updatedSession]] = await connection.query(
      `SELECT * FROM collection_sessions
       WHERE marketer_id = ?
         AND supplier_id = ?
       ORDER BY id DESC LIMIT 1`,
      [marketerId, updatedOrder.supplier_id]
    );

    return {
      message: "✅ Order and session updated successfully",
      order: updatedOrder,
      session: updatedSession,
    };
  } catch (error) {
    await connection.rollback();
    console.error("❌ Error in updateOrderStatus:", error.message);
    throw error;
  } finally {
    connection.release();
  }
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
  getweaklypalnofmarketor,
  bulkAssignMarketer,
  getMarketerSuppliersFull,
  createMarketerOrder,
  getActiveOrdersByMarketer,
  getActiveOrders,
  getMarketerSuppliersWithPerformance,
  updateOrderStatus
};
