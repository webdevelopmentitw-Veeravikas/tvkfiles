const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const { getDB } = require("../db");
const { generateTokens, requireAuth } = require("../middleware/auth");
const { logAudit } = require("../middleware/audit");

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    const db = getDB();
    const rows = await db.exec(
      "SELECT id, username, password_hash, role, is_active, login_attempts, locked_until FROM users WHERE username=? LIMIT 1",
      [username.toLowerCase().trim()]
    );

    if (!rows[0]?.values?.length) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const [id, uname, hash, role, is_active, login_attempts, locked_until] = rows[0].values[0];

    if (locked_until && new Date(locked_until) > new Date()) {
      const mins = Math.ceil((new Date(locked_until) - new Date()) / 60000);
      return res.status(403).json({ error: `Account locked. Try again in ${mins} minute(s).` });
    }

    if (!is_active) {
      return res.status(403).json({ error: "Account suspended. Contact administrator." });
    }

    const valid = await bcrypt.compare(password, hash);

    if (!valid) {
      const attempts = (login_attempts || 0) + 1;
      let lockUntil = null;
      if (attempts >= 5) {
        lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      }
      await db.run("UPDATE users SET login_attempts=?, locked_until=? WHERE id=?", [attempts, lockUntil, id]);
      return res.status(401).json({ error: `Invalid credentials. ${5 - attempts} attempt(s) remaining.` });
    }

    await db.run("UPDATE users SET login_attempts=0, locked_until=NULL, last_login=? WHERE id=?", [new Date().toISOString(), id]);

    const { accessToken, refreshToken } = generateTokens(id, uname, role);

    const sessionId = uuidv4();
    await db.run(
      "INSERT INTO sessions (id,user_id,token_hash,ip,user_agent,created_at,expires_at) VALUES (?,?,?,?,?,?,?)",
      [
        sessionId,
        id,
        require("crypto").createHash("sha256").update(accessToken).digest("hex"),
        req.ip,
        req.headers["user-agent"] || "",
        new Date().toISOString(),
        new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      ]
    );

    await logAudit(
      { ...req, user: { id, username: uname, role } },
      "LOGIN",
      "user",
      id,
      `Login from ${req.ip}`
    );

    res.json({
      accessToken,
      refreshToken,
      user: { id, username: uname, role },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/logout", requireAuth, async (req, res) => {
  try {
    const db = getDB();
    await db.run("UPDATE sessions SET is_revoked=1 WHERE user_id=?", [req.user.id]);
    await logAudit(req, "LOGOUT", "user", req.user.id, "");
    res.json({ message: "Logged out" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const db = getDB();
    const rows = await db.exec(
      "SELECT id, username, role, created_at, last_login FROM users WHERE id=?",
      [req.user.id]
    );
    if (!rows[0]?.values?.length) return res.status(404).json({ error: "User not found" });
    const [id, username, role, created_at, last_login] = rows[0].values[0];
    res.json({ id, username, role, created_at, last_login });
  } catch (err) {
    console.error("Me error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/change-password", requireAuth, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ error: "Both passwords required" });
    }
    if (new_password.length < 10) {
      return res.status(400).json({ error: "New password must be at least 10 characters" });
    }

    const db = getDB();
    const rows = await db.exec("SELECT password_hash FROM users WHERE id=?", [req.user.id]);
    if (!rows[0]?.values?.length) return res.status(404).json({ error: "User not found" });

    const valid = await bcrypt.compare(current_password, rows[0].values[0][0]);
    if (!valid) return res.status(400).json({ error: "Current password incorrect" });

    const hash = await bcrypt.hash(new_password, 12);
    await db.run("UPDATE users SET password_hash=? WHERE id=?", [hash, req.user.id]);
    await db.run("UPDATE sessions SET is_revoked=1 WHERE user_id=?", [req.user.id]);

    await logAudit(req, "CHANGE_PASSWORD", "user", req.user.id, "");
    res.json({ message: "Password changed. Please log in again." });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
