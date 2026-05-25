const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const { getDB } = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");
const { logAudit } = require("../middleware/audit");

router.get("/dashboard", requireAuth, requireRole("admin", "superadmin"), async (req, res) => {
  try {
    const db = getDB();

    const totalIncidents = (await db.exec("SELECT COUNT(*) FROM incidents"))[0]?.values[0][0] || 0;
    const publishedIncidents = (await db.exec("SELECT COUNT(*) FROM incidents WHERE is_published=1"))[0]?.values[0][0] || 0;
    const pendingIncidents = (await db.exec("SELECT COUNT(*) FROM incidents WHERE is_published=0"))[0]?.values[0][0] || 0;
    const totalUsers = (await db.exec("SELECT COUNT(*) FROM users"))[0]?.values[0][0] || 0;
    const totalFiles = (await db.exec("SELECT COUNT(*) FROM files"))[0]?.values[0][0] || 0;
    const totalAuditLogs = (await db.exec("SELECT COUNT(*) FROM audit_log"))[0]?.values[0][0] || 0;

    const catBreakdown = {};
    for (const c of ["corruption", "crime", "broken-promise", "admin-failure", "honour-killing", "loss-investments", "insta-cards"]) {
      catBreakdown[c] = (await db.exec("SELECT COUNT(*) FROM incidents WHERE category=?", [c]))[0]?.values[0][0] || 0;
    }

    const sevBreakdown = {};
    for (const s of ["critical", "high", "medium", "low"]) {
      sevBreakdown[s] = (await db.exec("SELECT COUNT(*) FROM incidents WHERE severity=?", [s]))[0]?.values[0][0] || 0;
    }

    const recentRows = await db.exec(
      "SELECT id,title,category,severity,is_published,created_at FROM incidents ORDER BY created_at DESC LIMIT 5"
    );
    const recentCols = recentRows[0]?.columns || [];
    const recent = (recentRows[0]?.values || []).map((r) => {
      const o = {}; recentCols.forEach((c, i) => (o[c] = r[i])); return o;
    });

    const recentLogs = await db.exec(
      "SELECT username,action,target_type,target_id,ip,created_at FROM audit_log ORDER BY created_at DESC LIMIT 10"
    );
    const logCols = recentLogs[0]?.columns || [];
    const logs = (recentLogs[0]?.values || []).map((r) => {
      const o = {}; logCols.forEach((c, i) => (o[c] = r[i])); return o;
    });

    res.json({
      stats: { totalIncidents, publishedIncidents, pendingIncidents, totalUsers, totalFiles, totalAuditLogs },
      categoryBreakdown: catBreakdown,
      severityBreakdown: sevBreakdown,
      recentIncidents: recent,
      recentActivity: logs,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/users", requireAuth, requireRole("admin", "superadmin"), async (req, res) => {
  try {
    const db = getDB();
    const rows = await db.exec(
      "SELECT id,username,role,is_active,created_at,last_login,login_attempts,locked_until FROM users ORDER BY created_at DESC"
    );
    const cols = rows[0]?.columns || [];
    const users = (rows[0]?.values || []).map((r) => {
      const o = {}; cols.forEach((c, i) => (o[c] = r[i]));
      o.is_active = !!o.is_active;
      return o;
    });
    res.json({ users });
  } catch (err) {
    console.error("Users list error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/users", requireAuth, requireRole("superadmin"), async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password || !role) {
      return res.status(400).json({ error: "username, password and role required" });
    }
    const validRoles = ["viewer", "moderator", "admin", "superadmin"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    if (password.length < 10) {
      return res.status(400).json({ error: "Password must be at least 10 characters" });
    }

    const db = getDB();
    const exists = await db.exec("SELECT id FROM users WHERE username=? LIMIT 1", [username.toLowerCase()]);
    if (exists[0]?.values?.length) {
      return res.status(409).json({ error: "Username already exists" });
    }

    const id = uuidv4();
    const hash = await bcrypt.hash(password, 12);
    await db.run(
      "INSERT INTO users (id,username,password_hash,role,created_at,is_active) VALUES (?,?,?,?,?,1)",
      [id, username.toLowerCase(), hash, role, new Date().toISOString()]
    );
    await logAudit(req, "CREATE_USER", "user", id, `Created ${role}: ${username}`);
    res.status(201).json({ id, message: "User created" });
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/users/:id", requireAuth, requireRole("superadmin"), async (req, res) => {
  try {
    const { role, is_active, password } = req.body;
    const db = getDB();

    if (req.params.id === req.user.id && is_active === false) {
      return res.status(400).json({ error: "Cannot deactivate your own account" });
    }

    if (role) {
      const validRoles = ["viewer", "moderator", "admin", "superadmin"];
      if (!validRoles.includes(role)) return res.status(400).json({ error: "Invalid role" });
      await db.run("UPDATE users SET role=? WHERE id=?", [role, req.params.id]);
    }
    if (is_active !== undefined) {
      await db.run("UPDATE users SET is_active=? WHERE id=?", [is_active ? 1 : 0, req.params.id]);
    }
    if (password) {
      if (password.length < 10) return res.status(400).json({ error: "Password too short" });
      const hash = await bcrypt.hash(password, 12);
      await db.run("UPDATE users SET password_hash=? WHERE id=?", [hash, req.params.id]);
      await db.run("UPDATE sessions SET is_revoked=1 WHERE user_id=?", [req.params.id]);
    }
    await logAudit(req, "UPDATE_USER", "user", req.params.id, JSON.stringify({ role, is_active }));
    res.json({ message: "User updated" });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/users/:id", requireAuth, requireRole("superadmin"), async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }
    const db = getDB();
    await db.run("DELETE FROM users WHERE id=?", [req.params.id]);
    await db.run("UPDATE sessions SET is_revoked=1 WHERE user_id=?", [req.params.id]);
    await logAudit(req, "DELETE_USER", "user", req.params.id, "");
    res.json({ message: "User deleted" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/users/:id/unlock", requireAuth, requireRole("admin", "superadmin"), async (req, res) => {
  try {
    const db = getDB();
    await db.run("UPDATE users SET login_attempts=0, locked_until=NULL WHERE id=?", [req.params.id]);
    await logAudit(req, "UNLOCK_USER", "user", req.params.id, "");
    res.json({ message: "Account unlocked" });
  } catch (err) {
    console.error("Unlock user error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/audit", requireAuth, requireRole("admin", "superadmin"), async (req, res) => {
  try {
    const db = getDB();
    const { page = 1, limit = 50, action, username } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = [];
    const params = [];
    if (action) { where.push("action=?"); params.push(action); }
    if (username) { where.push("username LIKE ?"); params.push(`%${username}%`); }
    const whereStr = where.length ? "WHERE " + where.join(" AND ") : "";

    const total = (await db.exec(`SELECT COUNT(*) FROM audit_log ${whereStr}`, params))[0]?.values[0][0] || 0;
    const rows = await db.exec(
      `SELECT * FROM audit_log ${whereStr} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    const cols = rows[0]?.columns || [];
    const logs = (rows[0]?.values || []).map((r) => {
      const o = {}; cols.forEach((c, i) => (o[c] = r[i])); return o;
    });
    res.json({ logs, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    console.error("Audit log error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/sessions", requireAuth, requireRole("superadmin"), async (req, res) => {
  try {
    const db = getDB();
    const rows = await db.exec(
      `SELECT s.id, s.user_id, u.username, s.ip, s.user_agent, s.created_at, s.expires_at, s.is_revoked
       FROM sessions s LEFT JOIN users u ON s.user_id=u.id
       ORDER BY s.created_at DESC LIMIT 100`
    );
    const cols = rows[0]?.columns || [];
    const sessions = (rows[0]?.values || []).map((r) => {
      const o = {}; cols.forEach((c, i) => (o[c] = r[i])); return o;
    });
    res.json({ sessions });
  } catch (err) {
    console.error("Sessions error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/sessions/:userId", requireAuth, requireRole("superadmin"), async (req, res) => {
  try {
    const db = getDB();
    await db.run("UPDATE sessions SET is_revoked=1 WHERE user_id=?", [req.params.userId]);
    await logAudit(req, "REVOKE_SESSIONS", "user", req.params.userId, "All sessions revoked");
    res.json({ message: "All sessions revoked" });
  } catch (err) {
    console.error("Revoke sessions error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
