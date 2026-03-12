# Tier 3 Top 5 Features — Design Spec

**Date:** 2026-03-12
**Scope:** 5 independent features built sequentially
**Build order:** Rate Limiting → Player Search → Points System → Notification Settings → Inline Live Data

---

## 1. API Rate Limiting (#100)

### Goal
Protect the Express backend from abuse before adding new queryable endpoints.

### Design
Add `express-rate-limit` as a dependency. Define three middleware instances applied to route groups in `server.js`.

**Prerequisites:**
- Add `app.set('trust proxy', 1)` before middleware — the app runs behind Caddy in production, so without this all requests appear from 127.0.0.1 and share one rate limit bucket.
- Use `standardHeaders: 'draft-7'` to send standard `RateLimit-*` headers.
- Key generator: `req.ip` (IP-based limiting).

**Rate limit tiers:**

| Tier | Endpoints | Window | Max Requests |
|------|-----------|--------|-------------|
| Relaxed | `/api/trackday`, `/api/mx5cup`, `/api/gt3`, `/api/health`, `/api/live/*` | 1 min | 120 |
| Standard | `/api/leaderboard/*`, `/api/results/*`, `/api/tracks/*`, `/api/profile/*`, `/api/search`, `/api/standings/*` | 1 min | 30 |
| Auth | `/auth/steam`, `/auth/steam/callback`, `/auth/logout` | 15 min | 10 |

Note: `/auth/profile` (session check, called on every page load) goes under Relaxed, not Auth, to avoid locking users out of their own session.

On limit exceeded: HTTP 429 with `{ error: "Too many requests", retryAfter: <seconds> }`.

**Frontend:** Add i18n key `tooManyRequests` for user-facing 429 error display.

### Files Changed
- `web/server.js` — add `trust proxy`, rate limit middleware after session middleware
- `web/package.json` — add `express-rate-limit` dependency
- `web/src/i18n.js` — add `tooManyRequests` key

---

## 2. Player Search (#35)

### Goal
Autocomplete search to find players by name and navigate to their profile.

### Backend
New endpoint: `GET /api/search?q=<name>&limit=10`

- Minimum 2 characters required; returns 400 otherwise
- Queries all 3 stracker DBs using parameterized statements:
  ```sql
  SELECT Name, SteamGuid FROM Players
  WHERE Name LIKE ? AND ArtInt = 0
  LIMIT 20
  ```
  Parameter value: `%${escapedQuery}%` where LIKE wildcards (`%`, `_`) in user input are escaped with `\` and `ESCAPE '\'` is appended to the query.
- Fetches up to 20 rows per DB (60 max) to allow for deduplication, then deduplicates by SteamGuid and returns max 10 results
- Response: `[{ name: string, steamGuid: string, servers: string[] }]`
- Protected by Standard rate limit tier

### Frontend
New standalone file: `components/shared/PlayerSearch.jsx` (separate from `shared/index.jsx` because it is substantially larger than the simple utility components there — not re-exported through the index).

- Search input with dropdown overlay
- Placed in `DesktopTopBar` and `MobileHeader` (behind magnifying glass icon toggle on mobile)
- Debounced fetch on 2+ characters (300ms delay)
- Loading spinner shown while fetch is in flight
- Dropdown items show player name + server badges (reuse `ServerBadge` from shared)
- **Keyboard navigation:** arrow keys to move selection, Enter to navigate to selected profile, Escape to close
- Click navigates to `/profile/:steamGuid`
- Click-outside closes dropdown

### i18n Keys
- `searchPlayers` — placeholder text
- `noPlayersFound` — empty state
- `searchMinChars` — "Type 2+ characters"
- `searching` — "Searching..."

### Files Changed
- `web/server.js` — new `/api/search` endpoint
- `web/src/components/shared/PlayerSearch.jsx` — new component
- `web/src/components/layout/DesktopTopBar.jsx` — add PlayerSearch
- `web/src/components/layout/MobileHeader.jsx` — add PlayerSearch with toggle
- `web/src/i18n.js` — new keys

---

## 3. Points System (#54)

### Goal
F1-style championship standings computed from existing race results.

### Scoring
F1 points constant: `[25, 18, 15, 12, 10, 8, 6, 4, 2, 1]` — index maps to position-1.

- `FinishPosition` in stracker is 1-based (1 = winner). Values >= 1000 or NULL indicate DNF/DNS — these receive 0 points.
- +1 bonus point for the fastest valid lap in a race session.
- Races with fewer than 10 finishers: only finishers receive points.

### Fastest Lap SQL Approach
```sql
-- For each race session, find the fastest valid lap across all participants:
SELECT pis.PlayerId,
       MIN(l.LapTime) as fastestLap
FROM Lap l
JOIN PlayerInSession pis ON l.PlayerInSessionId = pis.PlayerInSessionId
WHERE pis.SessionId = ? AND l.Valid = 1
GROUP BY pis.PlayerId
ORDER BY fastestLap ASC
LIMIT 1
```
The player returned gets +1 bonus point for that race. On ties, the first player found wins the bonus (arbitrary — matches F1 convention of awarding to whoever set it first).

### Default Time Range
Without `from`/`to` params, standings default to the **current calendar month** (midnight on the 1st through now). This gives natural monthly seasons. The frontend shows a month selector.

### Backend
Two new endpoints:

**`GET /api/standings/:instance?from=<ts>&to=<ts>`**
- Only valid for `mx5cup` and `gt3` (returns 400 for `trackday`)
- Steps:
  1. Find all Race sessions (`SessionType = 'Race'`) in the date range
  2. For each race, get all participants with `FinishPosition`
  3. Map position to F1 points (0 for DNF/positions > 10)
  4. Identify fastest valid lap bonus per race
  5. Aggregate per player: total points, race count, wins (pos=1), podiums (pos<=3), FL bonus count
- Response sorted by total points descending
- Cached with 5-minute TTL (same `Map` pattern as profile cache)

**`GET /api/standings/:instance/:steamId?from=<ts>&to=<ts>`**
- Race-by-race breakdown for one driver
- Returns: `[{ track, date, position, points, fastestLapBonus: bool, bestLap }]`

### Frontend
New screen: `components/screens/StandingsScreen.jsx` at route `/standings`

- Server tabs: mx5cup, gt3 only (trackday hidden since it has no races)
- Month selector dropdown (current month default)
- Standings table: Position, Driver (clickable → profile), Points, Races, Wins, Podiums, FL Bonus
- Gold/silver/bronze styling for top 3 (existing pattern from LeaderboardScreen)
- Click driver row to expand inline race-by-race breakdown
- Add to `NAV` under "sidebarTools" section with icon `🏆` and id `standings`
- Mobile: Do NOT add to `TABS` (already 5 tabs, adding a 6th crowds mobile) — accessible via sidebar menu or direct URL

### i18n Keys
- `standings` — page title / nav label
- `points` — "Points" column header
- `wins` — "Wins"
- `podiums` — "Podiums"
- `fastestLap` — "Fastest Lap"
- `noStandings` — empty state
- `month` — "Month"

### Files Changed
- `web/server.js` — two new endpoints + F1_POINTS constant + cache
- `web/src/components/screens/StandingsScreen.jsx` — new screen
- `web/src/data/servers.js` — add to NAV (not TABS)
- `web/src/App.jsx` — add route, import, title
- `web/src/i18n.js` — new keys

---

## 4. Notification Settings (#77)

### Goal
Granular notification preferences: per-server toggles, timing, notification types, quiet hours.

### State Management — Single Source of Truth
**Problem:** Currently notification prefs are read independently in 3 places (`useRaceNotifications` in App.jsx, `useNotifPrefs` in ServersScreen.jsx, and the new NotificationSettings component).

**Solution:** Extract a new shared hook `hooks/useNotificationSettings.js` that:
- Reads/writes the new settings format from `localStorage("acr-notification-settings")`
- Handles migration from old `acr-notifications` format on first load
- Returns `{ settings, updateSettings, toggleServer }`
- All consumers import this hook — no direct localStorage access elsewhere

**Migration defaults:** When old format `{ mx5cup: true }` is detected, migrate to: `{ servers: { mx5cup: true }, minutesBefore: 10, types: { raceStart: true, qualifyEnd: true, personalRecord: true }, quietHours: { enabled: false, from: "23:00", to: "07:00" } }`. Delete old `acr-notifications` key after migration.

### Settings Structure
```json
{
  "servers": { "mx5cup": true, "gt3": true },
  "minutesBefore": 10,
  "types": {
    "raceStart": true,
    "qualifyEnd": true,
    "personalRecord": true
  },
  "quietHours": {
    "enabled": false,
    "from": "23:00",
    "to": "07:00"
  }
}
```

### Backend
New endpoint: `GET /api/profile/:steamId/records-check?since=<timestamp>`

- SQL approach:
  ```sql
  -- Find laps that are personal bests AND were set after the given timestamp
  SELECT t.Track, c.UiCarName as car, l.LapTime, l.Timestamp
  FROM Lap l
  JOIN PlayerInSession pis ON l.PlayerInSessionId = pis.PlayerInSessionId
  JOIN Session s ON pis.SessionId = s.SessionId
  JOIN Tracks t ON s.TrackId = t.TrackId
  JOIN Cars c ON pis.CarId = c.CarId
  WHERE pis.PlayerId = ? AND l.Valid = 1 AND l.Timestamp > ?
    AND l.LapTime = (
      SELECT MIN(l2.LapTime) FROM Lap l2
      JOIN PlayerInSession pis2 ON l2.PlayerInSessionId = pis2.PlayerInSessionId
      JOIN Session s2 ON pis2.SessionId = s2.SessionId
      WHERE pis2.PlayerId = ? AND s2.TrackId = s.TrackId AND l2.Valid = 1
    )
  ```
- Polling interval: **5 minutes** (not 60s — reduces DB load significantly; personal records don't need instant notification)
- Note: the PlayerId parameter appears twice in the query (outer WHERE + subquery) — bind as `.all(playerId, timestamp, playerId)`
- Only polled when user is logged in AND `personalRecord` type is enabled
- Protected by Standard rate limit

### Frontend

**New hook:** `hooks/useNotificationSettings.js`
- Single source of truth for all notification settings
- Handles old→new format migration
- Used by ServersScreen, App.jsx, and NotificationSettings component

**New component:** `components/shared/NotificationSettings.jsx`
- Per-server toggle switches (mx5cup, gt3)
- "Minutes before race" selector: 5 / 10 / 15 / 20
- Notification type checkboxes: race start, qualifying end, personal record
- Quiet hours: toggle + from/to time inputs
- Rendered in ProfileScreen settings section (own profile only)

**Update `useRaceNotifications` in App.jsx:**
- Import from `useNotificationSettings` instead of direct localStorage reads
- Respect `minutesBefore` (currently hardcoded to 10 min)
- Respect `quietHours` — suppress notifications during quiet window
- Qualifying-end notification: fires when `qualifyEnd` type is enabled AND qualifying has < N min left AND next session is race (replaces the current always-on behavior, making it toggleable)
- Add personal record polling (every 5 min when enabled + logged in)
- Fix hardcoded Norwegian notification text → use i18n `t()` function

**Remove:** `useNotifPrefs` from ServersScreen.jsx — replace with `useNotificationSettings`

### i18n Keys
- `notificationSettings` — section title
- `minutesBefore` — "Minutes before"
- `raceStartNotif` — "Race starting"
- `qualifyEndNotif` — "Qualifying ending"
- `personalRecordNotif` — "New personal record"
- `quietHours` — "Quiet hours"
- `quietFrom` — "From"
- `quietTo` — "To"
- `newRecord` — notification body text for personal records

### Files Changed
- `web/server.js` — new `/api/profile/:steamId/records-check` endpoint
- `web/src/hooks/useNotificationSettings.js` — new shared hook (single source of truth)
- `web/src/components/shared/NotificationSettings.jsx` — new component
- `web/src/components/screens/ProfileScreen.jsx` — render NotificationSettings
- `web/src/components/screens/ServersScreen.jsx` — replace `useNotifPrefs` with `useNotificationSettings`
- `web/src/App.jsx` — update `useRaceNotifications` to use shared hook
- `web/src/i18n.js` — new keys

---

## 5. Inline Live Data (#68)

### Goal
Replace iframe-only live timing with native UI showing real-time driver positions and session data.

### Primary Approach: Enriched /INFO Proxy
Rather than depending on an uninvestigated AC Live Timings API, the primary design uses the existing AC server `/INFO` endpoint (already proxied) as the data source. This provides: players connected, track, session type, time left, max clients.

**Enhancement:** Additionally proxy the `/ENTRY_LIST` endpoint from each AC server (if available — AssettoServer typically exposes this) for connected driver names and cars.

If AC Live Timings REST/WebSocket API is discovered during implementation to provide richer data (positions, gaps, lap times), the `/api/live/:instance` endpoint can be upgraded to proxy that instead — the frontend response shape stays the same.

### Backend
New endpoint: `GET /api/live/:instance`

- Proxies AC server `/INFO` + `/ENTRY_LIST` (if available), combines into structured response
- Server-side cache: refresh every 3 seconds (not per-request) to avoid hammering AC servers
- Response shape:
  ```json
  {
    "session": { "type": "Race", "timeLeft": 342000, "track": "spa" },
    "drivers": [
      { "name": "Driver", "car": "BMW M4 GT3", "connected": true }
    ],
    "driverCount": 5,
    "maxClients": 24
  }
  ```
- If richer data becomes available (positions, gaps, best lap), extend the response — frontend handles missing fields gracefully
- If `/ENTRY_LIST` returns 404, return response with empty `drivers` array and data from `/INFO` only
- Placed in Relaxed rate limit tier (polled frequently)

### Frontend

**New hook:** `hooks/useLiveData.js`
- Polls `/api/live/:instance` every 5 seconds (not 2-3s — respects Relaxed tier limit of 120/min with 3 instances = 36/min)
- Returns `{ data, loading, error }` per instance
- Auto-pauses when `document.hidden` is true
- Shared across components: if HomeScreen and LiveScreen both mount, they share the same poll (use a module-level cache/singleton to deduplicate)

**New component:** `components/shared/LiveWidget.jsx`
- Compact card: session type badge, driver count, leader name (if available), session timer
- Used on HomeScreen in the server cards area

**LiveScreen redesign:**
- **Dashboard tab** (new default): Native cards per server showing driver list, session info, auto-refreshing
- **Map tab**: Existing AC Live Timings iframe — consolidates current 5 sub-tabs into a single iframe tab with a URL selector dropdown for Live Timing / Results / Race Control / Cars / Tracks views
- This replaces the current 5-tab iframe layout with a cleaner 2-tab layout

### i18n Keys
- `liveNow` — "Live Now"
- `liveMap` — "Track Map"
- `liveDashboard` — "Dashboard"
- `gap` — "Gap"
- `lastLap` — "Last Lap"
- `leader` — "Leader"
- `noLiveData` — "No live data available"
- `liveView` — "View" (for the iframe URL selector)

### Files Changed
- `web/server.js` — new `/api/live/:instance` endpoint with server-side caching
- `web/src/hooks/useLiveData.js` — new hook with deduplication
- `web/src/components/shared/LiveWidget.jsx` — new compact widget
- `web/src/components/screens/LiveScreen.jsx` — redesign with dashboard + map tabs
- `web/src/components/screens/HomeScreen.jsx` — add LiveWidget to server cards
- `web/src/i18n.js` — new keys

---

## Cross-cutting Concerns

### New Dependencies
- `express-rate-limit` — rate limiting middleware

### Route Organization
`server.js` is approaching 600 lines and will grow further. While not blocking this work, a future refactoring into `routes/` modules (auth, api, proxy) should be considered. For now, new endpoints follow the existing flat structure for consistency.

### Error Handling
New endpoints follow the explicit error response pattern: return `{ error: "message" }` with appropriate HTTP status codes. No empty catch blocks.

### Build Order Rationale
1. **Rate limiting** — must be in place before new endpoints go live
2. **Player search** — standalone, no dependencies on other features
3. **Points system** — standalone, uses existing DB data
4. **Notification settings** — extends existing notification hook
5. **Inline live data** — enriched /INFO approach avoids the AC Live Timings discovery risk

### Verification Per Feature
1. `npm run lint` — 0 errors
2. `npm run build` — production build succeeds
3. `npm run dev` — manual browser test
4. Test existing features still work (regression)
