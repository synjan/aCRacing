/* global process */
// server.js – aCRacing web server
// Dev:  Vite middleware (HMR) + Steam auth + API proxy
// Prod: Static files (dist/) + Steam auth + API proxy

import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import express from "express";
import session from "express-session";
import passport from "passport";
import SteamStrategy from "passport-steam";
import http from "http";
import Database from "better-sqlite3";
import rateLimit from "express-rate-limit";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env file if present
try {
  const env = readFileSync(join(__dirname, ".env"), "utf8");
  for (const line of env.split("\n")) {
    const match = line.match(/^([A-Z_]+)=(.+)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim();
  }
} catch { /* .env not required */ }

const PORT = parseInt(process.env.PORT || "3001");
const STEAM_API_KEY = process.env.STEAM_API_KEY || "";
const SESSION_SECRET = process.env.SESSION_SECRET || "acracing-dev-secret-change-me";
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const IS_PROD = process.env.NODE_ENV === "production";
// I prod kjører AC-serverne på samme VPS (localhost), i dev brukes public IP
const AC_HOST = IS_PROD ? "127.0.0.1" : "46.225.176.106";

const API_MAP = {
  "/api/trackday": 9680,
  "/api/mx5cup": 9690,
  "/api/gt3": 9700,
};

const app = express();
app.set("trust proxy", 1);

// ── Session ──────────────────────────────────────────────────────────────────
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    secure: BASE_URL.startsWith("https"),
    httpOnly: true,
    sameSite: "lax",
  },
}));

// ── Passport / Steam OpenID ──────────────────────────────────────────────────
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

if (STEAM_API_KEY) {
  passport.use(new SteamStrategy.Strategy({
    returnURL: `${BASE_URL}/auth/steam/callback`,
    realm: BASE_URL,
    apiKey: STEAM_API_KEY,
  }, (_identifier, profile, done) => {
    const user = {
      steamId: profile.id,
      name: profile.displayName,
      avatar: profile.photos?.[2]?.value || profile.photos?.[0]?.value || "",
      avatarSmall: profile.photos?.[0]?.value || "",
      profileUrl: profile._json?.profileurl || "",
    };
    done(null, user);
  }));
}

app.use(passport.initialize());
app.use(passport.session());

// ── Rate limiting ────────────────────────────────────────────────────────────
const relaxedLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ error: "Too many requests", retryAfter: 60 }),
});

const standardLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ error: "Too many requests", retryAfter: 60 }),
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ error: "Too many requests", retryAfter: 900 }),
});

// Apply standard limiter to API routes
app.use("/api/leaderboard", standardLimiter);
app.use("/api/results", standardLimiter);
app.use("/api/tracks", standardLimiter);
app.use("/api/profile", standardLimiter);
app.use("/api/search", standardLimiter);
app.use("/api/standings", standardLimiter);

// Apply relaxed limiter to proxy and health routes
app.use("/api/trackday", relaxedLimiter);
app.use("/api/mx5cup", relaxedLimiter);
app.use("/api/gt3", relaxedLimiter);
app.use("/api/health", relaxedLimiter);
app.use("/api/live", relaxedLimiter);
app.use("/auth/profile", relaxedLimiter);

// Apply auth limiter to auth routes
app.use("/auth/steam", authLimiter);
app.use("/auth/logout", authLimiter);

// ── Auth routes ──────────────────────────────────────────────────────────────
app.get("/auth/steam", (req, res, next) => {
  if (!STEAM_API_KEY) return res.status(503).json({ error: "Steam API key not configured" });
  passport.authenticate("steam")(req, res, next);
});

app.get("/auth/steam/callback",
  passport.authenticate("steam", { failureRedirect: "/" }),
  (_req, res) => res.redirect("/")
);

app.get("/auth/profile", (req, res) => {
  if (req.user) return res.json(req.user);
  res.status(401).json({ error: "Not logged in" });
});

app.post("/auth/logout", (req, res) => {
  req.logout(() => {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });
});

// ── API proxy ────────────────────────────────────────────────────────────────
for (const [path, port] of Object.entries(API_MAP)) {
  app.get(path, (req, res) => {
    const proxy = http.get(`http://${AC_HOST}:${port}/INFO`, { timeout: 5000 }, (upstream) => {
      res.set("Content-Type", "application/json");
      upstream.pipe(res);
    });
    proxy.on("error", () => res.status(502).json({ error: "Server unavailable" }));
    proxy.on("timeout", () => { proxy.destroy(); res.status(504).json({ error: "Timeout" }); });
  });
}

// ── Stracker databases (read-only) ──────────────────────────────────────────
const DB_PATHS = IS_PROD
  ? { trackday: "/opt/stracker/trackday/stracker.db3", mx5cup: "/opt/stracker/mx5cup/stracker.db3", gt3: "/opt/stracker/gt3/stracker.db3" }
  : { trackday: join(__dirname, "../temp/trackday.db3"), mx5cup: join(__dirname, "../temp/mx5cup.db3"), gt3: join(__dirname, "../temp/gt3.db3") };

const dbCache = {};
function getDb(instance) {
  if (dbCache[instance]) return dbCache[instance];
  const p = DB_PATHS[instance];
  if (!p || !existsSync(p)) return null;
  const db = new Database(p, { readonly: true, fileMustExist: true });
  dbCache[instance] = db;
  return db;
}

// Simple TTL cache
const profileCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 min
const steamCache = new Map();
const STEAM_CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function fetchSteamProfile(steamId) {
  const cached = steamCache.get(steamId);
  if (cached && Date.now() - cached.ts < STEAM_CACHE_TTL) return cached.data;
  if (!STEAM_API_KEY) return null;
  try {
    const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${steamId}`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!resp.ok) return null;
    const json = await resp.json();
    const player = json.response?.players?.[0] || null;
    const data = player ? {
      name: player.personaname,
      avatar: player.avatarfull || player.avatarmedium || player.avatar || "",
      profileUrl: player.profileurl || "",
    } : null;
    steamCache.set(steamId, { data, ts: Date.now() });
    return data;
  } catch { return null; }
}

app.get("/api/profile/:steamId", async (req, res) => {
  const steamId = req.params.steamId;
  if (!/^7656119\d{10}$/.test(steamId)) {
    return res.status(400).json({ error: "Invalid Steam ID" });
  }

  const cacheKey = steamId;
  const cached = profileCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return res.json(cached.data);
  }

  const summary = { totalLaps: 0, validLaps: 0, totalSessions: 0, totalDrivingTimeMs: 0, servers: {} };
  const personalRecords = [];
  const recentSessions = [];
  const carMap = {};
  let playerName = null;

  for (const [instance, _path] of Object.entries(DB_PATHS)) {
    const db = getDb(instance);
    if (!db) { summary.servers[instance] = { laps: 0, sessions: 0 }; continue; }

    const player = db.prepare("SELECT PlayerId, Name FROM Players WHERE SteamGuid = ? AND ArtInt = 0").get(steamId);
    if (!player) { summary.servers[instance] = { laps: 0, sessions: 0 }; continue; }
    if (!playerName) playerName = player.Name;

    // Summary
    const stats = db.prepare(`
      SELECT COUNT(*) as totalLaps,
             SUM(CASE WHEN l.Valid = 1 THEN 1 ELSE 0 END) as validLaps,
             COUNT(DISTINCT pis.SessionId) as totalSessions,
             SUM(l.LapTime) as totalTime
      FROM Lap l
      JOIN PlayerInSession pis ON l.PlayerInSessionId = pis.PlayerInSessionId
      WHERE pis.PlayerId = ?
    `).get(player.PlayerId);

    const sLaps = stats?.totalLaps || 0;
    const sValid = stats?.validLaps || 0;
    const sSessions = stats?.totalSessions || 0;
    const sTime = stats?.totalTime || 0;

    summary.totalLaps += sLaps;
    summary.validLaps += sValid;
    summary.totalSessions += sSessions;
    summary.totalDrivingTimeMs += sTime;
    summary.servers[instance] = { laps: sLaps, sessions: sSessions };

    // Personal records: best valid lap per track
    const records = db.prepare(`
      SELECT t.Track as track, c.UiCarName as car, c.Car as carId,
             MIN(l.LapTime) as lapTime, l.Timestamp as timestamp
      FROM Lap l
      JOIN PlayerInSession pis ON l.PlayerInSessionId = pis.PlayerInSessionId
      JOIN Session s ON pis.SessionId = s.SessionId
      JOIN Tracks t ON s.TrackId = t.TrackId
      JOIN Cars c ON pis.CarId = c.CarId
      WHERE pis.PlayerId = ? AND l.Valid = 1
      GROUP BY t.TrackId
      ORDER BY lapTime
    `).all(player.PlayerId);

    for (const r of records) {
      personalRecords.push({ ...r, server: instance });
    }

    // Recent sessions (last 10)
    const sessions = db.prepare(`
      SELECT s.SessionType as type, t.Track as track,
             c.UiCarName as car, c.Car as carId,
             MIN(CASE WHEN l.Valid = 1 THEN l.LapTime END) as bestLap,
             COUNT(l.LapId) as laps,
             pis.FinishPosition as position,
             s.StartTimeDate as date
      FROM PlayerInSession pis
      JOIN Session s ON pis.SessionId = s.SessionId
      JOIN Tracks t ON s.TrackId = t.TrackId
      JOIN Cars c ON pis.CarId = c.CarId
      LEFT JOIN Lap l ON l.PlayerInSessionId = pis.PlayerInSessionId
      WHERE pis.PlayerId = ?
      GROUP BY pis.PlayerInSessionId
      ORDER BY s.StartTimeDate DESC
      LIMIT 10
    `).all(player.PlayerId);

    for (const s of sessions) {
      recentSessions.push({ ...s, server: instance });
    }

    // Favorite cars
    const cars = db.prepare(`
      SELECT c.UiCarName as car, c.Car as carId,
             COUNT(l.LapId) as laps,
             MIN(CASE WHEN l.Valid = 1 THEN l.LapTime END) as bestLapTime
      FROM Lap l
      JOIN PlayerInSession pis ON l.PlayerInSessionId = pis.PlayerInSessionId
      JOIN Cars c ON pis.CarId = c.CarId
      WHERE pis.PlayerId = ?
      GROUP BY c.CarId
    `).all(player.PlayerId);

    for (const c of cars) {
      if (carMap[c.carId]) {
        carMap[c.carId].laps += c.laps;
        if (c.bestLapTime && (!carMap[c.carId].bestLapTime || c.bestLapTime < carMap[c.carId].bestLapTime)) {
          carMap[c.carId].bestLapTime = c.bestLapTime;
        }
      } else {
        carMap[c.carId] = { car: c.car, carId: c.carId, laps: c.laps, bestLapTime: c.bestLapTime };
      }
    }
  }

  // Sort recent sessions by date desc, take top 10
  recentSessions.sort((a, b) => (b.date || 0) - (a.date || 0));
  const top10Sessions = recentSessions.slice(0, 10);

  // Top 5 favorite cars
  const favoriteCars = Object.values(carMap).sort((a, b) => b.laps - a.laps).slice(0, 5);

  // Steam profile
  const steam = await fetchSteamProfile(steamId);

  if (!playerName && !steam) {
    return res.status(404).json({ error: "Ingen data" });
  }

  // Server history (Phase 6)
  const serverHistory = {};
  for (const [instance, _path] of Object.entries(DB_PATHS)) {
    const db = getDb(instance);
    if (!db) continue;
    const player = db.prepare("SELECT PlayerId FROM Players WHERE SteamGuid = ? AND ArtInt = 0").get(steamId);
    if (!player) continue;
    const hist = db.prepare(`
      SELECT MIN(s.StartTimeDate) as firstVisit,
             MAX(s.StartTimeDate) as lastVisit,
             COUNT(DISTINCT s.SessionId) as totalVisits
      FROM PlayerInSession pis
      JOIN Session s ON pis.SessionId = s.SessionId
      WHERE pis.PlayerId = ?
    `).get(player.PlayerId);
    if (hist && hist.totalVisits > 0) {
      serverHistory[instance] = {
        firstVisit: hist.firstVisit,
        lastVisit: hist.lastVisit,
        totalVisits: hist.totalVisits,
      };
    }
  }

  const result = {
    steamId,
    name: steam?.name || playerName || "Unknown",
    avatar: steam?.avatar || "",
    profileUrl: steam?.profileUrl || `https://steamcommunity.com/profiles/${steamId}`,
    summary,
    personalRecords,
    recentSessions: top10Sessions,
    favoriteCars,
    serverHistory,
  };

  profileCache.set(cacheKey, { data: result, ts: Date.now() });
  res.json(result);
});

// ── Leaderboard endpoints (Phase 2) ──────────────────────────────────────────
const VALID_INSTANCES = ["trackday", "mx5cup", "gt3"];

app.get("/api/leaderboard/:instance", (req, res) => {
  const instance = req.params.instance;
  if (!VALID_INSTANCES.includes(instance)) return res.status(400).json({ error: "Invalid instance" });
  const db = getDb(instance);
  if (!db) return res.json([]);

  try {
    const rows = db.prepare(`
      SELECT p.Name as name, p.SteamGuid as steamGuid, c.UiCarName as car, c.Car as carId,
             t.Track as track, MIN(l.LapTime) as lapTime, l.Timestamp as timestamp
      FROM Lap l
      JOIN PlayerInSession pis ON l.PlayerInSessionId = pis.PlayerInSessionId
      JOIN Players p ON pis.PlayerId = p.PlayerId
      JOIN Cars c ON pis.CarId = c.CarId
      JOIN Session s ON pis.SessionId = s.SessionId
      JOIN Tracks t ON s.TrackId = t.TrackId
      WHERE l.Valid = 1 AND p.ArtInt = 0
      GROUP BY p.PlayerId, t.TrackId
      ORDER BY lapTime
      LIMIT 50
    `).all();
    res.json(rows);
  } catch { res.json([]); }
});

app.get("/api/leaderboard/:instance/:trackId", (req, res) => {
  const instance = req.params.instance;
  const trackId = req.params.trackId;
  if (!VALID_INSTANCES.includes(instance)) return res.status(400).json({ error: "Invalid instance" });
  const db = getDb(instance);
  if (!db) return res.json([]);

  try {
    const rows = db.prepare(`
      SELECT p.Name as name, p.SteamGuid as steamGuid, c.UiCarName as car, c.Car as carId,
             t.Track as track, MIN(l.LapTime) as lapTime, l.Timestamp as timestamp
      FROM Lap l
      JOIN PlayerInSession pis ON l.PlayerInSessionId = pis.PlayerInSessionId
      JOIN Players p ON pis.PlayerId = p.PlayerId
      JOIN Cars c ON pis.CarId = c.CarId
      JOIN Session s ON pis.SessionId = s.SessionId
      JOIN Tracks t ON s.TrackId = t.TrackId
      WHERE l.Valid = 1 AND p.ArtInt = 0 AND t.Track = ?
      GROUP BY p.PlayerId
      ORDER BY lapTime
      LIMIT 50
    `).all(trackId);
    res.json(rows);
  } catch { res.json([]); }
});

app.get("/api/tracks/:instance", (req, res) => {
  const instance = req.params.instance;
  if (!VALID_INSTANCES.includes(instance)) return res.status(400).json({ error: "Invalid instance" });
  const db = getDb(instance);
  if (!db) return res.json([]);

  try {
    const rows = db.prepare(`
      SELECT t.Track as track, COUNT(DISTINCT l.LapId) as lapCount,
             COUNT(DISTINCT p.PlayerId) as driverCount
      FROM Tracks t
      JOIN Session s ON s.TrackId = t.TrackId
      JOIN PlayerInSession pis ON pis.SessionId = s.SessionId
      JOIN Lap l ON l.PlayerInSessionId = pis.PlayerInSessionId
      JOIN Players p ON pis.PlayerId = p.PlayerId
      WHERE l.Valid = 1 AND p.ArtInt = 0
      GROUP BY t.TrackId
      ORDER BY lapCount DESC
    `).all();
    res.json(rows);
  } catch { res.json([]); }
});

// ── Race results endpoints (Phase 3) ────────────────────────────────────────
app.get("/api/results/:instance", (req, res) => {
  const instance = req.params.instance;
  if (!VALID_INSTANCES.includes(instance)) return res.status(400).json({ error: "Invalid instance" });
  const db = getDb(instance);
  if (!db) return res.json({ sessions: [], total: 0 });

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
  const offset = (page - 1) * limit;

  try {
    const total = db.prepare(`SELECT COUNT(*) as cnt FROM Session`).get()?.cnt || 0;
    const sessions = db.prepare(`
      SELECT s.SessionId as sessionId, s.SessionType as type, t.Track as track,
             s.StartTimeDate as startTime,
             COUNT(DISTINCT pis.PlayerId) as playerCount
      FROM Session s
      JOIN Tracks t ON s.TrackId = t.TrackId
      LEFT JOIN PlayerInSession pis ON pis.SessionId = s.SessionId
      GROUP BY s.SessionId
      ORDER BY s.StartTimeDate DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);
    res.json({ sessions, total, page, limit });
  } catch { res.json({ sessions: [], total: 0 }); }
});

app.get("/api/results/:instance/:sessionId", (req, res) => {
  const instance = req.params.instance;
  const sessionId = parseInt(req.params.sessionId);
  if (!VALID_INSTANCES.includes(instance)) return res.status(400).json({ error: "Invalid instance" });
  if (isNaN(sessionId)) return res.status(400).json({ error: "Invalid session ID" });
  const db = getDb(instance);
  if (!db) return res.status(404).json({ error: "DB not found" });

  try {
    const session = db.prepare(`
      SELECT s.SessionId as sessionId, s.SessionType as type, t.Track as track,
             s.StartTimeDate as startTime
      FROM Session s
      JOIN Tracks t ON s.TrackId = t.TrackId
      WHERE s.SessionId = ?
    `).get(sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });

    const results = db.prepare(`
      SELECT p.Name as name, p.SteamGuid as steamGuid,
             c.UiCarName as car, c.Car as carId,
             pis.FinishPosition as position,
             COUNT(l.LapId) as laps,
             MIN(CASE WHEN l.Valid = 1 THEN l.LapTime END) as bestLap,
             SUM(l.LapTime) as totalTime
      FROM PlayerInSession pis
      JOIN Players p ON pis.PlayerId = p.PlayerId
      JOIN Cars c ON pis.CarId = c.CarId
      LEFT JOIN Lap l ON l.PlayerInSessionId = pis.PlayerInSessionId
      WHERE pis.SessionId = ? AND p.ArtInt = 0
      GROUP BY pis.PlayerInSessionId
      ORDER BY pis.FinishPosition
    `).all(sessionId);

    res.json({ ...session, results });
  } catch { res.status(500).json({ error: "Query error" }); }
});

// ── Server health endpoint (Phase 4) ────────────────────────────────────────
const healthBuffer = { trackday: [], mx5cup: [], gt3: [] };
const HEALTH_BUFFER_SIZE = 1440; // 24h at 1min intervals

async function pingServer(id, port) {
  const start = Date.now();
  try {
    const resp = await fetch(`http://${AC_HOST}:${port}/INFO`, { signal: AbortSignal.timeout(5000) });
    const ms = Date.now() - start;
    return { ts: start, online: resp.ok, responseMs: ms };
  } catch {
    return { ts: start, online: false, responseMs: null };
  }
}

async function healthCheck() {
  const checks = [
    { id: "trackday", port: 9680 },
    { id: "mx5cup", port: 9690 },
    { id: "gt3", port: 9700 },
  ];
  for (const { id, port } of checks) {
    const result = await pingServer(id, port);
    healthBuffer[id].push(result);
    if (healthBuffer[id].length > HEALTH_BUFFER_SIZE) {
      healthBuffer[id].shift();
    }
  }
}

// Run health check every 60 seconds
healthCheck();
setInterval(healthCheck, 60000);

app.get("/api/health", (_req, res) => {
  const result = {};
  for (const id of VALID_INSTANCES) {
    const buf = healthBuffer[id];
    const latest = buf[buf.length - 1] || null;
    const onlineCount = buf.filter(b => b.online).length;
    const uptimePercent = buf.length > 0 ? ((onlineCount / buf.length) * 100).toFixed(1) : "0.0";
    result[id] = {
      online: latest?.online || false,
      responseMs: latest?.responseMs || null,
      uptimePercent,
      checks: buf.length,
    };
  }
  res.json(result);
});

// ── Paginated session history (Phase 5) ─────────────────────────────────────
app.get("/api/profile/:steamId/sessions", async (req, res) => {
  const steamId = req.params.steamId;
  if (!/^7656119\d{10}$/.test(steamId)) {
    return res.status(400).json({ error: "Invalid Steam ID" });
  }

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
  const serverFilter = req.query.server || null;
  const offset = (page - 1) * limit;

  const allSessions = [];

  const instances = serverFilter && VALID_INSTANCES.includes(serverFilter) ? [serverFilter] : VALID_INSTANCES;

  for (const instance of instances) {
    const db = getDb(instance);
    if (!db) continue;

    const player = db.prepare("SELECT PlayerId FROM Players WHERE SteamGuid = ? AND ArtInt = 0").get(steamId);
    if (!player) continue;

    const sessions = db.prepare(`
      SELECT s.SessionType as type, t.Track as track,
             c.UiCarName as car, c.Car as carId,
             MIN(CASE WHEN l.Valid = 1 THEN l.LapTime END) as bestLap,
             COUNT(l.LapId) as laps,
             pis.FinishPosition as position,
             s.StartTimeDate as date
      FROM PlayerInSession pis
      JOIN Session s ON pis.SessionId = s.SessionId
      JOIN Tracks t ON s.TrackId = t.TrackId
      JOIN Cars c ON pis.CarId = c.CarId
      LEFT JOIN Lap l ON l.PlayerInSessionId = pis.PlayerInSessionId
      WHERE pis.PlayerId = ?
      GROUP BY pis.PlayerInSessionId
      ORDER BY s.StartTimeDate DESC
    `).all(player.PlayerId);

    for (const s of sessions) {
      allSessions.push({ ...s, server: instance });
    }
  }

  allSessions.sort((a, b) => (b.date || 0) - (a.date || 0));
  const total = allSessions.length;
  const paginated = allSessions.slice(offset, offset + limit);

  res.json({ sessions: paginated, total, page, limit });
});

// ── Player search (Tier 3) ───────────────────────────────────────────────────
app.get("/api/search", (req, res) => {
  const q = (req.query.q || "").trim();
  if (q.length < 2) return res.status(400).json({ error: "Query too short" });

  const escaped = q.replace(/[\\%_]/g, c => "\\" + c);
  const pattern = `%${escaped}%`;
  const seen = new Map();

  for (const instance of VALID_INSTANCES) {
    const db = getDb(instance);
    if (!db) continue;
    const rows = db.prepare(
      "SELECT Name, SteamGuid FROM Players WHERE Name LIKE ? ESCAPE '\\' AND ArtInt = 0 LIMIT 20"
    ).all(pattern);
    for (const row of rows) {
      if (!row.SteamGuid) continue;
      if (seen.has(row.SteamGuid)) {
        seen.get(row.SteamGuid).servers.push(instance);
      } else {
        seen.set(row.SteamGuid, { name: row.Name, steamGuid: row.SteamGuid, servers: [instance] });
      }
    }
  }

  const results = [...seen.values()].slice(0, 10);
  res.json(results);
});

// ── Frontend ─────────────────────────────────────────────────────────────────
if (IS_PROD) {
  // Production: serve built static files from dist/
  const { default: serveStatic } = await import("serve-static");
  app.use(serveStatic(join(__dirname, "dist"), { index: "index.html" }));
  app.get("/{*splat}", (_req, res) => res.sendFile("index.html", { root: join(__dirname, "dist") }));
} else {
  // Dev: Vite middleware with HMR
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
}

app.listen(PORT, () => {
  console.log(`aCRacing: ${BASE_URL} (${IS_PROD ? "production" : "dev"})`);
  if (!STEAM_API_KEY) console.warn("WARNING: STEAM_API_KEY not set – Steam login disabled");
});
