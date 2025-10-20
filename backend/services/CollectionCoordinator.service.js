const db = require("../config/db.config");

// Get collection assignments for a coordinator
// ✅ Get all assigned collection sessions (assigned to a collection coordinator)
async function getAssignedCollectionSessionsByUserId(user) {
  try {
    // Extract userId safely
    const userId = typeof user === 'object' && user.userId
      ? user.userId
      : user;

    console.log("🟢 Querying for user_id:", userId);

    const query = `
      SELECT 
        cs.id AS session_id,
        cs.session_number,
        cs.site_location,
        cs.estimated_start_date,
        cs.estimated_end_date,
        cs.status,
        cs.estimatedAmount,

        -- ✅ Supplier info
        s.id AS supplier_id,
        s.company_name AS supplier_name,
        s.contact_person AS supplier_contact_person,
        s.phone AS supplier_phone,
        s.location AS supplier_location,

        -- ✅ Marketer info
        m.user_id AS marketer_id,
        CONCAT(m.first_name, ' ', m.last_name) AS marketer_name,
        m.phone_number AS marketer_phone,

        -- ✅ Coordinator info
        cc.user_id AS coordinator_id,
        CONCAT(cc.first_name, ' ', cc.last_name) AS coordinator_name

      FROM collection_sessions cs
      INNER JOIN suppliers s ON cs.supplier_id = s.id
      INNER JOIN regions r ON s.region_id = r.id
      INNER JOIN sectors sec ON s.sector_id = sec.id
      LEFT JOIN Users m ON cs.marketer_id = m.user_id
      LEFT JOIN Users cc ON cs.coordinator_id = cc.user_id

      WHERE cs.coordinator_id = ? OR cs.marketer_id = ?
      ORDER BY cs.created_at DESC
    `;

    // ✅ Pass as array with two values for the two placeholders
    const rows = await db.query(query, [userId, userId]);

    return rows;
  } catch (error) {
    console.error("❌ Error fetching collection sessions by user_id:", error.message);
    throw error;
  }
}

async function saveCollectionReports(sessionId, supplierId, marketerId, reports) {
  const results = [];

  for (let report of reports) {
    const { paper_type_id, kg, bags, photo } = report;
    
    let imagePath = null;
    if (photo) {
      // Save base64 image to file
      const base64Data = photo.replace(/^data:image\/\w+;base64,/, "");
      const filename = `uploads/collection/${Date.now()}-${Math.floor(Math.random() * 1000)}.jpg`;
      require("fs").writeFileSync(filename, base64Data, "base64");
      imagePath = filename;
    }

    const result = await db.query(
      `INSERT INTO collection_session_comments 
        (collection_session_id, supplier_id, marketer_id, paper_type_id, collected_kg, collection_bags, image_path) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [sessionId, supplierId, marketerId || null, paper_type_id, kg, bags, imagePath]
    );

    results.push(result);
  }

  return results;
}


// Update the status of a collection assignment
async function updateCollectionAssignmentStatus(id, status) {
  const [result] = await db.query(
    `UPDATE CollectionAssignments
     SET status = ?
     WHERE id = ?`,
    [status, id]
  );
    if (result.affectedRows === 0) {
    throw new Error(`Collection assignment with ID ${id} not found`);
    }
    const [updatedRows] = await db.query(
    `SELECT * FROM CollectionAssignments WHERE id = ?`,
    [id]
  );
  return updatedRows[0];
}
// Add comments and photo to a collection assignment
async function addCommentsWithPhoto(id, comments, photoPath) {
  const [result] = await db.query(
    `UPDATE CollectionAssignments
     SET comments = ?, photo_path = ?
     WHERE id = ?`,
    [comments, photoPath, id]
  );
    if (result.affectedRows === 0) {
    throw new Error(`Collection assignment with ID ${id} not found`);
    }
    const [updatedRows] = await db.query(
    `SELECT * FROM CollectionAssignments WHERE id = ?`,
    [id]
  );
  return updatedRows[0];
}


async function getAllCollectionReports() {
  // Fetch all session + comment info
  const rows = await db.query(`
    SELECT
      cs.id AS session_id,
      cs.session_number,
      cs.site_location,
      cs.estimated_start_date,
      cs.estimated_end_date,
      cs.status AS session_status,
      cs.estimatedAmount,

      csc.id AS comment_id,
      csc.supplier_id,
      csc.marketer_id,
      csc.paper_type_id,
      pt.description AS paper_type_description,
      csc.collected_kg,
      csc.collection_bags,
      csc.image_path,
      csc.created_at AS comment_created_at

    FROM collection_sessions cs
    LEFT JOIN collection_session_comments csc
      ON csc.collection_session_id = cs.id
    LEFT JOIN PaperType pt
      ON csc.paper_type_id = pt.id
    ORDER BY cs.estimated_start_date DESC, csc.created_at DESC
  `);

  // Group comments by collection session
  const sessionsMap = {};

  rows.forEach(row => {
    if (!sessionsMap[row.session_id]) {
      sessionsMap[row.session_id] = {
        session_id: row.session_id,
        session_number: row.session_number,
        site_location: row.site_location,
        estimated_start_date: row.estimated_start_date,
        estimated_end_date: row.estimated_end_date,
        session_status: row.session_status,
        estimatedAmount: row.estimatedAmount,
        comments: []
      };
    }

    if (row.comment_id) {
      sessionsMap[row.session_id].comments.push({
        comment_id: row.comment_id,
        supplier_id: row.supplier_id,
        marketer_id: row.marketer_id,
        paper_type_id: row.paper_type_id,
        paper_type_description: row.paper_type_description,
        collected_kg: row.collected_kg,
        collection_bags: row.collection_bags,
        image_path: row.image_path,
        comment_created_at: row.comment_created_at
      });
    }
  });

  return Object.values(sessionsMap);
}

module.exports = {
  getAllCollectionReports
};





module.exports = {
  getAssignedCollectionSessionsByUserId,
  updateCollectionAssignmentStatus,
  addCommentsWithPhoto,saveCollectionReports,
    getAllCollectionReports
};
