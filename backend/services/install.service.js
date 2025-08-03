const conn = require("../config/db.config");
const fs = require("fs");
const bcrypt = require("bcrypt");
const saltRounds = 10;

async function install() {
  const queryfile = __dirname + "/sql/initial-queries.sql";
  let queries = [];
  let finalMessage = { status: 500, message: "Installation failed" };
  let templine = "";

  try {
    // Read and parse SQL file
    const lines = fs.readFileSync(queryfile, "utf-8").split("\n");

    lines.forEach((line) => {
      if (line.trim().startsWith("--") || line.trim() === "") return;
      templine += line;
      if (line.trim().endsWith(";")) {
        queries.push(templine.trim());
        templine = "";
      }
    });

    // Execute all table creation queries
    for (const query of queries) {
      try {
        await conn.query(query);
      } catch (err) {
        // Skip "table already exists" errors
        if (err.code !== 'ER_TABLE_EXISTS_ERROR') {
          console.error("Error executing query:", query, err);
          throw err;
        }
      }
    }

    // Generate bcrypt hash for admin password
    const hashedPassword = await bcrypt.hash("123456789", saltRounds);

    // Update admin password in User_Passwords table
    await conn.query(`
      UPDATE User_Passwords 
      SET password_hashed = ?
      WHERE user_id = (
        SELECT user_id FROM Users 
        WHERE first_name = 'Admin' AND last_name = 'User'
      )
    `, [hashedPassword]);

    finalMessage.status = 200;
    finalMessage.message = "Installation completed successfully";

  } catch (error) {
    console.error("Installation error:", error);
    finalMessage.message = error.code === 'ENOENT' 
      ? "SQL file not found" 
      : `Installation failed: ${error.message}`;
  }

  return finalMessage;
}

module.exports = { install };