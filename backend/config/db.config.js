const mysql = require("mysql2/promise");

// Create pool configuration from environment variables
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
};

// Create a connection pool
const pool = mysql.createPool(dbConfig);

// General query function
async function query(sql, params) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error("❌ Error executing query:", error.message);
    throw error;
  }
}

module.exports = {
  query,
};
