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
//   `);
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
async function saveWeeklyPlans(plans, createdBy) {
  console.log('Saving weekly plans:', plans, 'Created by:', createdBy);
  if (!Array.isArray(plans) || plans.length === 0) {
    throw new Error('Invalid plans data');
  }

  if (!createdBy) {
    throw new Error('Missing createdBy user ID');
  }

  const insertPromises = plans.map((plan, index) => {
    const { plan_date, supplier_id, collection_type_id } = plan;

    if (!plan_date || !supplier_id || !collection_type_id) {
      throw new Error(`Missing data in plan at index ${index}`);
    }

    return db.query(
      `INSERT INTO WeeklyPlan (plan_date, collection_type_id, supplier_id,  created_by)
       VALUES (?, ?, ?, ?)`,
      [plan_date, collection_type_id ,supplier_id,  createdBy]
    );
  });

  await Promise.all(insertPromises);
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
    // Get scheduled collections for the date (only supplier name and collection type)
    const [scheduledCollections] = await db.query(`
      SELECT 
        s.company_name AS supplier_name,
        ct.name AS collection_type
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






module.exports = {
  getcollectionType,
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
  getSectors
};
