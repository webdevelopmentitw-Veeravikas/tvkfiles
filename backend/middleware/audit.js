const { v4: uuidv4 } = require("uuid");
const { getDB } = require("../db");

async function logAudit(req, action, targetType, targetId, details) {
  try {
    const db = getDB();
    if (!db) return;
    await db.run(
      `INSERT INTO audit_log (id,user_id,username,action,target_type,target_id,details,ip,created_at)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        uuidv4(),
        req.user?.id || null,
        req.user?.username || "anonymous",
        action,
        targetType || null,
        targetId || null,
        details || null,
        req.ip || req.connection?.remoteAddress || "unknown",
        new Date().toISOString(),
      ]
    );
  } catch (e) {
    console.error("Audit log error:", e.message);
  }
}

module.exports = { logAudit };
