const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");
const https = require("https");

const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "tvkfiles-db",
};

let pool;
let dbInterface;

function createDBInterface(dbPool) {
  return {
    async exec(sql, params = []) {
      const [rows, fields] = await dbPool.query(sql, params);
      if (!fields || !fields.length) return [];
      const columns = fields.map((f) => f.name);
      const values = (Array.isArray(rows) ? rows : []).map((row) =>
        columns.map((c) => row[c])
      );
      return [{ columns, values }];
    },

    async run(sql, params = []) {
      await dbPool.query(sql, params);
    },
  };
}

async function initDB() {
  const { database, ...serverConfig } = DB_CONFIG;

  const bootstrap = await mysql.createConnection(serverConfig);
  await bootstrap.query(
    `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await bootstrap.end();

  pool = mysql.createPool({
    ...DB_CONFIG,
    waitForConnections: true,
    connectionLimit: 10,
    charset: "utf8mb4",
  });

  dbInterface = createDBInterface(pool);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'viewer',
      created_at VARCHAR(30) NOT NULL,
      last_login VARCHAR(30),
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      login_attempts INT NOT NULL DEFAULT 0,
      locked_until VARCHAR(30)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS incidents (
      id VARCHAR(36) PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      description TEXT NOT NULL,
      category VARCHAR(50) NOT NULL,
      date VARCHAR(20) NOT NULL,
      district VARCHAR(100) NOT NULL,
      source VARCHAR(255),
      source_url VARCHAR(500),
      tags TEXT,
      severity VARCHAR(20) NOT NULL DEFAULT 'medium',
      status VARCHAR(50) NOT NULL DEFAULT 'unresolved',
      submitted_by VARCHAR(36),
      reviewed_by VARCHAR(36),
      is_published TINYINT(1) NOT NULL DEFAULT 0,
      created_at VARCHAR(30) NOT NULL,
      updated_at VARCHAR(30) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS files (
      id VARCHAR(36) PRIMARY KEY,
      incident_id VARCHAR(36),
      original_name VARCHAR(255) NOT NULL,
      stored_name VARCHAR(500) NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      size INT NOT NULL,
      uploaded_by VARCHAR(36),
      created_at VARCHAR(30) NOT NULL,
      FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36),
      username VARCHAR(100),
      action VARCHAR(50) NOT NULL,
      target_type VARCHAR(50),
      target_id VARCHAR(100),
      details TEXT,
      ip VARCHAR(45),
      created_at VARCHAR(30) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      token_hash VARCHAR(64) NOT NULL,
      ip VARCHAR(45),
      user_agent TEXT,
      created_at VARCHAR(30) NOT NULL,
      expires_at VARCHAR(30) NOT NULL,
      is_revoked TINYINT(1) NOT NULL DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  const [existing] = await pool.query(
    "SELECT id FROM users WHERE role='admin' LIMIT 1"
  );

  if (!existing.length) {
    const hash = bcrypt.hashSync("Admin@TVK#2025!", 12);
    await pool.query(
      "INSERT INTO users (id,username,password_hash,role,created_at,is_active) VALUES (?,?,?,?,?,1)",
      [uuidv4(), "admin", hash, "admin", new Date().toISOString()]
    );

    const hash2 = bcrypt.hashSync("SuperTVK##Root99!", 12);
    await pool.query(
      "INSERT INTO users (id,username,password_hash,role,created_at,is_active) VALUES (?,?,?,?,?,1)",
      [uuidv4(), "superadmin", hash2, "superadmin", new Date().toISOString()]
    );

    const hash3 = bcrypt.hashSync("Viewer@2025!", 12);
    await pool.query(
      "INSERT INTO users (id,username,password_hash,role,created_at,is_active) VALUES (?,?,?,?,?,1)",
      [uuidv4(), "viewer", hash3, "viewer", new Date().toISOString()]
    );

    const sampleIncidents = SAMPLE_INCIDENTS_FOR_BACKFILL;

    const now = new Date().toISOString();
    const incidentIds = [];
    for (const inc of sampleIncidents) {
      const id = uuidv4();
      incidentIds.push({ id, imageSeed: inc.imageSeed });
      await pool.query(
        `INSERT INTO incidents (id,title,description,category,date,district,source,source_url,tags,severity,status,is_published,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,1,?,?)`,
        [id, inc.title, inc.description, inc.category, inc.date, inc.district, inc.source, inc.source_url || "", inc.tags, inc.severity, inc.status, now, now]
      );
    }

    await seedDummyImagesForIncidents(incidentIds.map(x => ({ id: x.id, seed: x.imageSeed })));

    console.log("✅ Database seeded with admin, superadmin, viewer and sample data");
  }

  await backfillDummyImagesAndSources();
  await seedMissingSampleIncidents();

  console.log(`✅ MySQL database initialized (${DB_CONFIG.database}@${DB_CONFIG.host})`);
  return dbInterface;
}

const UPLOAD_ROOT = path.join(__dirname, "uploads");

const CATEGORY_IMAGE_SEEDS = {
  corruption: "tvk-corruption",
  crime: "tvk-crime",
  "broken-promise": "tvk-promise",
  "admin-failure": "tvk-admin",
  "honour-killing": "tvk-honour",
  "loss-investments": "tvk-investment",
  "insta-cards": "tvk-insta",
};

const CORE_SAMPLE_INCIDENTS = [
  {
    title: "Sand Mining Syndicate Exposed in Delta Districts",
    description: "Multiple TVK-linked members allegedly operating illegal sand quarries in Thanjavur and Tiruvarur districts. Local farmers report coercion and land grabbing.",
    category: "corruption", date: "2025-05-18", district: "Thanjavur",
    source: "The Hindu", source_url: "https://www.thehindu.com/news/national/tamil-nadu/",
    tags: "sand-mining,land-grab,delta", severity: "high", status: "under-investigation", imageSeed: "tvk-sand-mining"
  },
  {
    title: "Election Promise: Free Bus Pass for Students — Still Pending",
    description: "TVK's 2024 manifesto promised free bus passes for all college students within 6 months of taking power. 14 months later, implementation has not begun.",
    category: "broken-promise", date: "2025-04-30", district: "Statewide",
    source: "Dinamalar", source_url: "https://www.dinamalar.com/",
    tags: "students,transport,manifesto-2024", severity: "medium", status: "unresolved", imageSeed: "tvk-bus-pass"
  },
  {
    title: "Party Cadre Assault on Journalist in Madurai",
    description: "A reporter covering a party rally was physically assaulted by TVK cadre. FIR filed but no arrests made after 3 weeks.",
    category: "crime", date: "2025-05-10", district: "Madurai",
    source: "News18 Tamil", source_url: "https://tamil.news18.com/",
    tags: "press-freedom,violence,cadre", severity: "high", status: "fir-filed", imageSeed: "tvk-journalist"
  },
  {
    title: "Tender Irregularities in Coimbatore Municipal Contract",
    description: "₹42 crore road development tender awarded without competitive bidding. Contractor linked to district party treasurer through shell companies.",
    category: "corruption", date: "2025-05-02", district: "Coimbatore",
    source: "Times of India", source_url: "https://timesofindia.indiatimes.com/city/coimbatore",
    tags: "tender,municipal,shell-company", severity: "high", status: "under-investigation", imageSeed: "tvk-tender"
  },
  {
    title: "Ration Shops Closed for 11 Days — Supply Chain Collapse",
    description: "340+ ration shops across 4 districts remained non-operational due to supply chain mismanagement by the civil supplies department.",
    category: "admin-failure", date: "2025-05-15", district: "Salem",
    source: "Puthiya Thalaimurai", source_url: "https://www.puthiyathalaimurai.com/",
    tags: "ration,food-security,PDS", severity: "critical", status: "partially-resolved", imageSeed: "tvk-ration"
  },
  {
    title: "Custodial Death in Vellore — Probe Delayed 45 Days",
    description: "A 28-year-old man died in police custody. NHRC notice issued. Internal inquiry stalled; family alleges political interference.",
    category: "crime", date: "2025-04-01", district: "Vellore",
    source: "NDTV Tamil", source_url: "https://tamil.ndtv.com/",
    tags: "police,custodial-death,NHRC", severity: "critical", status: "nhrc-notice", imageSeed: "tvk-custodial"
  },
];

const NEW_CATEGORY_SAMPLES = [
  {
    title: "Honour Killing in Madurai — Inter-Caste Couple Murdered",
    description: "A young couple was killed after an inter-caste marriage. Activists allege local party functionaries pressured police to delay arrests of relatives linked to influential cadre.",
    category: "honour-killing", date: "2025-05-08", district: "Madurai",
    source: "The Hindu", source_url: "https://www.thehindu.com/news/national/tamil-nadu/",
    tags: "honour-killing,caste,violence", severity: "critical", status: "under-investigation", imageSeed: "tvk-honour-killing"
  },
  {
    title: "Chit Fund Collapse — 2,400 Investors Lose ₹18 Crore",
    description: "A cooperative investment scheme promoted at party events defaulted. Families claim district organisers collected deposits promising guaranteed returns endorsed at public rallies.",
    category: "loss-investments", date: "2025-05-12", district: "Chennai",
    source: "Times of India", source_url: "https://timesofindia.indiatimes.com/city/chennai",
    tags: "chit-fund,investment-fraud,depositors", severity: "critical", status: "fir-filed", imageSeed: "tvk-chit-fund"
  },
  {
    title: "Instagram Card Fraud — Premium Giveaway Scam Targeting Youth",
    description: "Fake Instagram accounts using party-branded aesthetic cards solicited prepaid card numbers and UPI payments. Cyber cell traced wallets to accounts linked to youth wing coordinators.",
    category: "insta-cards", date: "2025-05-20", district: "Coimbatore",
    source: "News18 Tamil", source_url: "https://tamil.news18.com/",
    tags: "instagram,scam,cyber-crime,youth", severity: "high", status: "under-investigation", imageSeed: "tvk-insta-scam"
  },
  {
    title: "Family Alleges Honour Killing Cover-Up in Salem District",
    description: "Woman found dead weeks after filing a harassment complaint against relatives opposing her marriage. NHRC notice sought as investigation moves slowly.",
    category: "honour-killing", date: "2025-04-22", district: "Salem",
    source: "NDTV Tamil", source_url: "https://tamil.ndtv.com/",
    tags: "honour-killing,NHRC,women-safety", severity: "high", status: "nhrc-notice", imageSeed: "tvk-honour-salem"
  },
  {
    title: "Crypto Investment Scheme Promoted Online — ₹6 Crore Lost",
    description: "Social media pages promised 300% returns on crypto deposits. Victims include small traders who invested after endorsements circulated in party-affiliated WhatsApp groups.",
    category: "loss-investments", date: "2025-05-03", district: "Tiruchirappalli",
    source: "Dinamalar", source_url: "https://www.dinamalar.com/",
    tags: "crypto,investment-scam,social-media", severity: "high", status: "under-investigation", imageSeed: "tvk-crypto-scam"
  },
  {
    title: "Fake Instagram Verification Cards Sold to Aspiring Influencers",
    description: "Fraudsters sold counterfeit 'verified creator' cards via Instagram DMs, collecting fees from college students. Several accounts reused official event photo backdrops.",
    category: "insta-cards", date: "2025-05-16", district: "Chennai",
    source: "Puthiya Thalaimurai", source_url: "https://www.puthiyathalaimurai.com/",
    tags: "instagram,fake-verification,influencer-scam", severity: "medium", status: "unresolved", imageSeed: "tvk-insta-verify"
  },
];

const EXTRA_DUMMY_SAMPLES = [
  {
    title: "Liquor License Kickbacks in Chennai Corporation",
    description: "RTI documents suggest ₹2.3 crore in bribes exchanged for bar license renewals. Whistleblower alleges ward-level coordinators collected payments before municipal committee meetings.",
    category: "corruption", date: "2025-05-14", district: "Chennai",
    source: "The Hindu", source_url: "https://www.thehindu.com/news/cities/chennai/",
    tags: "liquor-license,bribery,corporation", severity: "high", status: "under-investigation", imageSeed: "tvk-liquor-license"
  },
  {
    title: "Ghost Workers in Rural Employment Scheme — Tiruvarur",
    description: "Audit found 1,800 fake job cards linked to panchayat functionaries. Wages were drawn for non-existent workers on watershed projects.",
    category: "corruption", date: "2025-04-18", district: "Tiruvarur",
    source: "Dinamalar", source_url: "https://www.dinamalar.com/",
    tags: "MGNREGA,ghost-workers,audit", severity: "critical", status: "fir-filed", imageSeed: "tvk-ghost-workers"
  },
  {
    title: "Booth Capture Attempt in Local Body Polls — Thanjavur",
    description: "Video evidence shows cadres blocking voters near three polling booths. Election officials filed complaints but no arrests reported within 72 hours.",
    category: "crime", date: "2025-05-06", district: "Thanjavur",
    source: "News18 Tamil", source_url: "https://tamil.news18.com/",
    tags: "election,booth-capture,voter-intimidation", severity: "critical", status: "under-investigation", imageSeed: "tvk-booth-capture"
  },
  {
    title: "Vandalism During Opposition Rally — Chennai",
    description: "Stage equipment and vehicles damaged after rival groups clashed near a public meeting venue. Shopkeepers estimate ₹40 lakh in losses.",
    category: "crime", date: "2025-05-19", district: "Chennai",
    source: "Times of India", source_url: "https://timesofindia.indiatimes.com/city/chennai",
    tags: "vandalism,rally,violence", severity: "high", status: "fir-filed", imageSeed: "tvk-vandalism"
  },
  {
    title: "Promised ₹5,000 Monthly Stipend for Unemployed Youth — Not Disbursed",
    description: "Manifesto pledge of monthly unemployment support for graduates remains unimplemented after 16 months. Only pilot registration forms were circulated in two districts.",
    category: "broken-promise", date: "2025-05-11", district: "Statewide",
    source: "The Hindu", source_url: "https://www.thehindu.com/news/national/tamil-nadu/",
    tags: "youth,stipend,employment,manifesto", severity: "high", status: "unresolved", imageSeed: "tvk-youth-stipend"
  },
  {
    title: "Free Laptop Promise for First-Year Students — Only 12% Delivered",
    description: "Government colleges report fewer than 12% of promised laptops distributed. Students in rural campuses say they were asked to wait until after local elections.",
    category: "broken-promise", date: "2025-04-25", district: "Tiruchirappalli",
    source: "Puthiya Thalaimurai", source_url: "https://www.puthiyathalaimurai.com/",
    tags: "education,laptop,students", severity: "medium", status: "partially-resolved", imageSeed: "tvk-laptop-promise"
  },
  {
    title: "Hospital Oxygen Shortage During Heatwave — Madurai",
    description: "Government hospital ran critically low on oxygen cylinders during a heatwave week. Patients' families allege procurement delays despite prior warnings.",
    category: "admin-failure", date: "2025-05-17", district: "Madurai",
    source: "NDTV Tamil", source_url: "https://tamil.ndtv.com/",
    tags: "healthcare,oxygen,hospital", severity: "critical", status: "under-investigation", imageSeed: "tvk-oxygen-shortage"
  },
  {
    title: "Delayed Paddy Procurement — Farmers Protest in Thanjavur",
    description: "Over 2,000 farmers blocked highways demanding immediate paddy procurement. Direct payment centres remained closed for 19 days in delta regions.",
    category: "admin-failure", date: "2025-05-09", district: "Thanjavur",
    source: "Dinamalar", source_url: "https://www.dinamalar.com/",
    tags: "farmers,paddy,procurement,protest", severity: "high", status: "unresolved", imageSeed: "tvk-paddy-procurement"
  },
  {
    title: "Inter-Caste Marriage Couple Threatened in Vellore",
    description: "Couple received repeated death threats after wedding photos circulated online. Police granted protection only after court intervention.",
    category: "honour-killing", date: "2025-05-21", district: "Vellore",
    source: "The Hindu", source_url: "https://www.thehindu.com/news/national/tamil-nadu/",
    tags: "honour-killing,threats,inter-caste", severity: "high", status: "fir-filed", imageSeed: "tvk-honour-vellore"
  },
  {
    title: "MLM Investment Fraud Using Party Event Photos — Salem",
    description: "Multi-level marketing operators used cropped rally photos to claim official endorsement. Over 900 investors registered before scheme collapsed.",
    category: "loss-investments", date: "2025-04-28", district: "Salem",
    source: "Times of India", source_url: "https://timesofindia.indiatimes.com/city/salem",
    tags: "MLM,investment-fraud,photos", severity: "high", status: "under-investigation", imageSeed: "tvk-mlm-salem"
  },
  {
    title: "Gold Savings Scheme Defaults — Coimbatore",
    description: "Jewellery-linked monthly savings scheme shut offices overnight. Depositors allege district organisers promised guaranteed returns at ward meetings.",
    category: "loss-investments", date: "2025-05-07", district: "Coimbatore",
    source: "News18 Tamil", source_url: "https://tamil.news18.com/",
    tags: "gold-scheme,savings,depositors", severity: "critical", status: "fir-filed", imageSeed: "tvk-gold-scheme"
  },
  {
    title: "Fake Concert Ticket Giveaway via Instagram Cards — Chennai",
    description: "Accounts posted branded 'VIP pass' cards asking fans to share bank details for a lottery. Cybercrime unit identified 14 cloned profiles in one week.",
    category: "insta-cards", date: "2025-05-13", district: "Chennai",
    source: "Puthiya Thalaimurai", source_url: "https://www.puthiyathalaimurai.com/",
    tags: "instagram,tickets,lottery-scam", severity: "medium", status: "under-investigation", imageSeed: "tvk-insta-tickets"
  },
  {
    title: "Romance Scam via Branded Instagram Reels — Tiruchirappalli",
    description: "Fraudsters built fake profiles using edited event footage to befriend victims and solicit emergency transfers. Police traced 23 complaints in 30 days.",
    category: "insta-cards", date: "2025-05-04", district: "Tiruchirappalli",
    source: "NDTV Tamil", source_url: "https://tamil.ndtv.com/",
    tags: "instagram,romance-scam,cybercrime", severity: "high", status: "unresolved", imageSeed: "tvk-insta-romance"
  },
  {
    title: "Illegal Quarry Operations Near School — Salem",
    description: "Blasting at an unauthorized quarry continued 200 metres from a primary school despite stop-work notices. Parents petitioned district collector twice.",
    category: "crime", date: "2025-04-15", district: "Salem",
    source: "The Hindu", source_url: "https://www.thehindu.com/news/cities/Coimbatore/",
    tags: "quarry,children,safety", severity: "medium", status: "partially-resolved", imageSeed: "tvk-quarry-salem"
  },
  {
    title: "Smart City Wi-Fi Promise — Still Offline in Coimbatore Zones",
    description: "2024 pledge to provide free public Wi-Fi at 50 city hubs remains largely unimplemented. Only 6 access points functional after repeated deadline extensions.",
    category: "broken-promise", date: "2025-05-22", district: "Coimbatore",
    source: "Times of India", source_url: "https://timesofindia.indiatimes.com/city/coimbatore",
    tags: "smart-city,wifi,digital-promise", severity: "low", status: "unresolved", imageSeed: "tvk-wifi-promise"
  },
];

const ALL_SAMPLE_INCIDENTS = [...NEW_CATEGORY_SAMPLES, ...EXTRA_DUMMY_SAMPLES];
const SAMPLE_INCIDENTS_FOR_BACKFILL = [...CORE_SAMPLE_INCIDENTS, ...ALL_SAMPLE_INCIDENTS];

function downloadToFile(url, dest, redirects = 0) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location && redirects < 5) {
        res.resume();
        return downloadToFile(res.headers.location, dest, redirects + 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on("finish", () => file.close(() => resolve(dest)));
      file.on("error", reject);
    }).on("error", reject);
  });
}

async function seedDummyImagesForIncidents(items) {
  const monthDir = path.join(UPLOAD_ROOT, new Date().toISOString().slice(0, 7));
  fs.mkdirSync(monthDir, { recursive: true });

  for (const { id, seed } of items) {
    const fileId = uuidv4();
    const storedAbs = path.join(monthDir, `${fileId}.jpg`);
    const relPath = path.relative(UPLOAD_ROOT, storedAbs).replace(/\\/g, "/");
    try {
      await downloadToFile(`https://picsum.photos/seed/${encodeURIComponent(seed || id)}/640/360.jpg`, storedAbs);
      const stat = fs.statSync(storedAbs);
      if (stat.size < 500) throw new Error("Download too small");
      await pool.query(
        `INSERT INTO files (id,incident_id,original_name,stored_name,mime_type,size,created_at) VALUES (?,?,?,?,?,?,?)`,
        [fileId, id, `incident-cover.jpg`, relPath, "image/jpeg", stat.size, new Date().toISOString()]
      );
    } catch (err) {
      if (fs.existsSync(storedAbs)) fs.unlinkSync(storedAbs);
      console.warn(`⚠ Dummy image skipped for incident ${id}:`, err.message);
    }
  }
}

async function backfillDummyImagesAndSources() {
  const sourceUrls = Object.fromEntries(
    [...SAMPLE_INCIDENTS_FOR_BACKFILL].map((inc) => [inc.title, inc.source_url]).filter(([, url]) => url)
  );

  for (const [title, url] of Object.entries(sourceUrls)) {
    await pool.query(
      "UPDATE incidents SET source_url=? WHERE title=? AND (source_url IS NULL OR source_url='')",
      [url, title]
    );
  }

  const [rows] = await pool.query(`
    SELECT i.id, i.title, i.category FROM incidents i
    WHERE NOT EXISTS (
      SELECT 1 FROM files f WHERE f.incident_id = i.id AND f.mime_type LIKE 'image/%'
    )
  `);

  if (!rows.length) return;

  const seeds = CATEGORY_IMAGE_SEEDS;

  await seedDummyImagesForIncidents(
    rows.map((r) => ({ id: r.id, seed: `${seeds[r.category] || "tvk"}-${r.id.slice(0, 8)}` }))
  );

  if (rows.length) console.log(`✅ Dummy images added for ${rows.length} incident(s)`);
}

async function seedMissingSampleIncidents() {
  const now = new Date().toISOString();
  const toInsert = [];

  for (const inc of SAMPLE_INCIDENTS_FOR_BACKFILL) {
    const [existing] = await pool.query("SELECT id FROM incidents WHERE title=? LIMIT 1", [inc.title]);
    if (!existing.length) toInsert.push(inc);
  }

  if (!toInsert.length) return;

  const incidentIds = [];
  for (const inc of toInsert) {
    const id = uuidv4();
    incidentIds.push({ id, imageSeed: inc.imageSeed });
    await pool.query(
      `INSERT INTO incidents (id,title,description,category,date,district,source,source_url,tags,severity,status,is_published,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,1,?,?)`,
      [id, inc.title, inc.description, inc.category, inc.date, inc.district, inc.source, inc.source_url || "", inc.tags, inc.severity, inc.status, now, now]
    );
  }

  await seedDummyImagesForIncidents(incidentIds.map(x => ({ id: x.id, seed: x.imageSeed })));
  console.log(`✅ Added ${toInsert.length} sample incident(s)`);
}

function getDB() {
  if (!dbInterface) throw new Error("Database not initialized. Call initDB() first.");
  return dbInterface;
}

function getPool() {
  if (!pool) throw new Error("Database not initialized. Call initDB() first.");
  return pool;
}

function saveDB() {
  // No-op: MySQL persists writes immediately
}

module.exports = { initDB, getDB, getPool, saveDB, DB_CONFIG };
