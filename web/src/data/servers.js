// ── Server configuration and helpers ─────────────────────────────────────────

export const SERVER_IP = "46.225.176.106";

export const carBadgeSrc = (carId) => {
  const slug = carId.startsWith("ks_") ? carId.slice(3) : carId;
  return `${import.meta.env.BASE_URL}images/cars/badges/${slug}.png`;
};

export const uniqueBrands = (cars) => {
  const seen = new Set();
  return cars.filter(c => {
    const brand = c.name.split(" ")[0];
    if (seen.has(brand)) return false;
    seen.add(brand);
    return true;
  });
};

export const SERVER_TYPES = {
  trackday: { label: "Trackday", color: "#c084fc", bg: "rgba(192,132,252,0.12)" },
  mx5cup:   { label: "MX-5 Cup", color: "#e8861e", bg: "rgba(232,134,30,0.12)" },
  gt3:      { label: "GT3",      color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
};

export const NEWS = [
  { id: 1, dateKey: "news1date", titleKey: "news1title", descKey: "news1desc" },
  { id: 2, dateKey: "news2date", titleKey: "news2title", descKey: "news2desc" },
  { id: 3, dateKey: "news3date", titleKey: "news3title", descKey: "news3desc" },
];

export const SERVERS = [
  {
    id: "trackday", name: "Nordschleife Touristenfahrten", mode: "Practice",
    httpPort: 9680, gamePort: 9600, maxClients: 24,
    hasAI: true, hasWeather: true, trackRotation: false,
    sessionFormatKey: "freeRoam",
    cars: [
      { id: "abarth500", name: "Abarth 500" },
      { id: "ks_abarth_595ss", name: "Abarth 595 SS" },
      { id: "alfa_romeo_giulietta_qv", name: "Alfa Romeo Giulietta QV" },
      { id: "ks_audi_tt_cup", name: "Audi TT Cup" },
      { id: "ks_mazda_mx5_nd", name: "Mazda MX-5 ND" },
      { id: "ks_toyota_gt86", name: "Toyota GT86" },
      { id: "ks_nissan_370z", name: "Nissan 370Z" },
      { id: "ks_mazda_rx7_spirit_r", name: "Mazda RX-7 Spirit R" },
      { id: "ks_ford_mustang_2015", name: "Ford Mustang 2015" },
      { id: "lotus_elise_sc", name: "Lotus Elise SC" },
      { id: "lotus_exige_s", name: "Lotus Exige S" },
      { id: "bmw_m3_e30", name: "BMW M3 E30" },
      { id: "bmw_m3_e92", name: "BMW M3 E92" },
      { id: "ks_bmw_m4", name: "BMW M4" },
      { id: "ks_corvette_c7_stingray", name: "Corvette C7 Stingray" },
      { id: "ks_porsche_718_cayman_s", name: "Porsche 718 Cayman S" },
      { id: "ks_porsche_911_gt3_r_2016", name: "Porsche 911 GT3 R" },
      { id: "ks_ferrari_488_gtb", name: "Ferrari 488 GTB" },
    ],
  },
  {
    id: "mx5cup", name: "MX-5 Cup 2026", mode: "Race",
    httpPort: 9690, gamePort: 9610, maxClients: 20,
    hasAI: false, hasWeather: false, trackRotation: true,
    sessionFormatKey: "mx5Format",
    cars: [{ id: "ks_mazda_mx5_cup", name: "Mazda MX-5 Cup" }],
  },
  {
    id: "gt3", name: "GT3 Series 2026", mode: "Race",
    httpPort: 9700, gamePort: 9620, maxClients: 20,
    hasAI: false, hasWeather: false, trackRotation: true,
    sessionFormatKey: "gt3Format",
    cars: [
      { id: "ks_audi_r8_lms", name: "Audi R8 LMS" },
      { id: "ks_audi_r8_lms_2016", name: "Audi R8 LMS 2016" },
      { id: "ks_ferrari_488_gt3", name: "Ferrari 488 GT3" },
      { id: "ks_lamborghini_huracan_gt3", name: "Lamborghini Huracan GT3" },
      { id: "ks_mclaren_650_gt3", name: "McLaren 650S GT3" },
      { id: "ks_mercedes_amg_gt3", name: "Mercedes AMG GT3" },
      { id: "ks_nissan_gtr_gt3", name: "Nissan GT-R GT3" },
      { id: "ks_porsche_911_gt3_r_2016", name: "Porsche 911 GT3 R" },
      { id: "bmw_z4_gt3", name: "BMW Z4 GT3" },
      { id: "mercedes_sls_gt3", name: "Mercedes SLS GT3" },
    ],
  },
];

export const TRACK_NAMES = {
  "ks_nordschleife-touristenfahrten_ai": "Nordschleife TF (AI)",
  "ks_nordschleife": "Nordschleife",
  "rt_lime_rock_park-no_chicane": "Lime Rock Park (no chicane)",
  "rt_lime_rock_park": "Lime Rock Park",
  "ks_laguna_seca": "Laguna Seca",
  "okayama_international": "Okayama International",
  "summit_point": "Summit Point",
  "lilski_road_america": "Road America",
  "spa-2022": "Spa (2022)",
  "spa": "Spa-Francorchamps",
  "mx_sebring-raceday_standing": "Sebring (raceday)",
  "lilski_watkins_glen-boot": "Watkins Glen (boot)",
  "road_atlanta2018-grandprix": "Road Atlanta (GP)",
  "ks_zandvoort": "Zandvoort",
  "monza": "Monza",
  "ks_silverstone-gp": "Silverstone GP",
  "mugello": "Mugello",
  "ks_barcelona-layout_gp": "Barcelona GP",
  "ks_red_bull_ring-gp": "Red Bull Ring GP",
  "imola": "Imola",
  "ks_vallelunga-extended_circuit": "Vallelunga Ext.",
  "magione": "Magione",
};

export const SESSION_COLORS = {
  1: { bg: "rgba(192,132,252,0.08)", border: "rgba(192,132,252,0.15)", text: "#c084fc" },
  2: { bg: "rgba(59,154,254,0.08)", border: "rgba(59,154,254,0.15)", text: "#3b9afe" },
  3: { bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.15)", text: "#22c55e" },
};

export const MX5_ROTATION = [
  { track: "rt_lime_rock_park", config: "no_chicane", name: "Lime Rock Park (no chicane)" },
  { track: "ks_laguna_seca", config: "", name: "Laguna Seca" },
  { track: "okayama_international", config: "", name: "Okayama International" },
  { track: "summit_point", config: "", name: "Summit Point" },
];

export const GT3_ROTATION = [
  { track: "lilski_road_america", config: "", name: "Road America" },
  { track: "spa", config: "2022", name: "Spa (2022)" },
  { track: "mx_sebring", config: "raceday_standing", name: "Sebring (raceday)" },
  { track: "lilski_watkins_glen", config: "boot", name: "Watkins Glen (boot)" },
  { track: "road_atlanta2018", config: "grandprix", name: "Road Atlanta (GP)" },
  { track: "ks_zandvoort", config: "", name: "Zandvoort" },
];

export const STATS_PORTS = { trackday: 8081, mx5cup: 8082, gt3: 8083 };

export const LIVE_VIEWS = [
  { id: "live-timing",  path: "/live-timing",  labelKey: "liveTabTiming" },
  { id: "results",      path: "/results",      labelKey: "liveTabResults" },
  { id: "race-control", path: "/race-control", labelKey: "liveTabRaceControl" },
  { id: "cars",         path: "/cars",          labelKey: "liveTabCars" },
  { id: "tracks",       path: "/tracks",        labelKey: "liveTabTracks" },
];

export const NAV = [
  { id: "home", icon: "\u229E", path: "/" },
  {
    sectionKey: "sidebarServers",
    items: [
      { id: "servers",  icon: "\u2691", path: "/servers" },
      { id: "schedule", icon: "\u2261", path: "/schedule" },
    ],
  },
  {
    sectionKey: "sidebarTools",
    items: [
      { id: "testdrive",   icon: "\u2B21", path: "/testdrive" },
      { id: "leaderboard", icon: "\u{1F3C6}", path: "/leaderboard" },
      { id: "results",     icon: "\u25A3", path: "/results" },
      { id: "standings",   icon: "\u2605", path: "/standings" },
      { id: "calendar",    icon: "\u25A1", path: "/calendar" },
      { id: "stats",       icon: "\u223F", path: "/stats" },
      { id: "live",        icon: "\u25B6", path: "/live" },
    ],
  },
];

export const TABS = [
  { id: "home",      icon: "\u229E", path: "/" },
  { id: "servers",   icon: "\u2691", path: "/servers" },
  { id: "testdrive", icon: "\u2B21", path: "/testdrive" },
  { id: "stats",     icon: "\u223F", path: "/stats" },
  { id: "live",      icon: "\u25B6", path: "/live" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

export function trackDisplayName(raw) {
  if (!raw) return "?";
  if (TRACK_NAMES[raw]) return TRACK_NAMES[raw];
  return raw.replace(/-/g, " \u2014 ").replace(/_/g, " ");
}

export function formatTimeLeft(ms) {
  if (!ms || ms <= 0) return "0:00";
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function getSessionInfo(data, t) {
  if (!data || !data.sessiontypes) return null;
  const idx = data.session;
  if (idx < 0 || idx >= data.sessiontypes.length) return null;
  const type = data.sessiontypes[idx];
  const name = type === 1 ? t("practice") : type === 2 ? t("qualifying") : type === 3 ? t("race") : `Session ${type}`;
  const colors = SESSION_COLORS[type] || SESSION_COLORS[1];
  let timeDisplay = "";
  if (data.timed && data.timeleft > 0) {
    timeDisplay = formatTimeLeft(data.timeleft);
  } else if (!data.timed && data.durations && data.durations[idx]) {
    const dur = data.durations[idx];
    if (type === 3) {
      timeDisplay = `${dur} ${t("rounds")}`;
    } else {
      timeDisplay = formatTimeLeft(data.timeleft);
    }
  }
  return { type, name, colors, timeDisplay };
}

export function getNextSession(data, t) {
  if (!data || !data.sessiontypes || data.sessiontypes.length <= 1) return null;
  const idx = data.session;
  const nextIdx = (idx + 1) % data.sessiontypes.length;
  const nextType = data.sessiontypes[nextIdx];
  const nextName = nextType === 1 ? t("practice") : nextType === 2 ? t("qualifying") : nextType === 3 ? t("race") : `Session ${nextType}`;
  const nextColors = SESSION_COLORS[nextType] || SESSION_COLORS[1];
  let startsIn = "";
  if (data.timed && data.timeleft > 0) {
    startsIn = formatTimeLeft(data.timeleft);
  }
  return { type: nextType, name: nextName, colors: nextColors, startsIn };
}

export function getTodaysTrack(rotation) {
  const d = new Date();
  let dow = d.getDay();
  dow = dow === 0 ? 7 : dow;
  return rotation[(dow - 1) % rotation.length];
}

export function getDomain() {
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return null;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return null;
  const parts = host.split(".");
  if (parts.length >= 2) return parts.slice(-2).join(".");
  return host;
}

export function getStatsUrl(serverId) {
  const domain = getDomain();
  if (domain) return `https://stats.${domain}/${serverId}`;
  return `http://${SERVER_IP}:${STATS_PORTS[serverId] || 8081}`;
}

export function getAcsmUrl(path) {
  const domain = getDomain();
  if (domain) return `https://live.${domain}${path}`;
  return `http://${SERVER_IP}:8772${path}`;
}

export function getLiveUrl() {
  return getAcsmUrl("/live-timing");
}

export function getJoinUrl(httpPort) {
  return `acmanager://race/online/join?ip=${SERVER_IP}&httpPort=${httpPort}`;
}

export function getStatusType(status) {
  if (status.loading) return "loading";
  if (status.online) return "online";
  return "offline";
}

export function formatLapTime(ms) {
  if (!ms || ms <= 0) return "-";
  const mins = Math.floor(ms / 60000);
  const secs = ((ms % 60000) / 1000).toFixed(3);
  return `${mins}:${secs.padStart(6, "0")}`;
}

export function formatStatsDate(ts) {
  if (!ts) return "-";
  const d = new Date(ts * 1000);
  return d.toLocaleDateString("nb-NO", { day: "numeric", month: "short" });
}

export function formatDrivingTime(ms) {
  if (!ms) return "0m";
  const hours = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  if (hours > 0) return `${hours}t ${mins}m`;
  return `${mins}m`;
}
