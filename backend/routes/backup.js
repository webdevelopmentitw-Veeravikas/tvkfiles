const express = require("express");
const router = express.Router();
const archiver = require("archiver");
const path = require("path");
const fs = require("fs");
const { getDB, getPool, DB_CONFIG } = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");
const { logAudit } = require("../middleware/audit");

const UPLOAD_DIR = path.join(__dirname, "../uploads");
const TABLES = ["users", "incidents", "files", "audit_log", "sessions"];

function escapeSql(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "1" : "0";
  return `'${String(value).replace(/\\/g, "\\\\").replace(/'/g, "''")}'`;
}

async function generateSqlDump() {
  const pool = getPool();
  const lines = [
    `-- TVKFiles MySQL dump`,
    `-- Database: ${DB_CONFIG.database}`,
    `-- Generated: ${new Date().toISOString()}`,
    "",
    `CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    `USE \`${DB_CONFIG.database}\`;`,
    "",
  ];

  for (const table of TABLES) {
    const [createRows] = await pool.query(`SHOW CREATE TABLE \`${table}\``);
    if (!createRows.length) continue;
    lines.push(`DROP TABLE IF EXISTS \`${table}\`;`);
    lines.push(`${createRows[0]["Create Table"]};`);
    lines.push("");

    const [rows] = await pool.query(`SELECT * FROM \`${table}\``);
    if (!rows.length) continue;

    const columns = Object.keys(rows[0]);
    for (const row of rows) {
      const values = columns.map((col) => escapeSql(row[col]));
      lines.push(
        `INSERT INTO \`${table}\` (\`${columns.join("`, `")}\`) VALUES (${values.join(", ")});`
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}

router.get("/db", requireAuth, requireRole("superadmin"), async (req, res) => {
  try {
    const dump = await generateSqlDump();
    await logAudit(req, "DOWNLOAD_DB", "system", "database", "MySQL SQL dump downloaded");
    res.setHeader("Content-Disposition", `attachment; filename="tvkfiles_${Date.now()}.sql"`);
    res.setHeader("Content-Type", "application/sql; charset=utf-8");
    res.send(dump);
  } catch (err) {
    console.error("DB backup error:", err);
    res.status(500).json({ error: "Backup failed" });
  }
});

router.get("/full-zip", requireAuth, requireRole("superadmin"), async (req, res) => {
  try {
    await logAudit(req, "DOWNLOAD_FULL_ZIP", "system", "backup", "Full ZIP backup downloaded");

    res.setHeader("Content-Disposition", `attachment; filename="tvkfiles_backup_${Date.now()}.zip"`);
    res.setHeader("Content-Type", "application/zip");

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.on("error", (err) => { throw err; });
    archive.pipe(res);

    const dump = await generateSqlDump();
    archive.append(dump, { name: `db/${DB_CONFIG.database}.sql` });

    if (fs.existsSync(UPLOAD_DIR)) {
      archive.directory(UPLOAD_DIR, "uploads");
    }

    const db = getDB();
    const incRows = await db.exec("SELECT * FROM incidents ORDER BY date DESC");
    const incCols = incRows[0]?.columns || [];
    const incidents = (incRows[0]?.values || []).map((r) => {
      const o = {}; incCols.forEach((c, i) => (o[c] = r[i]));
      if (o.tags) o.tags = o.tags.split(",").filter(Boolean);
      return o;
    });

    const userRows = await db.exec("SELECT id,username,role,is_active,created_at,last_login FROM users");
    const userCols = userRows[0]?.columns || [];
    const users = (userRows[0]?.values || []).map((r) => {
      const o = {}; userCols.forEach((c, i) => (o[c] = r[i])); return o;
    });

    const auditRows = await db.exec("SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 1000");
    const auditCols = auditRows[0]?.columns || [];
    const audit = (auditRows[0]?.values || []).map((r) => {
      const o = {}; auditCols.forEach((c, i) => (o[c] = r[i])); return o;
    });

    const exportData = {
      exported_at: new Date().toISOString(),
      version: "1.0.0",
      database: DB_CONFIG.database,
      incidents,
      users,
      audit_log: audit,
    };

    archive.append(JSON.stringify(exportData, null, 2), { name: "export/tvkfiles_export.json" });

    const readme = `TVKFiles Backup
==============
Exported: ${new Date().toISOString()}

Contents:
- db/${DB_CONFIG.database}.sql  — MySQL database dump (all data)
- uploads/                      — Uploaded evidence files
- export/tvkfiles_export.json   — Full JSON data export

To restore in XAMPP phpMyAdmin:
  1. Open http://localhost/phpmyadmin
  2. Import db/${DB_CONFIG.database}.sql
  3. Restart the backend server
`;
    archive.append(readme, { name: "README.txt" });
    archive.finalize();
  } catch (err) {
    console.error("Full ZIP backup error:", err);
    if (!res.headersSent) res.status(500).json({ error: "Backup failed" });
  }
});

router.get("/export-json", requireAuth, requireRole("admin", "superadmin"), async (req, res) => {
  try {
    const db = getDB();
    const { table = "incidents" } = req.query;

    const allowed = ["incidents", "files", "audit_log"];
    if (!allowed.includes(table)) return res.status(400).json({ error: "Invalid table" });

    const rows = await db.exec(`SELECT * FROM \`${table}\` ORDER BY created_at DESC`);
    const cols = rows[0]?.columns || [];
    const data = (rows[0]?.values || []).map((r) => {
      const o = {}; cols.forEach((c, i) => (o[c] = r[i])); return o;
    });

    await logAudit(req, "EXPORT_JSON", "system", table, `${data.length} rows exported`);
    res.setHeader("Content-Disposition", `attachment; filename="${table}_export_${Date.now()}.json"`);
    res.setHeader("Content-Type", "application/json");
    res.json({ table, total: data.length, exported_at: new Date().toISOString(), data });
  } catch (err) {
    console.error("JSON export error:", err);
    res.status(500).json({ error: "Export failed" });
  }
});

module.exports = router;
