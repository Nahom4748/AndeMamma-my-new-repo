const db = require('../config/db.config'); // <-- Import the pool
const { get } = require('../routes');

async function getcollectionType() {
  const rows = await db.query(`SELECT id, name FROM CollectionType ORDER BY id`);
  return rows;
}
async function getPaperTypes() {
  const rows = await db.query(`SELECT id, code FROM PaperType ORDER BY id`);
    return rows;
}
 async function createCollection(collectionData) {
  if (
    !collectionData ||
    typeof collectionData !== 'object' ||
    !Array.isArray(collectionData.items) ||
    collectionData.items.length === 0
  ) {
    throw new Error('Valid collectionData with items is required.');
  }

  const {
    organization_id,
    collection_type_id,
    driver_id,
    collection_date,
    collection_coordinator_id,
    total_kg,
    janitor_id,
    total_bag,
    items
  } = collectionData;

  if (collection_type_id === 1) {
    // === In-store Collection ===
    if (!collection_coordinator_id) {
      throw new Error('Collection coordinator is required for Instore collections.');
    }

    // Insert to InstoreCollection
    const instoreInsertResult = await db.query(
      `INSERT INTO InstoreCollection (collection_date, supplier_id, driver_id, janitor_id, collection_coordinator_id, total_kg, total_bag)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [collection_date, organization_id, driver_id, janitor_id, collection_coordinator_id, total_kg, total_bag]
    );

    const instore_collection_id = instoreInsertResult.insertId;

    // Insert each item into InstoreCollectionItems
    for (const item of items) {
      await db.query(
        `INSERT INTO InstoreCollectionItems (instore_collection_id, paper_type_id, bag_count, kg)
         VALUES (?, ?, ?, ?)`,
        [instore_collection_id, item.paper_type_id, item.bag_count, item.kg]
      );
    }

  } else if (collection_type_id === 2) {
    // === Regular Collection ===
    const regularInsertResult = await db.query(
      `INSERT INTO RegularCollection (collection_date, supplier_id, driver_id, janitor_id, total_kg, total_bag)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [collection_date, organization_id, driver_id, janitor_id, total_kg, total_bag]
    );

    const regular_collection_id = regularInsertResult.insertId;

    // Insert each item into RegularCollectionItems
    for (const item of items) {
      await db.query(
        `INSERT INTO RegularCollectionItems (regular_collection_id, paper_type_id, bag_count, kg)
         VALUES (?, ?, ?, ?)`,
        [regular_collection_id, item.paper_type_id, item.bag_count, item.kg]
      );
    }

  } else {
    throw new Error('Invalid collection type ID');
  }
}


async function getDrivers() {
  const rows = await db.query(`SELECT id, name FROM driver ORDER BY id`);
    return rows;
}
async function getcollectioncoordinator() {
    const rows = await db.query(`SELECT id, name FROM collectioncoordinators ORDER BY id`);
    return rows;
    }

async function getcollectionsummary() {
  // Total Instore KG - Current Month
  const [instoreResult] = await db.query(`
    SELECT IFNULL(SUM(total_kg), 0) AS instoreKg
    FROM InstoreCollection
    WHERE MONTH(collection_date) = MONTH(CURDATE()) AND YEAR(collection_date) = YEAR(CURDATE())
  `);

  // Total Regular KG - Current Month
  const [regularResult] = await db.query(`
    SELECT IFNULL(SUM(total_kg), 0) AS regularKg
    FROM RegularCollection
    WHERE MONTH(collection_date) = MONTH(CURDATE()) AND YEAR(collection_date) = YEAR(CURDATE())
  `);

  // Total Unique Suppliers - Current Month
  const [supplierResult] = await db.query(`
    SELECT COUNT(DISTINCT supplier_id) AS totalSuppliers
    FROM (
      SELECT supplier_id FROM InstoreCollection 
      WHERE MONTH(collection_date) = MONTH(CURDATE()) AND YEAR(collection_date) = YEAR(CURDATE())
      UNION
      SELECT supplier_id FROM RegularCollection 
      WHERE MONTH(collection_date) = MONTH(CURDATE()) AND YEAR(collection_date) = YEAR(CURDATE())
    ) AS all_suppliers
  `);

  // Calculate total
 const instoreKg = parseFloat(instoreResult.instoreKg) || 0;
const regularKg = parseFloat(regularResult.regularKg) || 0;
const totalKg = parseFloat((instoreKg + regularKg).toFixed(2));
const totalSuppliers = supplierResult.totalSuppliers || 0;

return {
  totalKg,
  instoreKg,
  regularKg,
  totalSuppliers
};

}

async function getCollectionTypes() {
  // Get total Instore KG for the current month
  const [instoreRows] = await db.query(`
    SELECT IFNULL(SUM(total_kg), 0) AS value
    FROM InstoreCollection
    WHERE MONTH(collection_date) = MONTH(CURRENT_DATE())
      AND YEAR(collection_date) = YEAR(CURRENT_DATE())
  `);

  // Get total Regular KG for the current month
  const [regularRows] = await db.query(`
    SELECT IFNULL(SUM(total_kg), 0) AS value
    FROM RegularCollection
    WHERE MONTH(collection_date) = MONTH(CURRENT_DATE())
      AND YEAR(collection_date) = YEAR(CURRENT_DATE())
  `);

  // Safe access with fallback
  const instoreValue = instoreRows?.[0]?.value ?? 0;
  const regularValue = regularRows?.[0]?.value ?? 0;

  // Convert to float and fix to 2 decimal places
  const instoreKg = parseFloat(instoreValue).toFixed(2);
  const regularKg = parseFloat(regularValue).toFixed(2);

  return [
    { type: "Instore", value: parseFloat(instoreKg) },
    { type: "Regular", value: parseFloat(regularKg) }
  ];
}

async function getCollectionList() {
  // Current month condition
  const currentMonthCondition = `
    MONTH(collection_date) = MONTH(CURRENT_DATE())
    AND YEAR(collection_date) = YEAR(CURRENT_DATE())
  `;

  // Instore Collections (by supplier)
  const instoreRows = await db.query(`
    SELECT 
      s.company_name AS name,
      'Instore' AS type,
      SUM(ic.total_kg) AS totalKg
    FROM InstoreCollection ic
    JOIN suppliers s ON s.id = ic.supplier_id
    WHERE ${currentMonthCondition}
    GROUP BY s.company_name
  `);

  // Regular Collections (by janitor)
  const regularRows = await db.query(`
    SELECT 
      j.name AS name,
      'Regular' AS type,
      SUM(rc.total_kg) AS totalKg
    FROM RegularCollection rc
    JOIN janitors j ON j.id = rc.janitor_id
    WHERE ${currentMonthCondition}
    GROUP BY j.name
  `);

  // Combine result (no destructuring if db.query returns just rows)
  return [...instoreRows, ...regularRows];
}

async function getReportSummary(res, req) {

    const { start, end } = req.query;

  try {
    const [instore] = await db.query(`
      SELECT MONTH(collection_date) as month, SUM(total_kg) as total_kg 
      FROM InstoreCollection 
      WHERE collection_date BETWEEN ? AND ?
      GROUP BY MONTH(collection_date)
    `, [start, end]);

    const [regular] = await db.query(`
      SELECT MONTH(collection_date) as month, SUM(weight) as total_kg 
      FROM RegularCollection 
      WHERE collection_date BETWEEN ? AND ?
      GROUP BY MONTH(collection_date)
    `, [start, end]);

    const chartSeries = [
      {
        name: 'Instore',
        data: Array.from({ length: 12 }, (_, i) =>
          instore.find(item => item.month === i + 1)?.total_kg || 0
        )
      },
      {
        name: 'Regular',
        data: Array.from({ length: 12 }, (_, i) =>
          regular.find(item => item.month === i + 1)?.total_kg || 0
        )
      }
    ];

    const totalInstore = instore.reduce((sum, item) => sum + Number(item.total_kg), 0);
    const totalRegular = regular.reduce((sum, item) => sum + Number(item.total_kg), 0);

    const metrics = [
      {
        metric: 'Total Instore Collection',
        value: totalInstore.toFixed(2) + ' kg',
        change: '+4.5%' // Placeholder
      },
      {
        metric: 'Total Regular Collection',
        value: totalRegular.toFixed(2) + ' kg',
        change: '-2.1%' // Placeholder
      }
    ];

    const pieSeries = [totalInstore, totalRegular];

    res.json({ metrics, chartSeries, pieSeries });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load summary report.' });
  }
};

// services/collection.service.js

// Save Weekly Plans Service
async function saveWeeklyPlans(plans) {
  if (!Array.isArray(plans) || plans.length === 0) {
    throw new Error("Invalid or empty plans array");
  }

  const { createdBy } = plans[0];
  if (!createdBy) {
    throw new Error("Missing createdBy in plans");
  }

  const insertPromises = plans.map(async (plan, index) => {
    const { supplier_id, day, date, notes, type } = plan;
    console.log(supplier_id, day, date, notes, type)

    if (!supplier_id || !day || !date || !type) {
      throw new Error(`Missing required fields in plan at index ${index}`);
    }

    const collection_type_id = (type.toLowerCase() === 'instore') ? 1 : 2;

    // Optional: validate date format here if needed

    try {
      return await db.query(
        `INSERT INTO WeeklyPlan (plan_date, day, collection_type_id, supplier_id, note, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [date, day, collection_type_id, supplier_id, notes || null, createdBy]
      );
    } catch (error) {
      console.error(`Failed to insert plan at index ${index}:`, error);
      throw error;
    }
  });

  await Promise.all(insertPromises);
}


async function createCustomer(data) {
  console.log(data)
  const sql = `
    INSERT INTO customers (status, joinDate, customerName, contactPerson, phone, sector, location)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const result = await db.query(sql, [
    data.status,
    data.joinDate,
    data.customerName,
    data.contactPerson,
    data.phone,
    data.sector,
    data.location,
  ]);
  return {
    id: result.insertId,
    ...data
  };
}





async function getWeeklyPlan() {
  try {
    const rows = await db.query(`
      SELECT wp.id, wp.plan_date, wp.supplier_id, s.company_name, wp.collection_type_id, ct.name AS collection_type_name
      FROM WeeklyPlan wp
      JOIN suppliers s ON wp.supplier_id = s.id
      JOIN CollectionType ct ON wp.collection_type_id = ct.id
      ORDER BY wp.plan_date DESC
    `);
    return rows;
  } catch (error) {
    console.error('Error retrieving weekly plans:', error);
    throw error;
  }
} 
async function getDailyCollectionReport(date) {
  // Validate input date
  if (!date || isNaN(new Date(date).getTime())) {
    throw new Error('Invalid date parameter');
  }

  try {
    // Get scheduled collections for the date (supplier name, collection type, day, note)
    const [scheduledCollections] = await db.query(`
      SELECT 
        s.company_name AS supplier_name,
        ct.name AS collection_type,
        wp.day,
        wp.note
      FROM WeeklyPlan wp
      JOIN suppliers s ON wp.supplier_id = s.id
      JOIN CollectionType ct ON wp.collection_type_id = ct.id
      WHERE wp.plan_date = ?
      ORDER BY s.company_name
    `, [date]);

    return scheduledCollections;
  } catch (error) {
    console.error('Error in getDailyCollectionReport:', error);
    throw error;
  }
}




async function getCollectionReportByPaperType() {
  try {
    const rows = await db.query(`
      SELECT 
        pt.code AS paper_type,
        SUM(items.kg) AS total_kg
      FROM (
        SELECT ici.paper_type_id, ici.kg
        FROM InstoreCollectionItems ici
        JOIN InstoreCollection ic ON ici.instore_collection_id = ic.id

        UNION ALL

        SELECT rci.paper_type_id, rci.kg
        FROM RegularCollectionItems rci
        JOIN RegularCollection rc ON rci.regular_collection_id = rc.id
      ) AS items
      JOIN PaperType pt ON items.paper_type_id = pt.id
      GROUP BY pt.code
      ORDER BY pt.code
    `);
  console.log(rows)
    return rows;
  } catch (error) {
    console.error('Error retrieving collection report by paper type:', error);
    throw error;
  }
}

async function getreportsummaryData(startDate, endDate, regionCode) {
 const params = [];
  let regionFilter = '';
  let dateFilter = 'WHERE collection_date BETWEEN ? AND ?';
  params.push(startDate, endDate);

  if (regionCode && regionCode !== 'all') {
    regionFilter = 'AND r.code = ?';
    params.push(regionCode);
  }

  const query = `
    SELECT pt.description AS paper_type, SUM(ri.kg) AS total_kg, r.name AS region_name
    FROM RegularCollectionItems ri
    JOIN RegularCollection rc ON rc.id = ri.regular_collection_id
    JOIN suppliers s ON rc.supplier_id = s.id
    JOIN regions r ON s.region_id = r.id
    JOIN PaperType pt ON pt.id = ri.paper_type_id
    ${dateFilter} ${regionFilter}
    GROUP BY pt.id, r.id

    UNION ALL

    SELECT pt.description AS paper_type, SUM(ii.kg) AS total_kg, r.name AS region_name
    FROM InstoreCollectionItems ii
    JOIN InstoreCollection ic ON ic.id = ii.instore_collection_id
    JOIN suppliers s ON ic.supplier_id = s.id
    JOIN regions r ON s.region_id = r.id
    JOIN PaperType pt ON pt.id = ii.paper_type_id
    ${dateFilter} ${regionFilter}
    GROUP BY pt.id, r.id
  `;

  try {
    const rows = await db.query(query, [...params, ...params]);
    console.log('Query result:', rows); // ✅ Add this
    return rows;
  } catch (err) {
    console.error('Query error:', err); // ✅ Add this
    throw err;
  }
}

async function getSectors() {
  try {
    const rows = await db.query(`
      SELECT *
      FROM sectors
      ORDER BY name
    `);
    return rows;
  } catch (error) {
    console.error('Error retrieving sectors:', error);
    throw error;
  }
}


async function getWeeklyCollectionData() {
  try {
   const rows = await db.query(`
    SELECT 
      DAYNAME(collection_date) AS day,
      SUM(CASE WHEN type = 'Regular' THEN total_kg ELSE 0 END) AS regular,
      SUM(CASE WHEN type = 'Instore' THEN total_kg ELSE 0 END) AS instore
    FROM (
      SELECT collection_date, total_kg, 'Regular' AS type
      FROM RegularCollection
      WHERE YEARWEEK(collection_date, 1) = YEARWEEK(CURDATE(), 1)
      UNION ALL
      SELECT collection_date, total_kg, 'Instore' AS type
      FROM InstoreCollection
      WHERE YEARWEEK(collection_date, 1) = YEARWEEK(CURDATE(), 1)
    ) AS combined
    GROUP BY day
    ORDER BY FIELD(day, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')
  `);

  // Ensure numeric values and round
  return rows.map(r => ({
    day: r.day.slice(0, 3), // e.g. 'Mon'
    regular: parseFloat(r.regular || 0),
    instore: parseFloat(r.instore || 0)
  }));
  } catch (error) {
    console.error('Error retrieving weekly collection data:', error);
    throw error;
  }
}

async function getCollectionTypeData() {
  try {
    const rows = await db.query(`
      SELECT 
        pt.description AS name,
        SUM(COALESCE(rci.kg, 0) + COALESCE(ici.kg, 0)) AS value
      FROM PaperType pt
      LEFT JOIN RegularCollectionItems rci ON pt.id = rci.paper_type_id
      LEFT JOIN InstoreCollectionItems ici ON pt.id = ici.paper_type_id
      GROUP BY pt.id, pt.description
      ORDER BY value DESC;
    `);

    // Add colors for frontend
    const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#A83279'];

    return rows.map((row, index) => ({
      ...row,
      color: colors[index % colors.length]
    }));

  } catch (err) {
    console.error("Error fetching collection type data:", err);
    throw err; // pass error to controller
  }
}

async function getMonthlyTrendData() {
try {
    const rows = await db.query(`
      SELECT 
        DATE_FORMAT(collection_date, '%b') AS month,
        SUM(total_kg) AS collections
      FROM (
        SELECT collection_date, total_kg FROM RegularCollection
        UNION ALL
        SELECT collection_date, total_kg FROM InstoreCollection
      ) AS combined
      GROUP BY MONTH(collection_date)
      ORDER BY MONTH(collection_date)
      LIMIT 12;
    `);

    return rows.map(row => ({
      month: row.month,
      collections: parseFloat(row.collections || 0)
    }));

  } catch (err) {
    console.error("Error fetching monthly trend data:", err);
    throw err;
  }
}
async function getDashboardStats() {
  const rows = await db.query(`
    SELECT 
      (SELECT COUNT(*) FROM MarketerVisitPlans WHERE MONTH(visit_date) = MONTH(CURDATE())) AS total_collections,
      (SELECT COUNT(*) FROM suppliers) AS active_suppliers,
      (SELECT COUNT(*) FROM MarketerVisitPlans WHERE visit_date = CURDATE()) AS scheduled_today,
      (SELECT COUNT(*) FROM MarketerVisitPlans WHERE YEAR(visit_date) = YEAR(CURDATE()) 
          AND MONTH(visit_date) = MONTH(CURDATE())) AS monthly_reports
  `);

  const data = rows[0]; // first row with stats

  return [
    {
      title: "Total Collections",
      value: data.total_collections.toLocaleString(),
      description: "This month",
      // icon and color info can be added on frontend
    },
    {
      title: "Active Suppliers",
      value: data.active_suppliers.toLocaleString(),
      description: "Organizations",
    },
    {
      title: "Scheduled Today",
      value: data.scheduled_today.toLocaleString(),
      description: "Collections",
    },
    {
      title: "Monthly Reports",
      value: data.monthly_reports.toLocaleString(),
      description: "Generated",
    },
  ];
}

async function getSuppliersStats() {
 const rows = await db.query(`
      SELECT 
        s.company_name AS name, 
        COUNT(rc.id) AS value
      FROM suppliers s
      LEFT JOIN RegularCollection rc ON s.id = rc.supplier_id
      GROUP BY s.id, s.company_name
      ORDER BY value DESC
      LIMIT 10;
    `);

  return rows;
}

async function getMostActiveDays() {
const rows = await db.query(`
      SELECT 
        DAYNAME(collection_date) AS day,
        COUNT(*) AS total_collections,
        SUM(total_kg) AS total_kg_collected
      FROM (
        SELECT collection_date, total_kg FROM RegularCollection
        UNION ALL
        SELECT collection_date, total_kg FROM InstoreCollection
      ) AS all_collections
      GROUP BY DAYNAME(collection_date)
      ORDER BY total_collections DESC;
    `);
    return rows.map(row => ({
      day: row.day,
      total_collections: parseInt(row.total_collections, 10),
      total_kg_collected: parseFloat(row.total_kg_collected || 0)
    }));

}

// ✅ Create Collection Session
async function createCollectionSession(data) {
  try {
    console.log("Creating collection session with data:", data);
    const sessionNumber = data.sessionNumber || `CS-${Date.now()}`;

    // Required fields
    const requiredFields = ["supplierId", "site_location", "estimated_start_date", "estimatedEndDate"];
    const missingFields = requiredFields.filter(field => !data[field]);
    if (missingFields.length) {
      throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
    }

    // Format dates for MySQL
    const formatDate = (date) =>
      date ? new Date(date).toISOString().slice(0, 19).replace("T", " ") : null;

    // Insert into DB
    const result = await db.query(
      `INSERT INTO collection_sessions
      (session_number, supplier_id, marketer_id, coordinator_id,
       site_location, estimated_start_date, estimated_end_date,
       actual_start_date, actual_end_date, status,estimatedAmount,
       total_time_spent, performance, collection_data, problems, comments)
       VALUES (?, ?, ?, ?, ?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,

      [
        sessionNumber,
        data.supplierId,
        data.marketerId || null,
        data.coordinatorId || null,
        data.site_location,
        formatDate(data.estimated_start_date),
        formatDate(data.estimatedEndDate),
        formatDate(data.estimated_start_date),
        formatDate(data.estimatedEndDate),
        data.status || "planned",
        data.collection_data?.estimatedAmount || 0,
        data.totalTimeSpent || 0,
        JSON.stringify(data.performance || { efficiency: 0, quality: 0, punctuality: 0 }),
        JSON.stringify(data.collectionData || {
          estimatedAmount: 0,
          paperTypes: { carton: 0, mixed: 0, sw: 0, sc: 0, np: 0 }
        }),
        JSON.stringify(data.problems || []),
        JSON.stringify(data.comments || [])
      ]
    );

    // Return inserted session
    const [inserted] = await db.query(
      `SELECT * FROM collection_sessions WHERE id = ?`,
      [result.insertId]
    );

    return {
      ...inserted,
      performance: JSON.parse(inserted.performance || "{}"),
      collection_data: JSON.parse(inserted.collection_data || "{}"),
      problems: JSON.parse(inserted.problems || "[]"),
      comments: JSON.parse(inserted.comments || "[]"),
    };

  } catch (error) {
    console.error("Error in createCollectionSession:", error.message);
    throw error;
  }
}


async function getCollectionSession() {
  try {
    const rows = await db.query(`
      SELECT 
        cs.id,
        cs.session_number,
        cs.supplier_id,
        s.company_name AS supplier_name,
        cs.marketer_id,
        CONCAT(m.first_name, ' ', m.last_name) AS marketer_name,
        cs.coordinator_id,
        CONCAT(cc.name) AS coordinator_name,  
        cs.site_location,
        cs.estimated_start_date,
        cs.estimated_end_date,
        cs.actual_start_date,
        cs.actual_end_date,
        cs.status,
        cs.estimatedAmount,
        cs.total_time_spent,
        cs.performance,
        cs.collection_data,
        cs.problems,
        cs.comments,
        cs.created_at,
        cs.updated_at
      FROM collection_sessions cs
      LEFT JOIN suppliers s ON cs.supplier_id = s.id
      LEFT JOIN users m ON cs.marketer_id = m.user_id
      LEFT JOIN collectioncoordinators cc ON cs.coordinator_id = cc.id
      ORDER BY cs.created_at DESC
    `);

    return rows.map(row => ({
      ...row,
      // Only parse collection_data if status is 'completed', otherwise return empty object
      collection_data: row.status === 'completed' 
        ? JSON.parse(row.collection_data || "{}") 
        : {},
      // Always parse performance, problems, and comments
      performance: JSON.parse(row.performance || "{}"),
      problems: JSON.parse(row.problems || "[]"),
      comments: JSON.parse(row.comments || "[]"),
    }));

  } catch (error) {
    console.error("Error retrieving collection sessions:", error.message);
    throw error;
  }
}

async function updateSession(sessionId, updateData) {
  try {
    console.log("Updating collection session with ID:", sessionId, "and data:", updateData);

    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    // First get the current session to check if status is changing to 'completed'
    const [currentSession] = await db.query(
      `SELECT status, collection_data FROM collection_sessions WHERE id = ?`,
      [sessionId]
    );

    const isStatusChangingToCompleted = 
      updateData.status === 'completed' && 
      currentSession.status !== 'completed';

    // Prepare update fields
    const fields = [];
    const values = [];

    if (updateData.supplierId) {
      fields.push("supplier_id = ?");
      values.push(updateData.supplierId);
    }
    if (updateData.marketerId) {
      fields.push("marketer_id = ?");
      values.push(updateData.marketerId);
    }
    if (updateData.coordinatorId) {
      fields.push("coordinator_id = ?");
      values.push(updateData.coordinatorId);
    }
    if (updateData.site_location) {
      fields.push("site_location = ?");
      values.push(updateData.site_location);
    }
    if (updateData.estimated_start_date) {
      fields.push("estimated_start_date = ?");
      values.push(new Date(updateData.estimated_start_date).toISOString().slice(0, 19).replace("T", " "));
    }
    if (updateData.estimatedEndDate) {
      fields.push("estimated_end_date = ?");
      values.push(new Date(updateData.estimatedEndDate).toISOString().slice(0, 19).replace("T", " "));
    }
    if (updateData.actual_start_date) {
      fields.push("actual_start_date = ?");
      values.push(new Date(updateData.actual_start_date).toISOString().slice(0, 19).replace("T", " "));
    }
    if (updateData.actual_end_date) {
      fields.push("actual_end_date = ?");
      values.push(new Date(updateData.actual_end_date).toISOString().slice(0, 19).replace("T", " "));
    }
    if (updateData.status) {
      fields.push("status = ?");
      values.push(updateData.status);
    }
    if (updateData.estimatedAmount !== undefined) {
      fields.push("estimatedAmount = ?");
      values.push(updateData.estimatedAmount);
    }
    if (updateData.totalTimeSpent !== undefined) {
      fields.push("total_time_spent = ?");
      values.push(updateData.totalTimeSpent);
    }
    
    // Handle collection_data - only update if status is completed or if explicitly provided
    if (updateData.collection_data && updateData.status === 'completed') {
      fields.push("collection_data = ?");
      values.push(JSON.stringify(updateData.collection_data));
    }
    
    if (updateData.problems) {
      fields.push("problems = ?");
      values.push(JSON.stringify(updateData.problems));
    }
    if (updateData.comments) {
      fields.push("comments = ?");
      values.push(JSON.stringify(updateData.comments));
    }

    // --- AUTO CALCULATE PERFORMANCE METRICS WHEN STATUS CHANGES TO COMPLETED ---
    let efficiency = 0, quality = 0, punctuality = 0;

    if (isStatusChangingToCompleted) {
      // Efficiency = (Actual Collected / Estimated) * 100
      if (updateData.estimatedAmount && updateData.collection_data) {
        const totalCollected = Object.values(updateData.collection_data.paperTypes || {})
          .reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0);
        efficiency = totalCollected > 0 
          ? ((totalCollected / updateData.estimatedAmount) * 100).toFixed(2)
          : 0;
      }

      // Quality - check if there are any problems reported
      // If no problems, quality is 100%, otherwise lower based on problem severity
      const hasProblems = updateData.problems && updateData.problems.length > 0;
      quality = hasProblems ? 80 : 100; // Simple example - adjust as needed

      // Punctuality = compare estimated vs actual duration
      if (updateData.estimated_start_date && updateData.estimatedEndDate &&
          updateData.actual_start_date && updateData.actual_end_date) {
        const plannedDuration = new Date(updateData.estimatedEndDate) - new Date(updateData.estimated_start_date);
        const actualDuration = new Date(updateData.actual_end_date) - new Date(updateData.actual_start_date);
        
        if (plannedDuration > 0 && actualDuration > 0) {
          // If completed faster than estimated = good (over 100%)
          // If completed slower than estimated = bad (under 100%)
          punctuality = Math.min(120, Math.max(80, (plannedDuration / actualDuration) * 100)).toFixed(2);
        } else {
          punctuality = 100; // Default value if durations are invalid
        }
      } else {
        punctuality = 100; // Default value if dates are missing
      }

      console.log("Calculated performance metrics:", {
        efficiency,
        quality,
        punctuality,
        totalCollected: Object.values(updateData.collection_data?.paperTypes || {}).reduce((sum, a) => sum + a, 0),
        estimatedAmount: updateData.estimatedAmount
      });
    } else if (currentSession.status === 'completed') {
      // If already completed, keep existing performance metrics
      const existingPerformance = JSON.parse(currentSession.performance || "{}");
      efficiency = existingPerformance.efficiency || 0;
      quality = existingPerformance.quality || 0;
      punctuality = existingPerformance.punctuality || 0;
    }

    // Merge into performance JSON
    const performanceData = {
      efficiency: parseFloat(efficiency),
      quality: parseFloat(quality),
      punctuality: parseFloat(punctuality),
    };
    fields.push("performance = ?");
    values.push(JSON.stringify(performanceData));

    if (fields.length === 0) {
      throw new Error("No fields to update");
    }

    values.push(sessionId);

    // Run SQL
    const sql = `
      UPDATE collection_sessions
      SET ${fields.join(", ")}
      WHERE id = ?
    `;
    const result = await db.query(sql, values);

    if (result.affectedRows === 0) {
      throw new Error("No session found with the provided ID");
    }

    // Return updated session
    const [updatedSession] = await db.query(
      `SELECT * FROM collection_sessions WHERE id = ?`,
      [sessionId]
    );

    return {
      ...updatedSession,
      performance: JSON.parse(updatedSession.performance || "{}"),
      collection_data: updatedSession.status === 'completed' 
        ? JSON.parse(updatedSession.collection_data || "{}")
        : {},
      problems: JSON.parse(updatedSession.problems || "[]"),
      comments: JSON.parse(updatedSession.comments || "[]"),
    };

  } catch (error) {
    console.error("Error updating collection session:", error.message);
    throw error;
  }
}

async function createcostevaluation(data) {
  try {
    const {
      sessionId,
      supplierName,
      collectionCoordinator,
      startingDate,
      endDate,
      collectionType,
      collectedAmountKg,
      collectedAmountBagNumber,
      sw,
      sc,
      mixed,
      carton,
      card,
      newspaper,
      magazine,
      plastic,
      boxfile,
      metal,
      book,
      averageKgPerBag,
      rateOfBag,
      costOfBagPerKg,
      bagReceivedFromStock,
      bagUsed,
      bagReturn,
      noOfSortingAndCollectionLabor,
      sortingRate,
      costOfSortingAndCollectionLabour,
      costOfLabourPerKg,
      noOfLoadingUnloadingLabour,
      loadingUnloadingRate,
      costOfLoadingUnloading,
      costOfLoadingLabourPerKg,
      transportedBy,
      noOfTrip,
      costOfTransportation,
      costOfTransportPerKg,
      qualityCheckedBy,
      qualityApprovedBy,
      customerFeedback,
      keyOperationIssues
    } = data;

    const result = await db.query(
      `INSERT INTO cost_evaluations (
        session_id, supplier_name, collection_coordinator, starting_date, end_date, collection_type,
        collected_amount_kg, collected_amount_bag_number, sw, sc, mixed, carton, card, newspaper, magazine, plastic, boxfile, metal, book,
        average_kg_per_bag, rate_of_bag, cost_of_bag_per_kg, bag_received_from_stock, bag_used, bag_return,
        no_of_sorting_and_collection_labour, sorting_rate, cost_of_sorting_and_collection_labour, cost_of_labour_per_kg,
        no_of_loading_unloading_labour, loading_unloading_rate, cost_of_loading_unloading, cost_of_loading_labour_per_kg,
        transported_by, no_of_trip, cost_of_transportation, cost_of_transport_per_kg,
        quality_checked_by, quality_approved_by, customer_feedback, key_operation_issues
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        sessionId,
        supplierName,
        collectionCoordinator,
        startingDate,
        endDate,
        collectionType,
        collectedAmountKg,
        collectedAmountBagNumber,
        sw,
        sc,
        mixed,
        carton,
        card,
        newspaper,
        magazine,
        plastic,
        boxfile,
        metal,
        book,
        averageKgPerBag,
        rateOfBag,
        costOfBagPerKg,
        bagReceivedFromStock,
        bagUsed,
        bagReturn,
        noOfSortingAndCollectionLabor,
        sortingRate,
        costOfSortingAndCollectionLabour,
        costOfLabourPerKg,
        noOfLoadingUnloadingLabour,
        loadingUnloadingRate,
        costOfLoadingUnloading,
        costOfLoadingLabourPerKg,
        transportedBy,
        noOfTrip,
        costOfTransportation,
        costOfTransportPerKg,
        qualityCheckedBy,
        qualityApprovedBy,
        customerFeedback,
        keyOperationIssues
      ]
    );

    return { id: result.insertId, ...data };
  } catch (error) {
    console.error("❌ Error executing query:", error.message);
    throw new Error(error.message);
  }
}

async function getAllCostEvaluations() {
  try {
    const rows = await db.query(`SELECT * FROM cost_evaluations ORDER BY created_at DESC`);
    return rows;
  } catch (error) {
    console.error("❌ Error fetching cost evaluations:", error.message);
    throw new Error(error.message);
  }
}

async function deleteSiteEvaluation(id) {
  const result = await db.query("DELETE FROM cost_evaluations WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

async function getCustomers() {
  const rows = await db.query(`SELECT * FROM customers ORDER BY createdAt DESC`);
  return rows;
}

async function updateCustomer(id, data) {
  const sql = `
    UPDATE customers
    SET status = ?, joinDate = ?, customerName = ?, contactPerson = ?, phone = ?, sector = ?, location = ?
    WHERE id = ?
  `;
  await db.query(sql, [
    data.status,
    data.joinDate,
    data.customerName,
    data.contactPerson,
    data.phone,
    data.sector,
    data.location,
    id,
  ]);
  return { id, ...data };
}

async function deleteCustomer(id) {
  await db.query(`DELETE FROM customers WHERE id = ?`, [id]);
  return { message: "Customer deleted successfully" };
}


module.exports = {
  getcollectionType,getCustomers,
    getPaperTypes,
    createCollection,getDrivers,
    getcollectioncoordinator
    ,getcollectionsummary,
    getCollectionTypes,
    getCollectionList,getReportSummary,
    saveWeeklyPlans,
    getWeeklyPlan,
    getDailyCollectionReport,
  getCollectionReportByPaperType,
  getreportsummaryData,
  getSectors,
  getWeeklyCollectionData
  ,getCollectionTypeData,
  getMonthlyTrendData,
  getDashboardStats,
  getSuppliersStats,
  getMostActiveDays,
  createCollectionSession,
  getCollectionSession,
  updateSession,
  createcostevaluation,
  getAllCostEvaluations,
  deleteSiteEvaluation,createCustomer,updateCustomer,deleteCustomer

};
