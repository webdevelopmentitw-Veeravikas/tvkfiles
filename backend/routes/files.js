const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { getDB } = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");
const { upload, UPLOAD_DIR } = require("../middleware/upload");
const { logAudit } = require("../middleware/audit");

router.get("/public/:id", async (req, res) => {
  try {
    const db = getDB();
    const rows = await db.exec(
      `SELECT f.*, i.is_published FROM files f
       LEFT JOIN incidents i ON f.incident_id = i.id
       WHERE f.id=? LIMIT 1`,
      [req.params.id]
    );
    if (!rows[0]?.values?.length) return res.status(404).json({ error: "File not found" });

    const cols = rows[0].columns;
    const row = rows[0].values[0];
    const obj = {};
    cols.forEach((c, i) => (obj[c] = row[i]));

    if (!obj.incident_id || !obj.is_published) {
      return res.status(404).json({ error: "File not found" });
    }

    const filePath = path.join(UPLOAD_DIR, obj.stored_name);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File missing on disk" });

    res.setHeader("Content-Type", obj.mime_type);
    res.setHeader("Content-Disposition", `inline; filename="${obj.original_name}"`);
    res.sendFile(filePath);
  } catch (err) {
    console.error("Public serve file error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/upload", requireAuth, requireRole("moderator", "admin", "superadmin"), upload.array("files", 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }
    const db = getDB();
    const saved = [];

    for (const file of req.files) {
      const id = uuidv4();
      const relPath = path.relative(UPLOAD_DIR, file.path);
      await db.run(
        `INSERT INTO files (id,incident_id,original_name,stored_name,mime_type,size,uploaded_by,created_at)
         VALUES (?,?,?,?,?,?,?,?)`,
        [id, req.body.incident_id || null, file.originalname, relPath, file.mimetype, file.size, req.user.id, new Date().toISOString()]
      );
      saved.push({
        id,
        original_name: file.originalname,
        stored_name: relPath,
        mime_type: file.mimetype,
        size: file.size,
        url: `/api/files/${id}`,
      });
    }
    await logAudit(req, "UPLOAD_FILES", "file", saved.map((f) => f.id).join(","), `${saved.length} file(s) uploaded`);
    res.status(201).json({ files: saved });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const db = getDB();
    const rows = await db.exec("SELECT * FROM files WHERE id=? LIMIT 1", [req.params.id]);
    if (!rows[0]?.values?.length) return res.status(404).json({ error: "File not found" });

    const cols = rows[0].columns;
    const row = rows[0].values[0];
    const obj = {};
    cols.forEach((c, i) => (obj[c] = row[i]));

    const filePath = path.join(UPLOAD_DIR, obj.stored_name);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File missing on disk" });

    res.setHeader("Content-Type", obj.mime_type);
    res.setHeader("Content-Disposition", `inline; filename="${obj.original_name}"`);
    res.sendFile(filePath);
  } catch (err) {
    console.error("Serve file error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/", requireAuth, requireRole("admin", "superadmin"), async (req, res) => {
  try {
    const db = getDB();
    const { incident_id, page = 1, limit = 30 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = incident_id ? ["incident_id=?"] : [];
    const params = incident_id ? [incident_id] : [];
    const whereStr = where.length ? "WHERE " + where.join(" AND ") : "";

    const countRes = await db.exec(`SELECT COUNT(*) FROM files ${whereStr}`, params);
    const total = countRes[0]?.values[0][0] || 0;

    const rows = await db.exec(
      `SELECT f.*, u.username as uploader_name FROM files f
       LEFT JOIN users u ON f.uploaded_by = u.id
       ${whereStr} ORDER BY f.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const cols = rows[0]?.columns || [];
    const files = (rows[0]?.values || []).map((r) => {
      const obj = {};
      cols.forEach((c, i) => (obj[c] = r[i]));
      obj.url = `/api/files/${obj.id}`;
      return obj;
    });

    res.json({ files, total, page: parseInt(page) });
  } catch (err) {
    console.error("List files error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", requireAuth, requireRole("admin", "superadmin"), async (req, res) => {
  try {
    const db = getDB();
    const rows = await db.exec("SELECT stored_name FROM files WHERE id=? LIMIT 1", [req.params.id]);
    if (!rows[0]?.values?.length) return res.status(404).json({ error: "Not found" });

    const storedName = rows[0].values[0][0];
    const filePath = path.join(UPLOAD_DIR, storedName);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await db.run("DELETE FROM files WHERE id=?", [req.params.id]);
    await logAudit(req, "DELETE_FILE", "file", req.params.id, storedName);
    res.json({ message: "File deleted" });
  } catch (err) {
    console.error("Delete file error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:id/attach", requireAuth, requireRole("admin", "superadmin"), async (req, res) => {
  try {
    const { incident_id } = req.body;
    const db = getDB();
    await db.run("UPDATE files SET incident_id=? WHERE id=?", [incident_id, req.params.id]);
    res.json({ message: "Attached" });
  } catch (err) {
    console.error("Attach file error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
