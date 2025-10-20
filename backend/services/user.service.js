const db = require("../config/db.config");
const bcrypt = require('bcrypt');

async function getUserByEmail(email) {
  const query = `
    SELECT 
      u.user_id,
      u.first_name,
      u.last_name,
      u.phone_number,
      e.email,
      up.password_hashed,
      cr.company_role_name
    FROM Users u
    JOIN Emails e ON u.user_id = e.user_id
    JOIN User_Passwords up ON u.user_id = up.user_id
    JOIN Company_Roles cr ON u.company_role_id = cr.company_role_id
    WHERE e.email = ?
  `;
  const rows = await db.query(query, [email]);
  console.log(rows)
  return rows.length > 0 ? rows[0] : null;
}
async function createUser(userData) {
  try {
    const { 
      first_name, 
      last_name, 
      phone, 
      phone_number, 
      email, 
      join_date, 
      status, 
      address, 
      emergency_contact, 
      gross_salary, 
      account_number, 
      company_role_id, 
      company_role_name
    } = userData;

    const saltRounds = 10;
    const password_hashed = await bcrypt.hash(email, saltRounds);

    // ✅ Safely handle missing data
    const safeFirstName = first_name ?? null;
    const safeLastName = last_name ?? null;
    const safePhone = phone ?? phone_number ?? null;
    const safeEmail = email ?? null;
    const safeJoinDate = join_date ?? new Date();
    const safeStatus = status?.toLowerCase() === 'active' ? 1 : 0;
    const safeAddress = address ?? null;
    const safeEmergency = emergency_contact ?? null;
    const safeSalary = gross_salary ?? null;
    const safeAccount = account_number ?? null;

    // ✅ Resolve role ID if only name is provided
    let roleId = company_role_id ?? null;
    if (!roleId && company_role_name) {
      const roleRes = await db.query(
        'SELECT company_role_id FROM Company_Roles WHERE company_role_name = ? LIMIT 1',
        [company_role_name]
      );
      if (roleRes.length > 0) {
        roleId = roleRes[0].company_role_id;
      }
    }

    // ✅ Insert into Users safely
    const userResult = await db.query(
      `INSERT INTO Users 
        (first_name, last_name, email, phone_number, address, status, join_date, salary, emergency_contact, account_number, company_role_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        safeFirstName,
        safeLastName,
        safeEmail,
        safePhone,
        safeAddress,
        safeStatus,
        safeJoinDate,
        safeSalary,
        safeEmergency,
        safeAccount,
        roleId
      ]
    );

    const userId = userResult.insertId;

    // ✅ Ensure Emails table has entry
    await db.query(
      `INSERT INTO Emails (user_id, email) VALUES (?, ?)`,
      [userId, safeEmail]
    );

    // ✅ Insert password
    await db.query(
      `INSERT INTO User_Passwords (user_id, password_hashed) VALUES (?, ?)`,
      [userId, password_hashed]
    );

    console.log("✅ User created successfully:", userId);
    return { user_id: userId };

  } catch (err) {
    console.error("❌ Error creating user:", err.message);
    throw err;
  }
}

async function getUsers() {
  const query = `
    SELECT 
      u.user_id,
      u.first_name,
      u.last_name,
      u.phone_number,
      u.email,
      u.address,
      u.status,
      u.join_date,
      u.added_date,
      u.salary,
      u.emergency_contact,
      u.account_number,
      e.email AS email_address,
      cr.company_role_name
    FROM Users u
    LEFT JOIN Emails e ON u.user_id = e.user_id
    JOIN Company_Roles cr ON u.company_role_id = cr.company_role_id
    ORDER BY u.user_id DESC
  `;

  try {
    const rows = await db.query(query);
    return rows;
  } catch (error) {
    console.error("❌ Error fetching users:", error.message);
    throw error;
  }
}



async function getCompanyRoles() {
  const query = 'SELECT company_role_id, company_role_name FROM Company_Roles ORDER BY company_role_id';
  const rows = await db.query(query);
  return rows;  
}
async function deleteUser(userId) {
  // Delete from User_Passwords table
  await db.query('DELETE FROM User_Passwords WHERE user_id = ?', [userId]);
  // Delete from Emails table
  await db.query('DELETE FROM Emails WHERE user_id = ?', [userId]);
  // Delete from Users table
  await db.query('DELETE FROM Users WHERE user_id = ?', [userId]);
  return { message: 'User deleted successfully' };
}

async function findUserByEmail(email) {
  const rows = await db.query('SELECT * FROM emails WHERE email = ?', [email]);
  return rows[0]; // returns the user if found, or undefined
}
async function UpdateUser(userId, userData) {
  try {
    console.log(`Updating user with ID: ${userId}`, userData);

    // ✅ Normalize and safely extract frontend fields
    const {
      first_name,
      last_name,
      phone,
      phone_number,
      email,
      address,
      status,
      join_date,
      salary,
      emergency_contact,
      account_number,
      company_role_id,
      company_role_name
    } = userData;

    // ✅ Fallbacks for undefined values
    const safeFirstName = first_name ?? null;
    const safeLastName = last_name ?? null;
    const safePhone = phone ?? phone_number ?? null;
    const safeEmail = email ?? null;
    const safeAddress = address ?? null;
    const safeStatus = status?.toLowerCase() === "active" ? "active" : "inactive";
    const safeJoinDate = join_date ?? null;
    const safeSalary = salary ?? null;
    const safeEmergencyContact = emergency_contact ?? null;
    const safeAccountNumber = account_number ?? null;

    // ✅ Get role_id from role name if not provided
    let roleId = company_role_id ?? null;
    if (!roleId && company_role_name) {
      const roleRes = await db.query(
        `SELECT company_role_id FROM Company_Roles WHERE company_role_name = ? LIMIT 1`,
        [company_role_name]
      );
      if (roleRes.length > 0) {
        roleId = roleRes[0].company_role_id;
      }
    }

    // ✅ Update Users table (include all relevant fields)
    await db.query(
      `UPDATE Users 
       SET 
         first_name = ?, 
         last_name = ?, 
         phone_number = ?, 
         email = ?, 
         address = ?, 
         status = ?, 
         join_date = ?, 
         salary = ?, 
         emergency_contact = ?, 
         account_number = ?, 
         company_role_id = ? 
       WHERE user_id = ?`,
      [
        safeFirstName,
        safeLastName,
        safePhone,
        safeEmail,
        safeAddress,
        safeStatus,
        safeJoinDate,
        safeSalary,
        safeEmergencyContact,
        safeAccountNumber,
        roleId,
        userId
      ]
    );

    // ✅ Update Emails table separately (optional)
    if (safeEmail) {
      await db.query(`UPDATE Emails SET email = ? WHERE user_id = ?`, [safeEmail, userId]);
    }

    return { message: "✅ User updated successfully" };

  } catch (error) {
    console.error("❌ Error updating user:", error.message);
    throw error;
  }
}



async function getMarketors() {
  const query = `
    SELECT CONCAT(first_name, ' ', last_name) AS full_name
    FROM Users
    WHERE company_role_id = 4
  `;
  
  try {
    const rows = await db.query(query);
    return rows;
  } catch (error) {
    console.error('Error fetching marketers:', error);
    res.status(500).json({ error: 'Failed to fetch marketers' });
  }
}

async function createMammas(data) {
const sql = `
    INSERT INTO mamas (status, joinDate, fullName, woreda, phone, accountNumber)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const result = await db.query(sql, [
    data.status,
    data.joinDate,
    data.fullName,
    data.woreda,
    data.phone,
    data.accountNumber
  ]);
   return {
    id: result.insertId,
    ...data
  };
}

async function getAllMammas() {
  const rows = await db.query("SELECT * FROM mamas ORDER BY id DESC");
  return rows;
}

async function updateMamas(id, data) {
  console.log(data)
  const sql = `
    UPDATE mamas
    SET status = ?, joinDate = ?, fullName = ?, woreda = ?, phone = ?, accountNumber = ?
    WHERE id = ?
  `;
  await db.query(sql, [
    data.status,
    data.joinDate,
    data.fullName,
    data.woreda,
    data.phone,
    data.accountNumber,
    id
  ]);
  return { id, ...data };
}

// Delete member
async function deleteMember(id) {
  await db.query("DELETE FROM mamas WHERE id = ?", [id]);
  return { message: "Member deleted successfully" };
}

module.exports = {getMarketors,deleteMember,createMammas, updateMamas,getAllMammas,getUserByEmail, createUser, getUsers, getCompanyRoles , findUserByEmail , deleteUser,UpdateUser };