const db = require('../config/db.config'); // <-- Import the pool
const { get } = require('../routes');
const { getMonthRange } = require("../utils/dateHelper");


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
  console.log(plans)
  if (!Array.isArray(plans) || plans.length === 0) {
    throw new Error("Invalid or empty plans array");
  }

  const { createdBy } = plans[0];
  if (!createdBy) {
    throw new Error("Missing createdBy in plans");
  }

  const insertPromises = plans.map(async (plan, index) => {
    const { supplier_id, day, date, notes, type } = plan;

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

async function updateWeeklyPlanStatus(plans) { 
  const { id, status, updatedAt, total_collection_kg, note, rejection_reason } = plans[0];


  try {
    return await db.query(
      `UPDATE WeeklyPlan 
       SET status = ?, 
           total_collection_kg = ?, 
           updatedAt = ?, 
           note = ?, 
           rejection_reason = ?
       WHERE id = ?`,
      [status, total_collection_kg, updatedAt, note || null, rejection_reason || null, id]
    );
  } catch (error) {
    console.error(`Failed to update WeeklyPlan with id ${id}:`, error);
    throw error;
  }
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
      SELECT 
        wp.id,
        wp.plan_date,
        wp.day,
        wp.note,
        wp.collection_type_id,
        wp.status,
        wp.total_collection_kg,
        wp.rejection_reason,
        wp.updatedAt,
        ct.name AS collection_type_name,

        -- Supplier
        wp.supplier_id,
        s.company_name AS supplier_name,

        -- Instore fields
        wp.coordinator_id,
        cc.name AS coordinator_name,
        wp.marketer_name,

        -- Regular fields
        wp.driver_id,
        d.name AS driver_name

      FROM WeeklyPlan wp
      JOIN suppliers s ON wp.supplier_id = s.id
      JOIN CollectionType ct ON wp.collection_type_id = ct.id
      LEFT JOIN driver d ON wp.driver_id = d.id
      LEFT JOIN collectioncoordinators cc ON wp.coordinator_id = cc.id
      ORDER BY wp.plan_date DESC
    `);

    return rows.map(row => {
      if (row.collection_type_name.toLowerCase() === "instore") {
        return {
          id: row.id,
          date: row.plan_date,
          day: row.day,
          status: row.status,
          totalKg: row.total_collection_kg,
          rejectionReason: row.rejection_reason,
          updatedAt: row.updatedAt,

          supplier: row.supplier_name,
                    collectionType: row.collection_type_name, // ✅ added
          coordinator: row.coordinator_name,
          marketer: row.marketer_name,
          time: row.plan_time,
          note: row.note
        };
      } else {
        return {
          id: row.id,
          date: row.plan_date,
          day: row.day,
          status: row.status,
          totalKg: row.total_collection_kg,
          rejectionReason: row.rejection_reason,
          updatedAt: row.updatedAt,

          supplier: row.supplier_name,
          collectionType: row.collection_type_name, // ✅ added

          driver: row.driver_name,
          note: row.note
        };
      }
    });
  } catch (error) {
    console.error("Error retrieving weekly plans:", error);
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
      -- Total this month (kg sum from both types)
      (
        (SELECT IFNULL(SUM(total_kg), 0) 
         FROM InstoreCollection 
         WHERE YEAR(collection_date) = YEAR(CURDATE()) 
           AND MONTH(collection_date) = MONTH(CURDATE()))
        +
        (SELECT IFNULL(SUM(total_kg), 0) 
         FROM RegularCollection 
         WHERE YEAR(collection_date) = YEAR(CURDATE()) 
           AND MONTH(collection_date) = MONTH(CURDATE()))
      ) AS total_collections_kg,

      -- Active suppliers
      (SELECT COUNT(*) FROM suppliers) AS active_suppliers,

      -- Scheduled visits today
      (SELECT COUNT(*) FROM MarketerVisitPlans WHERE visit_date = CURDATE()) AS scheduled_today,

      -- Monthly reports (count of visit plans)
      (SELECT COUNT(*) FROM MarketerVisitPlans 
       WHERE YEAR(visit_date) = YEAR(CURDATE()) 
         AND MONTH(visit_date) = MONTH(CURDATE())) AS monthly_reports,

      -- Weekly Regular total
      (SELECT IFNULL(SUM(total_kg), 0) 
       FROM RegularCollection 
       WHERE YEARWEEK(collection_date, 1) = YEARWEEK(CURDATE(), 1)) AS weekly_regular,

      -- Weekly Instore total
      (SELECT IFNULL(SUM(total_kg), 0) 
       FROM InstoreCollection 
       WHERE YEARWEEK(collection_date, 1) = YEARWEEK(CURDATE(), 1)) AS weekly_instore
  `);

  const data = rows[0];

  return [
    {
      title: "Total Collections (kg)",
      value: data.total_collections_kg.toLocaleString(),
      description: "This month",
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
    {
      title: "Weekly Regular Collections (kg)",
      value: data.weekly_regular.toLocaleString(),
      description: "This week",
    },
    {
      title: "Weekly Instore Collections (kg)",
      value: data.weekly_instore.toLocaleString(),
      description: "This week",
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
    console.log("Session Data:", data);

    // 🔄 Normalize keys from frontend
    const normalized = {
      sessionNumber: data.session_number || `CS-${Date.now()}`,
      supplierId: data.supplier_id,
      supplierName: data.supplier_name,
      site_location: data.site_location,
      marketerId: data.marketer_id,
      marketerName: data.marketer_name,
      coordinatorId: data.coordinator_id || null,
      coordinatorName: data.coordinator_name || null,
      estimated_start_date: data.estimated_start_date,
      estimatedEndDate: data.estimated_end_date,
      estimatedAmount: data.estimatedAmount,
      status: data.status || "scheduled",
      collectionData: data.collection_data || null,
      performance: data.performance || null,
      problems: data.problems || null,
      comments: data.comments || null,
      totalTimeSpent: data.total_time_spent || 0,
    };

    // 🧩 Check required fields
    const requiredFields = ["supplierId", "site_location", "estimated_start_date", "estimatedEndDate"];
    const missingFields = requiredFields.filter((f) => !normalized[f]);
    if (missingFields.length) throw new Error(`Missing required fields: ${missingFields.join(", ")}`);

    // 📅 Format dates for MySQL
    const formatDate = (date) =>
      date ? new Date(date).toISOString().slice(0, 19).replace("T", " ") : null;

    // 🧠 Ensure coordinator exists (if provided)
    if (normalized.coordinatorId) {
      const exists = await db.query(
        "SELECT user_id FROM users WHERE user_id = ? LIMIT 1",
        [normalized.coordinatorId]
      );
      if (!exists || exists.length === 0) {
        console.warn(`⚠️ Coordinator ID ${normalized.coordinatorId} not found. Setting to NULL.`);
        normalized.coordinatorId = null;
      }
    }

    // 📝 Insert session
    const result = await db.query(
      `INSERT INTO collection_sessions
       (session_number, supplier_id, marketer_id, coordinator_id,
        site_location, estimated_start_date, estimated_end_date,
        actual_start_date, actual_end_date, status, estimatedAmount,
        total_time_spent, performance, collection_data, problems, comments)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        normalized.sessionNumber,
        normalized.supplierId,
        normalized.marketerId || null,
        normalized.coordinatorId || null,
        normalized.site_location,
        formatDate(normalized.estimated_start_date),
        formatDate(normalized.estimatedEndDate),
        formatDate(normalized.estimated_start_date),
        formatDate(normalized.estimatedEndDate),
        normalized.status,
        normalized.estimatedAmount || 0,
        normalized.totalTimeSpent,
        JSON.stringify(normalized.performance || { efficiency: 0, quality: 0, punctuality: 0 }),
        JSON.stringify(
          normalized.collectionData || {
            estimatedAmount: 0,
            paperTypes: { carton: 0, mixed: 0, sw: 0, sc: 0, np: 0 },
          }
        ),
        JSON.stringify(normalized.problems || []),
        JSON.stringify(normalized.comments || []),
      ]
    );

    // 🔁 Update MarketerOrders status
    await db.query(
      `UPDATE MarketerOrders 
       SET status = 'onprocess' 
       WHERE supplier_id = ? AND marketer_id = ?`,
      [normalized.supplierId, normalized.marketerId]
    );

    // ✅ Return inserted session
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
    console.error("❌ Error in createCollectionSession:", error.message);
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
        CONCAT(cc.first_name,' ',cc.last_name) AS coordinator_name,  
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
      LEFT JOIN users cc ON cs.coordinator_id = cc.user_id
      -- ✅ Filter for current month and last month
      WHERE cs.created_at >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
      ORDER BY cs.created_at DESC
    `);

    return rows.map(row => ({
      ...row,
      // Only parse collection_data if status is 'completed'
      collection_data: row.status === 'completed' 
        ? JSON.parse(row.collection_data || "{}") 
        : {},
      // Always parse performance, problems, and comments
      performance: JSON.parse(row.performance || "{}"),
      problems: JSON.parse(row.problems || "[]"),
      comments: JSON.parse(row.comments || "[]"),
    }));

  } catch (error) {
    console.error("❌ Error retrieving collection sessions:", error.message);
    throw error;
  }
}


async function updateSession(sessionId, updateData) {
  try {
    console.log("Updating collection session with ID:", sessionId, "and data:", updateData);

    if (!sessionId) throw new Error("Session ID is required");

    // ✅ Normalize incoming keys (from frontend)
    const normalized = {
      supplierId: updateData.supplier_id ?? updateData.supplierId ?? null,
      marketerId: updateData.marketer_id ?? updateData.marketerId ?? null,
      coordinatorId: updateData.coordinator_id ?? updateData.coordinatorId ?? null,
      site_location: updateData.site_location ?? null,
      estimated_start_date: updateData.estimated_start_date ?? null,
      estimatedEndDate: updateData.estimated_end_date ?? updateData.estimatedEndDate ?? null,
      actual_start_date: updateData.actual_start_date ?? null,
      actual_end_date: updateData.actual_end_date ?? null,
      estimatedAmount: updateData.estimatedAmount ?? null,
      totalTimeSpent: updateData.totalTimeSpent ?? null,
      status: updateData.status ?? null,
      comment: updateData.comment ?? null,
      comments: updateData.comments ?? [],
      problems: updateData.problems ?? [],
      collection_data: updateData.collection_data ?? null,
    };

    // ✅ Sync MarketerOrders status and notes
    if (normalized.status === 'completed' || normalized.status === 'cancelled') {
      await db.query(
        `UPDATE MarketerOrders 
         SET status = ?, additional_notes = ?
         WHERE supplier_id = ? AND marketer_id = ?`,
        [
          normalized.status,
          normalized.comment,
          normalized.supplierId,
          normalized.marketerId
        ]
      );
    }

    // ✅ Get current session
    const [currentSession] = await db.query(
      `SELECT status, collection_data, performance FROM collection_sessions WHERE id = ?`,
      [sessionId]
    );

    const isStatusChangingToCompleted =
      normalized.status === 'completed' &&
      currentSession.status !== 'completed';

    // ✅ Build dynamic update fields
    const fields = [];
    const values = [];

    const pushField = (field, value) => {
      if (value !== undefined) fields.push(`${field} = ?`), values.push(value ?? null);
    };

    pushField("supplier_id", normalized.supplierId);
    pushField("marketer_id", normalized.marketerId);
    pushField("coordinator_id", normalized.coordinatorId);
    pushField("site_location", normalized.site_location);
    pushField("estimated_start_date", normalized.estimated_start_date ? new Date(normalized.estimated_start_date).toISOString().slice(0, 19).replace("T", " ") : null);
    pushField("estimated_end_date", normalized.estimatedEndDate ? new Date(normalized.estimatedEndDate).toISOString().slice(0, 19).replace("T", " ") : null);
    pushField("actual_start_date", normalized.actual_start_date ? new Date(normalized.actual_start_date).toISOString().slice(0, 19).replace("T", " ") : null);
    pushField("actual_end_date", normalized.actual_end_date ? new Date(normalized.actual_end_date).toISOString().slice(0, 19).replace("T", " ") : null);
    pushField("status", normalized.status);
    pushField("estimatedAmount", normalized.estimatedAmount);
    pushField("total_time_spent", normalized.totalTimeSpent);
    pushField("problems", JSON.stringify(normalized.problems));
    pushField("comments", JSON.stringify(normalized.comments));

    // ✅ Compute performance if completed
    let performanceData = { efficiency: 0, quality: 0, punctuality: 0 };

    if (isStatusChangingToCompleted) {
      const totalCollected = Object.values(normalized.collection_data?.paperTypes || {}).reduce(
        (sum, val) => sum + (parseFloat(val) || 0),
        0
      );

      const estimated = parseFloat(normalized.estimatedAmount) || 0;
      const efficiency = estimated > 0 ? ((totalCollected / estimated) * 100).toFixed(2) : 0;
      const quality = normalized.problems.length ? 80 : 100;
      const punctuality = 100;

      performanceData = { efficiency, quality, punctuality };

      pushField("collection_data", JSON.stringify(normalized.collection_data));
    } else if (currentSession.status === 'completed') {
      performanceData = JSON.parse(currentSession.performance || "{}");
    }

    pushField("performance", JSON.stringify(performanceData));

    if (fields.length === 0) throw new Error("No fields to update");

    values.push(sessionId);

    // ✅ Run query safely
    const sql = `
      UPDATE collection_sessions
      SET ${fields.join(", ")}
      WHERE id = ?
    `;
    const result = await db.query(sql, values.map(v => v === undefined ? null : v));

    if (result.affectedRows === 0) throw new Error("No session found with the provided ID");

    // ✅ Return updated session
    const [updatedSession] = await db.query(
      `SELECT * FROM collection_sessions WHERE id = ?`,
      [sessionId]
    );

    return {
      ...updatedSession,
      performance: JSON.parse(updatedSession.performance || "{}"),
      collection_data: JSON.parse(updatedSession.collection_data || "{}"),
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

async function fetchCollectionsByDateRange(startDate, endDate) {
  const formatDate = (date) => new Date(date).toISOString().slice(0, 10);
  const start = formatDate(startDate);
  const end = formatDate(endDate);

  // --- Regular Collections ---
  const regularCollections = await db.query(`
    SELECT 
      rc.supplier_id,
      s.company_name AS supplier_name,
      'Regular' AS collection_type,
      rci.paper_type_id,
      pt.description AS paper_type,
      SUM(rci.kg) AS total_kg,
      SUM(rci.bag_count) AS total_bag,
      j.name AS janitor_name,
      j.account AS janitor_account
    FROM RegularCollection rc
    JOIN RegularCollectionItems rci ON rc.id = rci.regular_collection_id
    JOIN suppliers s ON rc.supplier_id = s.id
    JOIN PaperType pt ON rci.paper_type_id = pt.id
    JOIN janitors j ON rc.janitor_id = j.id
    WHERE rc.collection_date BETWEEN ? AND ?
    GROUP BY rc.supplier_id, rci.paper_type_id, j.id
  `, [start, end]);

  // --- Instore Collections ---
  const instoreCollections = await db.query(`
    SELECT 
      ic.supplier_id,
      s.company_name AS supplier_name,
      'Instore' AS collection_type,
      ici.paper_type_id,
      pt.description AS paper_type,
      SUM(ici.kg) AS total_kg,
      SUM(ici.bag_count) AS total_bag,
      j.name AS janitor_name,
      j.account AS janitor_account
    FROM InstoreCollection ic
    JOIN InstoreCollectionItems ici ON ic.id = ici.instore_collection_id
    JOIN suppliers s ON ic.supplier_id = s.id
    JOIN PaperType pt ON ici.paper_type_id = pt.id
    JOIN janitors j ON ic.janitor_id = j.id
    WHERE ic.collection_date BETWEEN ? AND ?
    GROUP BY ic.supplier_id, ici.paper_type_id, j.id
  `, [start, end]);

  // Combine results
  const allCollections = [...regularCollections, ...instoreCollections];

  // Group by supplier
  const grouped = allCollections.reduce((acc, row) => {
    if (!acc[row.supplier_id]) {
      acc[row.supplier_id] = {
        supplier_id: row.supplier_id,
        supplier_name: row.supplier_name,
        collections: []
      };
    }
    acc[row.supplier_id].collections.push({
      collection_type: row.collection_type,
      paper_type_id: row.paper_type_id,
      paper_type: row.paper_type,
      total_kg: row.total_kg,
      total_bag: row.total_bag,
      janitor_name: row.janitor_name,
      janitor_account: row.janitor_account
    });
    return acc;
  }, {});

  return Object.values(grouped);
}
//get all getCompletedPlans

async function getCompletedPlans() {
  try {
    const rows = await db.query(`
      SELECT 
        wp.id,
        wp.plan_date,
        wp.day,
        wp.note,
        wp.collection_type_id,
        ct.name AS collection_type_name,

        -- Supplier
        wp.supplier_id,
        s.company_name AS supplier_name,

        -- Instore fields
        wp.coordinator_id,
        cc.name AS coordinator_name,
        wp.marketer_name,

        -- Regular fields
        wp.driver_id,
        d.name AS driver_name

      FROM WeeklyPlan wp
      JOIN suppliers s ON wp.supplier_id = s.id
      JOIN CollectionType ct ON wp.collection_type_id = ct.id
      LEFT JOIN driver d ON wp.driver_id = d.id
      LEFT JOIN collectioncoordinators cc ON wp.coordinator_id = cc.id
      WHERE wp.plan_date < CURDATE()  -- Only past dates
      ORDER BY wp.plan_date DESC
    `);

    return rows.map(row => {
      if (row.collection_type_name.toLowerCase() === "instore") {
        return {
          id: row.id,
          date: row.plan_date,
          day: row.day,
          supplier: row.supplier_name,
          collectionType: row.collection_type_name, // ✅ added
          coordinator: row.coordinator_name,
          marketer: row.marketer_name,
          time: row.plan_time,
          note: row.note
        };
      } else {
        return {
          id: row.id,
          date: row.plan_date,
          day: row.day,
          supplier: row.supplier_name,
          collectionType: row.collection_type_name, // ✅ added
          driver: row.driver_name,
          note: row.note
        };
      }
    });
  } catch (error) {
    console.error("Error retrieving completed plans:", error);
    throw error;
  }
}

async function createRegularPlan(data) {
  try {
  
    const result = await db.query(
      `INSERT INTO WeeklyPlan 
        (plan_date, day, collection_type_id, supplier_id, note, created_by, driver_id, coordinator_id, marketer_name, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.collection_date,         // plan_date
        data.collection_day,          // day
        2,                            // Regular collection_type_id (hardcoded = 2)
        data.supplier_id,             // supplier_id
        data.notes || null,           // note (frontend key: notes)
        parseInt(data.created_by),    // created_by (cast to INT)
        data.driver_id,                     // validated driver_id
        data.coordinator_id || null,  // coordinator_id (optional)
        data.marketer_name || null,   // marketer_name
        data.status || "pending"      // default = pending
      ]
    );

    return { ...data, id: result.insertId };
  } catch (error) {
    console.error("Error creating regular plan:", error.message);
    throw error;
  }
}

async function createInStorePlan(data) {
  try {
    // Validate required fields
       const result = await db.query(
      `INSERT INTO WeeklyPlan 
        (plan_date, day, collection_type_id, supplier_id, note, created_by, driver_id, coordinator_id, marketer_name, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.collection_date,         // plan_date
        data.collection_day,          // day
        1,             // mapped from type
        data.supplier_id,             // supplier_id
        data.notes || null,           // note
        parseInt(data.created_by),    // created_by
        null,                     // validated driver_id
        data.coordinator_id || null,  // coordinator_id
        data.marketer_name || null,   // marketer_name
        data.status || "pending"      // default = pending
      ]
    );

    return { id: result.insertId, ...data };
  } catch (error) {
    console.error("Error creating collection plan:", error.message);
    throw error;
  }
}



async function getMarketerSuppliersWithCollections(marketerId) {
  if (!marketerId) throw new Error("Marketer ID is required");

  const { start, end } = getMonthRange(); // first and last day of current month

  // 1️⃣ Get suppliers assigned to marketer
  const suppliers = await db.query(
    `
    SELECT s.id AS supplier_id, s.company_name
    FROM suppliers s
    INNER JOIN SupplierMarketerAssignments sma
      ON s.id = sma.supplier_id
    WHERE sma.marketer_id = ?
    ORDER BY s.company_name ASC
    `,
    [marketerId]
  );

  let totalInstoreKg = 0;
  let totalRegularKg = 0;
  let totalInstoreCount = 0;
  let totalRegularCount = 0;

  const results = [];

  for (const supplier of suppliers) {
    // ✅ Instore
    const instore = await db.query(
      `SELECT COUNT(*) AS collection_count, IFNULL(SUM(total_kg),0) AS total_kg
       FROM InstoreCollection
       WHERE supplier_id = ? AND collection_date BETWEEN ? AND ?`,
      [supplier.supplier_id, start, end]
    );

    // ✅ Regular
    const regular = await db.query(
      `SELECT COUNT(*) AS collection_count, IFNULL(SUM(total_kg),0) AS total_kg
       FROM RegularCollection
       WHERE supplier_id = ? AND collection_date BETWEEN ? AND ?`,
      [supplier.supplier_id, start, end]
    );

    totalInstoreKg += instore[0].total_kg;
    totalRegularKg += regular[0].total_kg;
    totalInstoreCount += instore[0].collection_count;
    totalRegularCount += regular[0].collection_count;

    results.push({
      supplierName: supplier.company_name,
      collections: [
        { type: "Instore", totalKg: instore[0].total_kg },
        { type: "Regular", totalKg: regular[0].total_kg },
      ]
    });
  }

  // ✅ Final summary
  const summary = {
    totalInstoreCollections: totalInstoreCount,
    totalRegularCollections: totalRegularCount,
    totalKgCollected: totalInstoreKg + totalRegularKg
  };

  return { results, summary };
}

async function getcollectioncordinatordashbord() {
  try {
    const rows = await db.query(
      `
      SELECT 
        -- Current Month total KG
        COALESCE((
          SELECT SUM(ic.total_kg)
          FROM InstoreCollection ic
          WHERE MONTH(ic.collection_date) = MONTH(CURRENT_DATE())
            AND YEAR(ic.collection_date) = YEAR(CURRENT_DATE())
        ), 0) AS month_total_kg,

        -- Current Week total KG
        COALESCE((
          SELECT SUM(ic.total_kg)
          FROM InstoreCollection ic
          WHERE YEARWEEK(ic.collection_date, 1) = YEARWEEK(CURRENT_DATE(), 1)
        ), 0) AS week_total_kg,

        -- Today’s total KG
        COALESCE((
          SELECT SUM(ic.total_kg)
          FROM InstoreCollection ic
          WHERE DATE(ic.collection_date) = CURRENT_DATE()
        ), 0) AS today_total_kg,

        -- ✅ Total suppliers in database
        (SELECT COUNT(*) FROM suppliers) AS total_suppliers,

        -- ✅ Distinct suppliers with collection this month
        COALESCE((
          SELECT COUNT(DISTINCT ic.supplier_id)
          FROM InstoreCollection ic
          WHERE MONTH(ic.collection_date) = MONTH(CURRENT_DATE())
            AND YEAR(ic.collection_date) = YEAR(CURRENT_DATE())
        ), 0) AS month_suppliers
      `
    );

    // 🔹 Ensure all days (Mon–Sat) included
    const weekRows = await db.query(
      `
      SELECT d.day_name, COALESCE(SUM(ic.total_kg), 0) AS total_kg
      FROM (
        SELECT 'Monday' AS day_name, 2 AS dow UNION ALL
        SELECT 'Tuesday', 3 UNION ALL
        SELECT 'Wednesday', 4 UNION ALL
        SELECT 'Thursday', 5 UNION ALL
        SELECT 'Friday', 6 UNION ALL
        SELECT 'Saturday', 7
      ) d
      LEFT JOIN InstoreCollection ic 
        ON DAYOFWEEK(ic.collection_date) = d.dow
       AND YEARWEEK(ic.collection_date, 1) = YEARWEEK(CURRENT_DATE(), 1)
      GROUP BY d.day_name, d.dow
      ORDER BY d.dow
      `
    );

    return {
      ...rows[0],
      week_daily: weekRows   // Always 6 days with 0 if no collection
    };
  } catch (error) {
    console.error("❌ Error retrieving instore performance:", error);
    throw error;
  }
}

// ✅ Fetch weekly plan collection with all related details
// ✅ Fetch weekly plan collection with all related details
async function getWeeklyPlancollection(startDate, endDate) {
  try {
    const rows = await db.query(
      `
      SELECT
        wp.id,
        wp.plan_date,
        wp.day,
        wp.note,  -- 📝 Plan note
        wp.collection_type_id,
        ct.name AS collection_type_name,
        
        -- Supplier info
        wp.supplier_id,
        s.company_name AS supplier_name,
        r.name AS region_name,
        sec.name AS sector_name,
        
        -- Coordinator info (from Users)
        wp.coordinator_id,
        CONCAT(cu.first_name, ' ', cu.last_name) AS coordinator_name,
        
        -- Driver info (from Users)
        wp.driver_id,
        CONCAT(du.first_name, ' ', du.last_name) AS driver_name,
        
        -- Marketer name (text field in WeeklyPlan)
        wp.marketer_name,
        
        -- Status & details
        wp.status,
        wp.total_collection_kg,
        wp.updatedAt,
        wp.not_completed_date,
        wp.rejection_reason,
        wp.created_at
        
      FROM WeeklyPlan wp
      JOIN suppliers s ON wp.supplier_id = s.id
      JOIN regions r ON s.region_id = r.id
      JOIN sectors sec ON s.sector_id = sec.id
      JOIN CollectionType ct ON wp.collection_type_id = ct.id
      
      LEFT JOIN Users cu ON wp.coordinator_id = cu.user_id
      LEFT JOIN Users du ON wp.driver_id = du.user_id
      
      WHERE wp.plan_date BETWEEN ? AND ?
      ORDER BY wp.plan_date DESC
      `,
      [startDate, endDate]
    );

    return rows;
  } catch (error) {
    console.error("Error retrieving weekly plan collections:", error);
    throw error;
  }
}

// ✅ Supplier Collection Summary
// ✅ Supplier Collection Summary with last collection type, kg, and total collections count
async function getSupplierCollectionSummary() {
  try {
    const rows = await db.query(
      `
      SELECT 
        s.id AS supplier_id,
        s.company_name AS supplier_name,
        
        -- Last collection date
        last_collection.collection_date AS last_collection_date,

        -- Was there collection in the last 3 months?
        CASE 
          WHEN last_collection.collection_date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) 
          THEN 'Yes' 
          ELSE 'No' 
        END AS collected_in_last_3_months,

        -- Last collection type
        CASE 
          WHEN last_collection.collection_type_id = 1 THEN 'Instore'
          WHEN last_collection.collection_type_id = 2 THEN 'Regular'
          ELSE 'None'
        END AS last_collection_type,

        -- Last collection KG
        last_collection.total_kg AS last_collection_kg,

        -- ✅ Total collections count (all time)
        COALESCE(total_summary.total_collections, 0) AS total_collections

      FROM suppliers s
      LEFT JOIN (
        -- Union Instore & Regular, add collection_type_id to distinguish
        SELECT supplier_id, collection_date, total_kg, 1 AS collection_type_id
        FROM InstoreCollection
        UNION ALL
        SELECT supplier_id, collection_date, total_kg, 2 AS collection_type_id
        FROM RegularCollection
      ) all_collections 
        ON s.id = all_collections.supplier_id
      LEFT JOIN (
        -- Pick the real last collection row per supplier
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
      ) last_collection ON s.id = last_collection.supplier_id
      LEFT JOIN (
        -- ✅ Total collections count per supplier
        SELECT supplier_id, COUNT(*) AS total_collections
        FROM (
          SELECT supplier_id FROM InstoreCollection
          UNION ALL
          SELECT supplier_id FROM RegularCollection
        ) t
        GROUP BY supplier_id
      ) total_summary ON s.id = total_summary.supplier_id

      GROUP BY 
        s.id, 
        s.company_name, 
        last_collection.collection_date, 
        last_collection.total_kg, 
        last_collection.collection_type_id, 
        total_summary.total_collections
      ORDER BY s.company_name ASC
      `
    );

    return rows;
  } catch (error) {
    console.error("Error retrieving supplier collection summary:", error);
    throw error;
  }
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
  deleteSiteEvaluation,createCustomer,updateCustomer,deleteCustomer,
  fetchCollectionsByDateRange,
updateWeeklyPlanStatus,
getCompletedPlans,
createRegularPlan,
createInStorePlan,
getMarketerSuppliersWithCollections,
getcollectioncordinatordashbord,
getWeeklyPlancollection,
getSupplierCollectionSummary

};
