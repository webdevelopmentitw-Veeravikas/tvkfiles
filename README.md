# TVKFiles — Full Stack Governance Accountability Tracker

A secure, production-ready full-stack app with:
- **Express.js** backend with JWT auth, role-based access, rate limiting
- **MySQL / MariaDB** database (XAMPP compatible, via mysql2)
- **React + Vite** admin panel with full CRUD, file uploads, audit logs, DB backup
- **4 roles**: superadmin, admin, moderator, viewer

---

## 📁 Project Structure

```
tvkfiles/
├── backend/
│   ├── server.js              # Main Express server
│   ├── db.js                  # Database init, seed, save
│   ├── .env                   # Environment variables (incl. DB_* settings)
│   ├── middleware/
│   │   ├── auth.js            # JWT auth, role guards
│   │   ├── audit.js           # Audit logger
│   │   └── upload.js          # Multer file upload config
│   ├── routes/
│   │   ├── auth.js            # Login, logout, change-password
│   │   ├── incidents.js       # Incidents CRUD + publish
│   │   ├── files.js           # File upload, serve, delete
│   │   ├── admin.js           # Users, audit, sessions, dashboard
│   │   └── backup.js          # DB download, ZIP export, JSON export
│   ├── uploads/               # Uploaded files (auto-created)
│   └── package.json
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       └── AdminApp.jsx       # Full admin panel (single file)
│
├── db/
│   └── tvkfiles-db.sql        # MySQL schema + seed (import in phpMyAdmin)
│
├── README.md
└── .gitignore
```

---

## 🚀 Quick Start

### 1. Start XAMPP MySQL

Open XAMPP Control Panel and start **MySQL**.

### 2. Configure database (backend/.env)

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=tvkfiles-db
```

**Option A — Import SQL in phpMyAdmin (recommended for XAMPP):**
1. Start MySQL in XAMPP
2. Open http://localhost/phpmyadmin
3. Click **Import** → choose `db/tvkfiles-db.sql` → **Go**

**Option B — Auto-create on server start:**
Run `node server.js` — tables are created automatically if the database is empty.

### 3. Install & run backend

```bash
cd backend
npm install
node server.js
# API runs at http://localhost:4000
```

### 4. Install & run frontend

```bash
cd frontend
npm install
npm run dev
# App runs at http://localhost:5173
```

---

## 🔐 Default Credentials

> **Change these immediately after first login!**

| Username    | Password             | Role        |
|-------------|----------------------|-------------|
| superadmin  | SuperTVK##Root99!    | superadmin  |
| admin       | Admin@TVK#2025!      | admin       |
| viewer      | Viewer@2025!         | viewer      |

### Admin portal URL (hidden)

The admin login is **not linked** on the public site. Access uses a secret hash configured in `.env`:

1. Set the **same** secret in both files (min 24 characters, letters/numbers/`_`/`-` only):
   - `backend/.env` → `ADMIN_PORTAL_KEY=your-long-random-secret`
   - `frontend/.env` → `VITE_ADMIN_PORTAL_KEY=your-long-random-secret`
2. Restart backend and frontend after changing.
3. Open: `http://localhost:5173/#your-long-random-secret`

On backend start, the full private URL is printed in the console. **Do not share it publicly.** Change the key before production.

`#admin` and other guessable paths no longer work.

---

## 👥 Role Permissions

| Feature                | viewer | moderator | admin | superadmin |
|------------------------|--------|-----------|-------|------------|
| View public tracker    | ✅     | ✅        | ✅    | ✅         |
| Upload files           | ❌     | ✅        | ✅    | ✅         |
| Publish/unpublish      | ❌     | ✅        | ✅    | ✅         |
| Create/edit incidents  | ❌     | ❌        | ✅    | ✅         |
| Delete incidents/files | ❌     | ❌        | ✅    | ✅         |
| User management        | ❌     | ❌        | ✅    | ✅         |
| View audit logs        | ❌     | ❌        | ✅    | ✅         |
| Manage sessions        | ❌     | ❌        | ❌    | ✅         |
| Create users           | ❌     | ❌        | ❌    | ✅         |
| Download DB / ZIP      | ❌     | ❌        | ❌    | ✅         |

---

## 🛡️ Security Features

- **JWT tokens** (8h expiry) + session table with revocation
- **Bcrypt** password hashing (12 rounds)
- **Account lockout** after 5 failed logins (15-minute lock)
- **Rate limiting**: 200 req/15min global, 10 req/15min on login
- **Helmet.js** security headers
- **CORS** restricted to configured frontend URL
- **Role-based middleware** on every admin endpoint
- **Full audit log**: every create, update, delete, login, download
- **File type whitelist**: images, PDF, Word, video, text only
- **20MB per file** limit, max 5 files per upload

---

## 📡 API Endpoints

### Auth
```
POST   /api/auth/login            — Login
POST   /api/auth/logout           — Logout (auth)
GET    /api/auth/me               — Current user (auth)
POST   /api/auth/change-password  — Change password (auth)
```

### Incidents
```
GET    /api/incidents             — Public list (published only)
GET    /api/incidents/stats       — Public stats
GET    /api/incidents/:id         — Single incident
GET    /api/incidents/admin/all   — All incidents (moderator+)
POST   /api/incidents             — Create (admin+)
PUT    /api/incidents/:id         — Update (admin+)
PATCH  /api/incidents/:id/publish — Publish/unpublish (moderator+)
DELETE /api/incidents/:id         — Delete (admin+)
```

### Files
```
POST   /api/files/upload          — Upload files (moderator+)
GET    /api/files/:id             — Serve file (auth)
GET    /api/files                 — List all (admin+)
DELETE /api/files/:id             — Delete (admin+)
PATCH  /api/files/:id/attach      — Attach to incident (admin+)
```

### Admin
```
GET    /api/admin/dashboard       — Stats + recent activity (admin+)
GET    /api/admin/users           — User list (admin+)
POST   /api/admin/users           — Create user (superadmin)
PUT    /api/admin/users/:id       — Update user (superadmin)
DELETE /api/admin/users/:id       — Delete user (superadmin)
POST   /api/admin/users/:id/unlock — Unlock account (admin+)
GET    /api/admin/audit           — Audit log (admin+)
GET    /api/admin/sessions        — Active sessions (superadmin)
DELETE /api/admin/sessions/:uid   — Revoke sessions (superadmin)
```

### Backup
```
GET    /api/backup/full-zip       — Full ZIP backup (superadmin)
GET    /api/backup/db             — MySQL SQL dump download (superadmin)
GET    /api/backup/export-json    — JSON table export (admin+)
```

---

## 💾 Database Backup & Restore

### Download backup (from admin panel)
Admin Panel → Backup & Export → Download Full ZIP

### Manual restore (XAMPP)
```bash
# 1. Open http://localhost/phpmyadmin
# 2. Import the downloaded .sql file (or db/tvkfiles.sql from ZIP backup)
# 3. Restart the backend server
node server.js
```

---

## 🔧 Production Deployment

```bash
# 1. Set strong secrets in backend/.env
JWT_SECRET=<random-64-char-string>
FRONTEND_URL=https://yourdomain.com
NODE_ENV=production

# 2. Build frontend
cd frontend && npm run build

# 3. Serve with PM2
npm install -g pm2
cd backend && pm2 start server.js --name tvkfiles

# 4. Nginx reverse proxy recommended
# Point /api → localhost:4000
# Point / → frontend/dist (static)
```

---

## 📦 Allowed Upload Types

| Type       | Extensions          |
|------------|---------------------|
| Images     | JPG, PNG, GIF, WEBP |
| Documents  | PDF, DOC, DOCX      |
| Video      | MP4, WEBM           |
| Text       | TXT                 |

Max size: **20MB per file** | Max files per upload: **5**
