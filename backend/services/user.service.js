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
      email, 
      join_date, 
      status, 
      address, 
      emergency_contact, 
      salary, 
      account_number, 
      company_role_id 
    } = userData;

    const saltRounds = 10;

    // Hash password based on email (not secure, but I’ll leave as per your code)
    const password_hashed = await bcrypt.hash(email, saltRounds);

    // ✅ Fix: Added missing comma before company_role_id
    const userResult = await db.query(
      `INSERT INTO Users 
        (first_name, last_name, email, phone_number, address, status, join_date, salary, emergency_contact, account_number, company_role_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        first_name,
        last_name,
        email,
        phone,
        address,
        status,
        join_date,
        salary,
        emergency_contact,
        account_number,
        company_role_id
      ]
    );

    const userId = userResult.insertId;

    // Insert into Emails table
    await db.query(
      "INSERT INTO Emails (user_id, email) VALUES (?, ?)",
      [userId, email]
    );

    // Insert into User_Passwords table
    await db.query(
      "INSERT INTO User_Passwords (user_id, password_hashed) VALUES (?, ?)",
      [userId, password_hashed]
    );

    return { user_id: userId };
  } catch (err) {
    console.error("Error creating user:", err.message);
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
      u.status,
      u.join_date,
      u.added_date,
      e.email,
      cr.company_role_name
    FROM Users u
    LEFT JOIN Emails e ON u.user_id = e.user_id
    JOIN Company_Roles cr ON u.company_role_id = cr.company_role_id
    ORDER BY u.user_id DESC
  `;
  const rows = await db.query(query);
  return rows;
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
  const { first_name, last_name, phone, email, company_role_id } = userData;
  console.log(`Updating user with ID: ${userId}`, userData);

  // Update Users table
  await db.query(
    'UPDATE Users SET first_name = ?, last_name = ?, phone_number = ?,active_status= ?,company_role_id = ? WHERE user_id = ?',
    [first_name, last_name, phone, 1,company_role_id, userId]
  );

  // Update Emails table
  await db.query('UPDATE Emails SET email = ? WHERE user_id = ?', [email, userId]);

  return { message: 'User updated successfully' };
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