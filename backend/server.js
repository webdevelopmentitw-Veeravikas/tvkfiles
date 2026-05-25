require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");
const { initDB } = require("./db");

const app = express();
const PORT = process.env.PORT || 4000;

// ── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || ["http://localhost:3000", "http://localhost:5173"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Global rate limiter
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: "Too many requests, please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
}));

// Auth endpoint stricter limiter
app.use("/api/auth/login", rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many login attempts. Try again in 15 minutes." },
}));

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(morgan("combined"));

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth",      require("./routes/auth"));
app.use("/api/incidents", require("./routes/incidents"));
app.use("/api/files",     require("./routes/files"));
app.use("/api/admin",     require("./routes/admin"));
app.use("/api/backup",    require("./routes/backup"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), version: "1.0.0" });
});

// Serve uploaded files statically (auth enforced in route handler)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── 404 / Error Handler ──────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: "Not found" }));

app.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "File too large. Max 20MB per file." });
  }
  if (err.message?.startsWith("File type not allowed")) {
    return res.status(400).json({ error: err.message });
  }
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ── Boot ─────────────────────────────────────────────────────────────────────
(async () => {
  await initDB();
  app.listen(PORT, () => {
    const frontend = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
    const portalKey = (process.env.ADMIN_PORTAL_KEY || "").trim().replace(/^#/, "");
    const adminPortalUrl = portalKey.length >= 24 ? `${frontend}/#${portalKey}` : null;

    console.log(`
╔══════════════════════════════════════════════╗
║   TVKFiles Backend API — Port ${PORT}           ║
║   Database: MySQL (${process.env.DB_NAME || "tvkfiles"})          ║
║                                              ║
║   Credentials (change immediately!):         ║
║   superadmin / SuperTVK##Root99!             ║
║   admin       / Admin@TVK#2025!              ║
║   viewer      / Viewer@2025!                 ║
╚══════════════════════════════════════════════╝
    `);
    if (adminPortalUrl) {
      console.log(`🔐 Admin portal (private — do not share): ${adminPortalUrl}`);
    } else {
      console.warn("⚠ Admin portal disabled: set ADMIN_PORTAL_KEY in backend/.env and VITE_ADMIN_PORTAL_KEY in frontend/.env (min 24 chars).");
    }
  });
})();
