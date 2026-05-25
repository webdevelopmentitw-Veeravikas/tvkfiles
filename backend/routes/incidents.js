const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const { getDB } = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");
const { logAudit } = require("../middleware/audit");

function rowToIncident(cols, row) {
  const obj = {};
  cols.forEach((c, i) => (obj[c] = row[i]));
  if (obj.tags) obj.tags = obj.tags.split(",").filter(Boolean);
  obj.is_published = !!obj.is_published;
  return obj;
}

async function fetchFilesForIncident(db, incidentId, { publicUrls = false } = {}) {
  const rows = await db.exec(
    "SELECT id, original_name, mime_type, size, created_at FROM files WHERE incident_id=? ORDER BY created_at ASC",
    [incidentId]
  );
  const cols = rows[0]?.columns || [];
  return (rows[0]?.values || []).map((r) => {
    const obj = {};
    cols.forEach((c, i) => (obj[c] = r[i]));
    obj.url = publicUrls ? `/api/files/public/${obj.id}` : `/api/files/${obj.id}`;
    obj.is_image = (obj.mime_type || "").startsWith("image/");
    return obj;
  });
}

router.get("/", async (req, res) => {
  try {
    const db = getDB();
    const { category, district, search, severity, status, page = 1, limit = 20 } = req.query;

    const where = ["is_published=1"];
    const params = [];

    if (category && category !== "all") { where.push("category=?"); params.push(category); }
    if (district && district !== "All Districts" && district !== "all") { where.push("district=?"); params.push(district); }
    if (severity) { where.push("severity=?"); params.push(severity); }
    if (status) { where.push("status=?"); params.push(status); }
    if (search) {
      where.push("(title LIKE ? OR description LIKE ? OR tags LIKE ?)");
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    const whereStr = where.length ? "WHERE " + where.join(" AND ") : "";
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const countRes = await db.exec(`SELECT COUNT(*) FROM incidents ${whereStr}`, params);
    const total = countRes[0]?.values[0][0] || 0;

    const rows = await db.exec(
      `SELECT id,title,description,category,date,district,source,source_url,tags,severity,status,created_at,updated_at,
       (SELECT f.id FROM files f WHERE f.incident_id=incidents.id AND f.mime_type LIKE 'image/%' ORDER BY f.created_at ASC LIMIT 1) AS cover_image_id
       FROM incidents ${whereStr} ORDER BY date DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const cols = rows[0]?.columns || [];
    const incidents = (rows[0]?.values || []).map((r) => {
      const inc = rowToIncident(cols, r);
      if (inc.cover_image_id) {
        inc.cover_image_url = `/api/files/public/${inc.cover_image_id}`;
      }
      delete inc.cover_image_id;
      return inc;
    });

    res.json({ incidents, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    console.error("List incidents error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const db = getDB();
    const cats = ["corruption", "crime", "broken-promise", "admin-failure", "honour-killing", "loss-investments", "insta-cards"];
    const stats = {};
    for (const c of cats) {
      const r = await db.exec("SELECT COUNT(*) FROM incidents WHERE category=? AND is_published=1", [c]);
      stats[c] = r[0]?.values[0][0] || 0;
    }
    const total = await db.exec("SELECT COUNT(*) FROM incidents WHERE is_published=1");
    stats.total = total[0]?.values[0][0] || 0;
    const critical = await db.exec("SELECT COUNT(*) FROM incidents WHERE severity='critical' AND is_published=1");
    stats.critical = critical[0]?.values[0][0] || 0;
    res.json(stats);
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const db = getDB();
    const rows = await db.exec(
      "SELECT * FROM incidents WHERE id=? AND is_published=1 LIMIT 1",
      [req.params.id]
    );
    if (!rows[0]?.values?.length) return res.status(404).json({ error: "Not found" });
    const incident = rowToIncident(rows[0].columns, rows[0].values[0]);
    incident.files = await fetchFilesForIncident(db, incident.id, { publicUrls: true });
    res.json(incident);
  } catch (err) {
    console.error("Get incident error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/admin/all", requireAuth, requireRole("moderator", "admin", "superadmin"), async (req, res) => {
  try {
    const db = getDB();
    const { page = 1, limit = 20, published } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = published !== undefined ? [`is_published=${published === "true" ? 1 : 0}`] : [];
    const whereStr = where.length ? "WHERE " + where.join(" AND ") : "";

    const countRes = await db.exec(`SELECT COUNT(*) FROM incidents ${whereStr}`);
    const total = countRes[0]?.values[0][0] || 0;

    const rows = await db.exec(
      `SELECT * FROM incidents ${whereStr} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [parseInt(limit), offset]
    );
    const cols = rows[0]?.columns || [];
    const incidents = (rows[0]?.values || []).map((r) => rowToIncident(cols, r));
    res.json({ incidents, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    console.error("Admin list incidents error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", requireAuth, requireRole("admin", "superadmin"), async (req, res) => {
  try {
    const { title, description, category, date, district, source, source_url, tags, severity, status } = req.body;
    if (!title || !description || !category) {
      return res.status(400).json({ error: "title, description and category are required" });
    }
    const id = uuidv4();
    const now = new Date().toISOString();
    const db = getDB();
    await db.run(
      `INSERT INTO incidents (id,title,description,category,date,district,source,source_url,tags,severity,status,submitted_by,is_published,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1,?,?)`,
      [id, title, description, category, date || now.slice(0, 10), district || "Chennai", source || "", source_url || "", Array.isArray(tags) ? tags.join(",") : (tags || ""), severity || "medium", status || "unresolved", req.user.id, now, now]
    );
    await logAudit(req, "CREATE_INCIDENT", "incident", id, title);
    res.status(201).json({ id, message: "Incident created" });
  } catch (err) {
    console.error("Create incident error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id", requireAuth, requireRole("admin", "superadmin"), async (req, res) => {
  try {
    const { title, description, category, date, district, source, source_url, tags, severity, status } = req.body;
    const db = getDB();
    const exists = await db.exec("SELECT id FROM incidents WHERE id=? LIMIT 1", [req.params.id]);
    if (!exists[0]?.values?.length) return res.status(404).json({ error: "Not found" });

    await db.run(
      `UPDATE incidents SET title=?,description=?,category=?,date=?,district=?,source=?,source_url=?,tags=?,severity=?,status=?,updated_at=? WHERE id=?`,
      [title, description, category, date, district, source, source_url, Array.isArray(tags) ? tags.join(",") : (tags || ""), severity, status, new Date().toISOString(), req.params.id]
    );
    await logAudit(req, "UPDATE_INCIDENT", "incident", req.params.id, title);
    res.json({ message: "Updated" });
  } catch (err) {
    console.error("Update incident error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:id/publish", requireAuth, requireRole("moderator", "admin", "superadmin"), async (req, res) => {
  try {
    const { published } = req.body;
    const db = getDB();
    await db.run("UPDATE incidents SET is_published=?, updated_at=? WHERE id=?", [published ? 1 : 0, new Date().toISOString(), req.params.id]);
    await logAudit(req, published ? "PUBLISH_INCIDENT" : "UNPUBLISH_INCIDENT", "incident", req.params.id, "");
    res.json({ message: `Incident ${published ? "published" : "unpublished"}` });
  } catch (err) {
    console.error("Publish incident error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", requireAuth, requireRole("admin", "superadmin"), async (req, res) => {
  try {
    const db = getDB();
    await db.run("DELETE FROM files WHERE incident_id=?", [req.params.id]);
    await db.run("DELETE FROM incidents WHERE id=?", [req.params.id]);
    await logAudit(req, "DELETE_INCIDENT", "incident", req.params.id, "");
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("Delete incident error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
