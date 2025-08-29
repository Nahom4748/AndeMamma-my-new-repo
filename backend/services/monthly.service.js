//db immport

const db = require('../config/db.config');
// Function to generate monthly report
async function generateMonthlyReport(month, year) {
 try {
    // Default to current month/year if not provided
    const summary = await db.query(
      `
      SELECT 
        COUNT(rc.id) + COUNT(ic.id) AS totalCollections,
        COALESCE(SUM(rc.total_kg),0) + COALESCE(SUM(ic.total_kg),0) AS totalKg,
        ROUND((COALESCE(SUM(rc.total_kg),0) + COALESCE(SUM(ic.total_kg),0)) * 0.5,2) AS totalRevenue
      FROM RegularCollection rc
      LEFT JOIN InstoreCollection ic ON MONTH(rc.collection_date) = MONTH(ic.collection_date)
      WHERE (MONTH(rc.collection_date) = ? AND YEAR(rc.collection_date) = ?)
         OR (MONTH(ic.collection_date) = ? AND YEAR(ic.collection_date) = ?)
      `,
      [month, year, month, year]
    );

    // Top 5 performers by KG
    const topPerformers = await db.query(
      `
      SELECT 
        s.company_name AS name,
        COUNT(rc.id) + COUNT(ic.id) AS collections,
        COALESCE(SUM(rc.total_kg),0) + COALESCE(SUM(ic.total_kg),0) AS kg,
        ROUND((COALESCE(SUM(rc.total_kg),0) + COALESCE(SUM(ic.total_kg),0)) * 0.5,2) AS revenue,
        ROUND((COALESCE(SUM(rc.total_kg),0) + COALESCE(SUM(ic.total_kg),0)) / 
             (SELECT MAX(total_kg) FROM (
                SELECT COALESCE(SUM(r.total_kg),0) total_kg 
                FROM RegularCollection r WHERE MONTH(r.collection_date)=? AND YEAR(r.collection_date)=? GROUP BY r.supplier_id
                UNION
                SELECT COALESCE(SUM(i.total_kg),0) total_kg 
                FROM InstoreCollection i WHERE MONTH(i.collection_date)=? AND YEAR(i.collection_date)=? GROUP BY i.supplier_id
             ) t) * 100,2) AS efficiency
      FROM suppliers s
      LEFT JOIN RegularCollection rc ON s.id = rc.supplier_id AND MONTH(rc.collection_date)=? AND YEAR(rc.collection_date)=?
      LEFT JOIN InstoreCollection ic ON s.id = ic.supplier_id AND MONTH(ic.collection_date)=? AND YEAR(ic.collection_date)=?
      GROUP BY s.id
      ORDER BY kg DESC
      LIMIT 5
      `,
      [month, year, month, year, month, year, month, year]
    );

    // Target achievement (example: assume monthly target = 330000 kg)
    const target = 330000;
    const targetAchievement = summary[0].totalKg ? ((summary[0].totalKg / target) * 100).toFixed(2) : 0;

    return {
      totalCollections: summary[0].totalCollections,
      totalKg: summary[0].totalKg,
      totalRevenue: summary[0].totalRevenue,
      targetAchievement,
      topPerformers,
    };
  } catch (error) {
    throw new Error("Error fetching monthly report: " + error.message);
  }
}

async function getEmployeeMonthlyPerformance(month, year) {
  try {
    if (!month || !year) throw new Error("Month and year are required");

    const REGULAR_TARGET = 250000;
    const INSTORE_TARGET = 500000;

    // --- Regular Collection (Users with role 'regular cordination') ---
    const regularPerformance = await db.query(
      `
      SELECT
        CONCAT(u.first_name, ' ', u.last_name) AS name,
        ? AS target,
        COALESCE(SUM(rc.total_kg), 0) AS achieved,
        ROUND(COALESCE(SUM(rc.total_kg), 0)/?*100, 2) AS percentage
      FROM Users u
      JOIN Company_Roles cr ON u.company_role_id = cr.company_role_id
      LEFT JOIN RegularCollection rc
        ON rc.janitor_id = u.user_id
        AND MONTH(rc.collection_date) = ?
        AND YEAR(rc.collection_date) = ?
      WHERE cr.company_role_name = 'regular cordination'
      GROUP BY u.user_id
      ORDER BY name
      `,
      [REGULAR_TARGET, REGULAR_TARGET, month, year]
    );

    // --- Instore Collection (Users with role 'operation manager') ---
    const instorePerformance = await db.query(
      `
      SELECT
        CONCAT(u.first_name, ' ', u.last_name) AS name,
        ? AS target,
        COALESCE(SUM(ic.total_kg), 0) AS achieved,
        ROUND(COALESCE(SUM(ic.total_kg), 0)/?*100, 2) AS percentage
      FROM Users u
      JOIN Company_Roles cr ON u.company_role_id = cr.company_role_id
      LEFT JOIN InstoreCollection ic
        ON ic.janitor_id = u.user_id
        AND MONTH(ic.collection_date) = ?
        AND YEAR(ic.collection_date) = ?
      WHERE cr.company_role_name = 'operation manager'
      GROUP BY u.user_id
      ORDER BY name
      `,
      [INSTORE_TARGET, INSTORE_TARGET, month, year]
    );

    // --- Total Collections for the Month ---
    const [instoreTotal] = await db.query(
      `SELECT COALESCE(SUM(total_kg), 0) AS total FROM InstoreCollection
       WHERE MONTH(collection_date) = ? AND YEAR(collection_date) = ?`,
      [month, year]
    );
    const [regularTotal] = await db.query(
      `SELECT COALESCE(SUM(total_kg), 0) AS total FROM RegularCollection
       WHERE MONTH(collection_date) = ? AND YEAR(collection_date) = ?`,
      [month, year]
    );

    const totalInstoreKg = parseFloat(instoreTotal.total) || 0;
    const totalRegularKg = parseFloat(regularTotal.total) || 0;
    const totalKg = parseFloat((totalInstoreKg + totalRegularKg).toFixed(2));

    // --- Merge employee performance ---
    const employeePerformance = [
      ...instorePerformance.map(emp => ({
        name: emp.name,
        target: parseFloat(emp.target),
        achieved: parseFloat(emp.achieved),
        percentage: parseFloat(emp.percentage),
      })),
      ...regularPerformance.map(emp => ({
        name: emp.name,
        target: parseFloat(emp.target),
        achieved: parseFloat(emp.achieved),
        percentage: parseFloat(emp.percentage),
      })),
    ];

    return {
      month,
      year,
      totalKg,
      totalInstoreKg,
      totalRegularKg,
      employeePerformance
    };

  } catch (error) {
    throw new Error("Error fetching monthly performance: " + error.message);
  }
}

//










module.exports = {
  generateMonthlyReport,
    getEmployeeMonthlyPerformance
};