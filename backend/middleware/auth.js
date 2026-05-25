const jwt = require("jsonwebtoken");
const { getDB } = require("../db");
const { logAudit } = require("../middleware/audit");

const JWT_SECRET = process.env.JWT_SECRET || "TVKFiles_SuperSecret_JWT_2025!@#$%^&*";
const JWT_EXPIRES = "8h";
const REFRESH_EXPIRES = "7d";

const ROLE_LEVELS = {
  viewer: 1,
  moderator: 2,
  admin: 3,
  superadmin: 4,
};

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const db = getDB();

    const rows = await db.exec(
      "SELECT id, username, role, is_active, locked_until FROM users WHERE id=?",
      [decoded.userId]
    );

    if (!rows[0]?.values?.length) {
      return res.status(401).json({ error: "User not found" });
    }

    const [id, username, role, is_active, locked_until] = rows[0].values[0];

    if (!is_active) {
      return res.status(403).json({ error: "Account suspended" });
    }

    if (locked_until && new Date(locked_until) > new Date()) {
      return res.status(403).json({ error: "Account temporarily locked" });
    }

    const sessionRows = await db.exec(
      "SELECT id FROM sessions WHERE user_id=? AND is_revoked=0 AND expires_at > ? LIMIT 1",
      [decoded.userId, new Date().toISOString()]
    );

    if (!sessionRows[0]?.values?.length) {
      return res.status(401).json({ error: "Session expired or revoked" });
    }

    req.user = { id, username, role };
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    return res.status(401).json({ error: "Invalid token" });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });

    const userLevel = ROLE_LEVELS[req.user.role] || 0;
    const minRequired = Math.min(...roles.map((r) => ROLE_LEVELS[r] || 99));

    if (userLevel < minRequired) {
      logAudit(req, "UNAUTHORIZED_ACCESS", "route", req.path, `Role ${req.user.role} tried to access ${req.path}`);
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

function generateTokens(userId, username, role) {
  const accessToken = jwt.sign({ userId, username, role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES,
    issuer: "tvkfiles",
    audience: "tvkfiles-client",
  });

  const refreshToken = jwt.sign({ userId, type: "refresh" }, JWT_SECRET, {
    expiresIn: REFRESH_EXPIRES,
  });

  return { accessToken, refreshToken };
}

module.exports = { requireAuth, requireRole, generateTokens, JWT_SECRET };
