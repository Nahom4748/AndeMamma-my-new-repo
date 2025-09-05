const db = require("../config/db.config");

// Fetch dashboard statistics
async function getYearlyDashboardStats() {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  // Query to get monthly sums for the current year
  const rows = await db.query(`
    SELECT 
      MONTH(collection_date) AS month_number,
      SUM(CASE WHEN type = 'regular' THEN total_kg ELSE 0 END) AS regular,
      SUM(CASE WHEN type = 'instore' THEN total_kg ELSE 0 END) AS instore
    FROM (
      SELECT collection_date, total_kg, 'regular' AS type FROM RegularCollection
      WHERE YEAR(collection_date) = YEAR(CURDATE())
      UNION ALL
      SELECT collection_date, total_kg, 'instore' AS type FROM InstoreCollection
      WHERE YEAR(collection_date) = YEAR(CURDATE())
    ) AS all_collections
    GROUP BY MONTH(collection_date)
    ORDER BY MONTH(collection_date)
  `);

  // Map result to your desired format
  const monthlyReport = months.map((m, idx) => {
    const monthData = rows.find(r => r.month_number === idx + 1);
    const regular = monthData ? monthData.regular : 0;
    const instore = monthData ? monthData.instore : 0;
    return {
      month: m,
      regular,
      instore,
      total: regular + instore
    };
  });

  return monthlyReport;
}

// Export functions
async function getSupplierPerformance() {
  try {
    const rows = await db.query(`
      SELECT 
        s.company_name AS supplier_name,
        SUM(CASE WHEN c.type = 'regular' THEN c.total_kg ELSE 0 END) AS regular,
        SUM(CASE WHEN c.type = 'instore' THEN c.total_kg ELSE 0 END) AS instore,
        SUM(c.total_kg) AS collections
      FROM suppliers s
      LEFT JOIN (
        SELECT supplier_id, total_kg, 'regular' AS type FROM RegularCollection
        UNION ALL
        SELECT supplier_id, total_kg, 'instore' AS type FROM InstoreCollection
      ) AS c ON s.id = c.supplier_id
      GROUP BY s.id, s.company_name
      ORDER BY collections DESC
      LIMIT 10
    `);

    // map DB results into frontend-friendly objects
    return rows.map(r => ({
      name: r.supplier_name,
      collections: Number(r.collections) || 0,
      regular: Number(r.regular) || 0,
      instore: Number(r.instore) || 0,
    }));

  } catch (error) {
    console.error("Error fetching supplier performance:", error.message);
    throw error;
  }
}


async function getCollectionTypeBreakdown() {
  try {
    // Query total kg per paper type from both collection types
    const rows = await db.query(`
      SELECT pt.code AS paper_type, SUM(ci.kg) AS total_kg
      FROM papertype pt
      LEFT JOIN (
        SELECT paper_type_id, kg FROM RegularCollectionItems
        UNION ALL
        SELECT paper_type_id, kg FROM InstoreCollectionItems
      ) AS ci ON pt.id = ci.paper_type_id
      GROUP BY pt.id, pt.code
      ORDER BY total_kg DESC
    `);

    // Map to frontend chart format
    const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
    const collectionTypes = rows.map((r, idx) => ({
      name: r.paper_type,
      value: r.total_kg || 0,
      color: colors[idx % colors.length]  // cycle colors if more types
    }));

    return collectionTypes;

  } catch (error) {
    console.error("Error fetching collection type breakdown:", error.message);
    throw error;
  }
}

//function getweeklycollectiontrends

async function getWeeklyCollectionTrends() {
  try {
    // Query to calculate collections grouped into 4 weeks of the current month
    const rows = await db.query(`
      SELECT 
        CEIL(DAY(collection_date) / 7) AS week_number,
        COUNT(*) AS collections,
        SUM(total_kg) AS kg
      FROM (
        SELECT collection_date, total_kg FROM RegularCollection
        WHERE YEAR(collection_date) = YEAR(CURDATE()) 
          AND MONTH(collection_date) = MONTH(CURDATE())
        UNION ALL
        SELECT collection_date, total_kg FROM InstoreCollection
        WHERE YEAR(collection_date) = YEAR(CURDATE()) 
          AND MONTH(collection_date) = MONTH(CURDATE())
      ) AS all_collections
      GROUP BY week_number
      ORDER BY week_number
    `);

    // Initialize all 4 weeks with 0 values
    const collectionTrends = [1, 2, 3, 4].map(week => {
      const found = rows.find(r => r.week_number === week);
      return {
        week: `Week ${week}`,
        collections: found ? found.collections : 0,
        kg: found ? found.kg : 0
      };
    });

    return collectionTrends;

  } catch (error) {
    console.error("Error fetching weekly collection trends:", error.message);
    throw error;
  }
}


//get getMonthlyData

async function getMonthlyData() {
  try {
    // 1️⃣ Totals for current month
    const totalsQuery = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM RegularCollection 
         WHERE YEAR(collection_date) = YEAR(CURDATE()) AND MONTH(collection_date) = MONTH(CURDATE())) +
        (SELECT COUNT(*) FROM InstoreCollection 
         WHERE YEAR(collection_date) = YEAR(CURDATE()) AND MONTH(collection_date) = MONTH(CURDATE())) AS totalCollections,

        (SELECT IFNULL(SUM(total_kg),0) FROM RegularCollection 
         WHERE YEAR(collection_date) = YEAR(CURDATE()) AND MONTH(collection_date) = MONTH(CURDATE())) +
        (SELECT IFNULL(SUM(total_kg),0) FROM InstoreCollection 
         WHERE YEAR(collection_date) = YEAR(CURDATE()) AND MONTH(collection_date) = MONTH(CURDATE())) AS totalKg,

        (SELECT IFNULL(SUM(total_kg*0.5),0) FROM RegularCollection 
         WHERE YEAR(collection_date) = YEAR(CURDATE()) AND MONTH(collection_date) = MONTH(CURDATE())) +
        (SELECT IFNULL(SUM(total_kg*0.5),0) FROM InstoreCollection 
         WHERE YEAR(collection_date) = YEAR(CURDATE()) AND MONTH(collection_date) = MONTH(CURDATE())) AS totalRevenue
    `);

    const totals = totalsQuery[0];

    // 2️⃣ Target achievement (example: assume 330,000 kg target)
    const targetAchievement = totals.totalKg > 0 ? Math.min((totals.totalKg / 330000) * 100, 100) : 0;

    // 3️⃣ Top performers by kg this month
    const topPerformersQuery = await db.query(`
      SELECT s.company_name AS name,
             COUNT(c.id) AS collections,
             SUM(c.total_kg) AS kg,
             SUM(c.total_kg*0.5) AS revenue,
             ROUND((SUM(c.total_kg)/5000)*100, 0) AS efficiency  -- assume target per supplier: 5000 kg
      FROM suppliers s
      LEFT JOIN (
        SELECT supplier_id, id, total_kg FROM RegularCollection
        WHERE YEAR(collection_date) = YEAR(CURDATE()) AND MONTH(collection_date) = MONTH(CURDATE())
        UNION ALL
        SELECT supplier_id, id, total_kg FROM InstoreCollection
        WHERE YEAR(collection_date) = YEAR(CURDATE()) AND MONTH(collection_date) = MONTH(CURDATE())
      ) c ON s.id = c.supplier_id
      GROUP BY s.id, s.company_name
      ORDER BY kg DESC
      LIMIT 5
    `);

    const topPerformers = topPerformersQuery.map(tp => ({
      name: tp.name,
      collections: tp.collections || 0,
      kg: tp.kg || 0,
      revenue: tp.revenue || 0,
      efficiency: tp.efficiency || 0
    }));

    // 4️⃣ Build final response
    const monthlyData = {
      totalCollections: totals.totalCollections || 0,
      totalKg: totals.totalKg || 0,
      totalRevenue: totals.totalRevenue || 0,
      targetAchievement: parseFloat(targetAchievement.toFixed(1)),
      topPerformers
    };

    return monthlyData;

  } catch (error) {
    console.error("Error fetching monthly data:", error.message);
    throw error;
  }
}


async function getEmployeePerformance() {
  try {
    // 1️⃣ Instore employees (Operation Managers via CollectionCoordinators)
    const instoreQuery = await db.query(`
      SELECT cc.name AS coordinator_name,
             SUM(ic.total_kg * 50) AS target,
             SUM(ic.total_kg * 50 * 0.95) AS achieved,
             ROUND(SUM(ic.total_kg * 50 * 0.95) / NULLIF(SUM(ic.total_kg * 50), 0) * 100, 1) AS percentage
      FROM CollectionCoordinators cc
      LEFT JOIN InstoreCollection ic ON cc.id = ic.collection_coordinator_id
      GROUP BY cc.id, cc.name
    `);

    const instorePerformance = instoreQuery.map(emp => ({
      name: emp.coordinator_name,
      target: emp.target || 0,
      achieved: emp.achieved || 0,
      percentage: emp.percentage || 0
    }));

    // 2️⃣ Regular employees (Users with role = 'regular cordination')
    const regularQuery = await db.query(`
      SELECT CONCAT(u.first_name, ' ', u.last_name) AS full_name,
             SUM(rc.total_kg * 50) AS target,
             SUM(rc.total_kg * 50 * 0.95) AS achieved,
             ROUND(SUM(rc.total_kg * 50 * 0.95) / NULLIF(SUM(rc.total_kg * 50), 0) * 100, 1) AS percentage
      FROM Users u
      LEFT JOIN RegularCollection rc ON u.user_id = rc.janitor_id -- adjust if wrong mapping
      WHERE u.company_role_id = (
        SELECT company_role_id FROM Company_Roles WHERE company_role_name = 'regular cordination'
      )
      GROUP BY u.user_id, full_name
    `);

    const regularPerformance = regularQuery.map(emp => ({
      name: emp.full_name,
      target: emp.target || 0,
      achieved: emp.achieved || 0,
      percentage: emp.percentage || 0
    }));

    return {
      instorePerformance,
      regularPerformance
    };

  } catch (error) {
    console.error("Error fetching employee performance:", error.message);
    throw error;
  }
}

async function getWeeklyPlanByDate(planDate) {
  try {
    // ================== Define week range ==================
    const startOfWeek = new Date(planDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // Monday

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday

    // ================== Fetch weekly plans ==================
    const query = `
      SELECT 
        w.id,
        s.company_name AS supplier,
        s.location,
        CONCAT(d.first_name, ' ', d.last_name) AS driverName,
        CONCAT(c.first_name, ' ', c.last_name) AS coordinatorName,
        ct.name AS type,
        w.status,
        w.day
      FROM WeeklyPlan w
      JOIN suppliers s ON w.supplier_id = s.id
      LEFT JOIN Users d ON w.driver_id = d.user_id
      LEFT JOIN Users c ON w.coordinator_id = c.user_id
      JOIN CollectionType ct ON w.collection_type_id = ct.id
      WHERE w.plan_date BETWEEN ? AND ?
      ORDER BY s.company_name ASC
    `;

    const rows = await db.query(query, [startOfWeek, endOfWeek]);

    // ================== Format schedule ==================
    const schedule = rows.map(r => ({
      supplier: r.supplier,
      location: r.location,
      assignedTo:
        r.type.toLowerCase() === "regular"
          ? r.driverName || "N/A"
          : r.coordinatorName || "N/A",
      type: r.type.toLowerCase(),
      status: r.status
    }));

    // ================== Count plans per weekday ==================
    const daysOfWeek = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

    const weeklyCounts = daysOfWeek.map(day => {
      const count = rows.filter(r => r.day === day).length;
      return { day, count };
    });

    // ================== Return combined result ==================
    return {
      schedule,
      upcomingWeek: weeklyCounts
    };

  } catch (error) {
    console.error("❌ Error fetching weekly plan:", error.message);
    throw error;
  }
}







module.exports = {
    getYearlyDashboardStats,
    getSupplierPerformance,
    getCollectionTypeBreakdown,
    getWeeklyCollectionTrends
    ,getMonthlyData,
    getEmployeePerformance,
    getWeeklyPlanByDate
};