import { useState, useEffect, useCallback, createContext, useContext } from "react";

// ── PALETTE (dark navy-blue theme) ──────────────────────────────────────────
const C = {
  bg:         "#080c14",
  bgDark:     "#060910",
  bgDarker:   "#040710",
  bgCard:     "#0c1120",
  bgHover:    "#111828",
  bgActive:   "#0f1a2e",
  border:     "#1a2640",
  borderSub:  "#101828",
  blue:       "#1a6bc4",
  blueHov:    "#2278d4",
  blueBright: "#3b9afe",
  blueDim:    "#0f3a6e",
  orange:     "#e8861e",
  orangeHov:  "#f59332",
  orangeDim:  "#7a3f08",
  green:      "#22c55e",
  greenDim:   "#14532d",
  red:        "#ef4444",
  yellow:     "#eab308",
  purple:     "#c084fc",
  white:      "#f0f4ff",
  text:       "#bcc8e0",
  textDim:    "#5d7099",
  textMuted:  "#2e3f5e",
};

// ── CAR BADGE HELPER ────────────────────────────────────────────────────────
const carBadgeSrc = (carId) => {
  const slug = carId.startsWith("ks_") ? carId.slice(3) : carId;
  return `${import.meta.env.BASE_URL}images/cars/badges/${slug}.png`;
};

const uniqueBrands = (cars) => {
  const seen = new Set();
  return cars.filter(c => {
    const brand = c.name.split(" ")[0];
    if (seen.has(brand)) return false;
    seen.add(brand);
    return true;
  });
};

// ── SERVER TYPE BADGES ──────────────────────────────────────────────────────
const SERVER_TYPES = {
  trackday: { label: "Trackday", color: "#c084fc", bg: "rgba(192,132,252,0.12)" },
  mx5cup:   { label: "MX-5 Cup", color: "#e8861e", bg: "rgba(232,134,30,0.12)" },
  gt3:      { label: "GT3",      color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
};

// ── NEWS / UPDATES ─────────────────────────────────────────────────────────
const NEWS = [
  { id: 1, dateKey: "news1date", titleKey: "news1title", descKey: "news1desc" },
  { id: 2, dateKey: "news2date", titleKey: "news2title", descKey: "news2desc" },
  { id: 3, dateKey: "news3date", titleKey: "news3title", descKey: "news3desc" },
];

// ── SERVER CONFIGURATION ────────────────────────────────────────────────────
const SERVER_IP = "46.225.176.106";

const SERVERS = [
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

const TRACK_NAMES = {
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

const SESSION_COLORS = {
  1: { bg: "rgba(192,132,252,0.08)", border: "rgba(192,132,252,0.15)", text: C.purple },
  2: { bg: "rgba(59,154,254,0.08)", border: "rgba(59,154,254,0.15)", text: C.blueBright },
  3: { bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.15)", text: C.green },
};

const MX5_ROTATION = [
  { track: "rt_lime_rock_park", config: "no_chicane", name: "Lime Rock Park (no chicane)" },
  { track: "ks_laguna_seca", config: "", name: "Laguna Seca" },
  { track: "okayama_international", config: "", name: "Okayama International" },
  { track: "summit_point", config: "", name: "Summit Point" },
];

const GT3_ROTATION = [
  { track: "lilski_road_america", config: "", name: "Road America" },
  { track: "spa", config: "2022", name: "Spa (2022)" },
  { track: "mx_sebring", config: "raceday_standing", name: "Sebring (raceday)" },
  { track: "lilski_watkins_glen", config: "boot", name: "Watkins Glen (boot)" },
  { track: "road_atlanta2018", config: "grandprix", name: "Road Atlanta (GP)" },
  { track: "ks_zandvoort", config: "", name: "Zandvoort" },
];

// ── TEST DRIVE DATA ─────────────────────────────────────────────────────────
const TD_CARS = [
  // Street
  { id: "abarth500", name: "Abarth 500", cat: "street" },
  { id: "ks_abarth_595ss", name: "Abarth 595 SS", cat: "street" },
  { id: "alfa_romeo_giulietta_qv", name: "Alfa Romeo Giulietta QV", cat: "street" },
  { id: "ks_toyota_gt86", name: "Toyota GT86", cat: "street" },
  { id: "ks_mazda_mx5_nd", name: "Mazda MX-5 ND", cat: "street" },
  { id: "ks_audi_tt_cup", name: "Audi TT Cup", cat: "street" },
  { id: "bmw_m3_e30", name: "BMW M3 E30", cat: "street" },
  { id: "bmw_m3_e92", name: "BMW M3 E92", cat: "street" },
  { id: "ks_bmw_m4", name: "BMW M4", cat: "street" },
  { id: "lotus_elise_sc", name: "Lotus Elise SC", cat: "street" },
  { id: "ks_porsche_718_cayman_s", name: "Porsche 718 Cayman S", cat: "street" },
  // Cup
  { id: "ks_mazda_mx5_cup", name: "Mazda MX-5 Cup", cat: "cup" },
  // GT3
  { id: "ks_audi_r8_lms", name: "Audi R8 LMS", cat: "gt3" },
  { id: "ks_audi_r8_lms_2016", name: "Audi R8 LMS 2016", cat: "gt3" },
  { id: "ks_ferrari_488_gt3", name: "Ferrari 488 GT3", cat: "gt3" },
  { id: "ks_lamborghini_huracan_gt3", name: "Lamborghini Huracan GT3", cat: "gt3" },
  { id: "ks_mclaren_650_gt3", name: "McLaren 650S GT3", cat: "gt3" },
  { id: "ks_mercedes_amg_gt3", name: "Mercedes AMG GT3", cat: "gt3" },
  { id: "ks_nissan_gtr_gt3", name: "Nissan GT-R GT3", cat: "gt3" },
  { id: "ks_porsche_911_gt3_r_2016", name: "Porsche 911 GT3 R", cat: "gt3" },
  { id: "bmw_z4_gt3", name: "BMW Z4 GT3", cat: "gt3" },
  { id: "mercedes_sls_gt3", name: "Mercedes SLS GT3", cat: "gt3" },
  // GT
  { id: "ks_ferrari_488_gtb", name: "Ferrari 488 GTB", cat: "gt" },
  { id: "ks_lamborghini_huracan_performante", name: "Lamborghini Huracan Performante", cat: "gt" },
  { id: "ks_porsche_911_gt3_cup_2017", name: "Porsche 911 GT3 Cup", cat: "gt" },
  { id: "ks_corvette_c7_stingray", name: "Corvette C7 Stingray", cat: "gt" },
  // Open wheel
  { id: "ks_lotus_49", name: "Lotus 49", cat: "openwheel" },
  { id: "ks_lotus_72d", name: "Lotus 72D", cat: "openwheel" },
  { id: "ks_ferrari_sf15t", name: "Ferrari SF15-T", cat: "openwheel" },
];

const TD_TRACKS = [
  { id: "ks_nordschleife", name: "Nordschleife", country: "\uD83C\uDDE9\uD83C\uDDEA", configs: [{ config: "touristenfahrten", label: "TF" }], cat: "circuit" },
  { id: "rt_lime_rock_park", name: "Lime Rock Park", country: "\uD83C\uDDFA\uD83C\uDDF8", configs: [{ config: "no_chicane", label: "No Chicane" }], cat: "circuit" },
  { id: "ks_laguna_seca", name: "Laguna Seca", country: "\uD83C\uDDFA\uD83C\uDDF8", configs: [{ config: "", label: "Full" }], cat: "circuit" },
  { id: "okayama_international", name: "Okayama International", country: "\uD83C\uDDEF\uD83C\uDDF5", configs: [{ config: "", label: "Full" }], cat: "circuit" },
  { id: "summit_point", name: "Summit Point", country: "\uD83C\uDDFA\uD83C\uDDF8", configs: [{ config: "", label: "Full" }], cat: "circuit" },
  { id: "spa", name: "Spa-Francorchamps", country: "\uD83C\uDDE7\uD83C\uDDEA", configs: [{ config: "", label: "Full" }], cat: "circuit" },
  { id: "ks_zandvoort", name: "Zandvoort", country: "\uD83C\uDDF3\uD83C\uDDF1", configs: [{ config: "", label: "Full" }], cat: "circuit" },
  { id: "monza", name: "Monza", country: "\uD83C\uDDEE\uD83C\uDDF9", configs: [{ config: "", label: "Full" }], cat: "circuit" },
  { id: "ks_silverstone", name: "Silverstone", country: "\uD83C\uDDEC\uD83C\uDDE7", configs: [{ config: "gp", label: "GP" }], cat: "circuit" },
  { id: "mugello", name: "Mugello", country: "\uD83C\uDDEE\uD83C\uDDF9", configs: [{ config: "", label: "Full" }], cat: "circuit" },
  { id: "ks_barcelona", name: "Barcelona", country: "\uD83C\uDDEA\uD83C\uDDF8", configs: [{ config: "layout_gp", label: "GP" }], cat: "circuit" },
  { id: "ks_red_bull_ring", name: "Red Bull Ring", country: "\uD83C\uDDE6\uD83C\uDDF9", configs: [{ config: "gp", label: "GP" }], cat: "circuit" },
  { id: "imola", name: "Imola", country: "\uD83C\uDDEE\uD83C\uDDF9", configs: [{ config: "", label: "Full" }], cat: "circuit" },
  { id: "ks_vallelunga", name: "Vallelunga", country: "\uD83C\uDDEE\uD83C\uDDF9", configs: [{ config: "extended_circuit", label: "Extended" }, { config: "club", label: "Club" }], cat: "circuit" },
  { id: "ks_brands_hatch", name: "Brands Hatch", country: "\uD83C\uDDEC\uD83C\uDDE7", configs: [{ config: "gp", label: "GP" }, { config: "indy", label: "Indy" }], cat: "circuit" },
  { id: "ks_nurburgring", name: "N\u00fcrburgring", country: "\uD83C\uDDE9\uD83C\uDDEA", configs: [{ config: "gp", label: "GP" }], cat: "circuit" },
  { id: "magione", name: "Magione", country: "\uD83C\uDDEE\uD83C\uDDF9", configs: [{ config: "", label: "Full" }], cat: "short" },
];

const TD_TIME_PRESETS = [
  { id: "dawn", hour: 6 },
  { id: "morning", hour: 8 },
  { id: "afternoon", hour: 14 },
  { id: "sunset", hour: 18 },
  { id: "evening", hour: 19 },
  { id: "night", hour: 22 },
];

const TD_WEATHER_PRESETS = [
  { id: "clear", graphics: "3_clear", emoji: "\u2600\uFE0F" },
  { id: "cloudy", graphics: "6_mid_clear", emoji: "\u26C5" },
  { id: "lightrain", graphics: "11_heavy_clouds_small_rain", emoji: "\uD83C\uDF26" },
  { id: "rain", graphics: "14_heavy_clouds", emoji: "\uD83C\uDF27" },
  { id: "dynamic", graphics: "3_clear", emoji: "\uD83C\uDF24" },
];

// ── STRINGS (i18n) ──────────────────────────────────────────────────────────
const STRINGS = {
  no: {
    // Nav
    home: "Hjem", servers: "Servere", schedule: "Baneplan",
    stats: "Statistikk", live: "Live Kart", liveMobile: "Live",

    // Sidebar
    brand: "ASSETTO CORSA",

    // TopBar
    players: "Spillere:", connected: "Tilkoblet", disconnected: "Frakoblet",
    online: "online",

    // Home hero
    heroSub: "Assetto Corsa dedikerte servere",
    heroDesc: "3 servere med AI-trafikk, dynamisk v\u00e6r og daglig banerotasjon. Koble til direkte fra denne siden.",

    // Server cards
    serversHeading: "Servere",
    connect: "Koble til", connectUpper: "KOBLE TIL",
    loading: "Laster...", down: "NEDE",

    // Today's tracks
    todaysTracks: "DAGENS BANER",
    fixedTrack: "Fast bane", dailyRotation: "Daglig rotasjon",

    // Server detail
    nServers: "3 SERVERE",
    selectServer: "Velg en server for \u00e5 se detaljer",
    playersLabel: "SPILLERE", trackLabel: "BANE",
    sessionLabel: "SESJON", timeLeft: "TID IGJEN",
    cars: "Biler", features: "Egenskaper",
    aiTraffic: "AI-trafikk", dynamicWeather: "Dynamisk v\u00e6r",
    trackRotation: "Banerotasjon",
    maxAi: "Maks 20 AI-biler", playersOnly: "Kun spillere",
    randomWeather: "RandomWeatherPlugin", fixedWeather: "Fast v\u00e6r",
    dailyAt6: "Daglig kl. 06:00", fixedTrackFeature: "Fast bane",
    yes: "JA", no: "NEI",
    strackerStats: "Stracker-statistikk", liveTiming: "Live Timing",

    // Session names
    practice: "Trening", qualifying: "Kvalifisering", race: "Race",

    // Session format descriptions
    freeRoam: "Fri kj\u00f8ring",
    mx5Format: "Kvali 5m + Race 5 runder",
    gt3Format: "Kvali 8m + Race 8 runder",

    // Schedule
    todaysTracksHeading: "Dagens baner",
    fixedAlways: "Fast bane (alltid)",
    dayHeader: "DAG", trackHeader: "BANE",
    mx5Title: "MX-5 Cup \u2014 4 baner", gt3Title: "GT3 Series \u2014 6 baner",
    scheduleNote: "Banene roterer automatisk kl. 06:00 hver dag. Trackday er alltid Nordschleife Touristenfahrten.",

    // Stats
    statsHeading: "Statistikk",
    statsDesc: "Rundetider, bestepar og sesjonshistorikk",
    openStats: "\u00C5pne stracker",
    availableAt: "Tilgjengelig p\u00e5",
    strackerExplain: "Stracker er et statistikkverkt\u00f8y for Assetto Corsa som sporer alle rundetider, bestepar og sesjonshistorikk. Hver server har sin egen stracker-instans.",
    leaderboard: "Leaderboard",
    recentSessions: "Siste sesjoner",
    bestLap: "Beste runde",
    driver: "Kj\u00f8rer",
    car: "Bil",
    time: "Tid",
    date: "Dato",
    type: "Type",
    laps: "Runder",
    totalLaps: "Runder totalt",
    totalDrivers: "Kj\u00f8rere",
    totalSessions: "Sesjoner",
    noStatsData: "Ingen statistikk tilgjengelig enn\u00e5",
    position: "Pos",
    result: "Resultat",

    // Live
    liveHeading: "AC Live Timings",
    liveTitle: "Live banekart og tidtaking",
    liveDesc: "Se posisjoner p\u00e5 banen i sanntid, rundetider og gap mellom f\u00f8rere.",
    openLive: "\u00C5pne Live Timings",
    liveTabTiming: "Live Timing",
    liveTabResults: "Resultater",
    liveTabRaceControl: "Race Control",
    liveTabCars: "Biler",
    liveTabTracks: "Baner",
    openInNewTab: "\u00C5pne i ny fane",

    // Statusbar
    statusConnected: "TILKOBLET", statusDisconnected: "FRAKOBLET",
    playersOnline: "spillere online",

    // Days
    days: ["Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "L\u00f8rdag", "S\u00f8ndag"],

    // Laps
    rounds: "runder",

    // Sidebar sections
    sidebarServers: "SERVERE",
    sidebarTools: "VERKT\u00d8Y",

    // News
    newsHeading: "SISTE NYTT",
    // Up Next
    upNext: "NESTE SESJON",
    startsIn: "Starter om",
    alwaysPractice: "Alltid fri kj\u00f8ring",
    noData: "Ingen data",

    news1date: "11. mars 2026", news1title: "GT3 Series lansert", news1desc: "Ny GT3-serie med 10 biler og 6 baner i daglig rotasjon.",
    news2date: "8. mars 2026", news2title: "MX-5 Cup 2026", news2desc: "MX-5 Cup er tilbake med nye baner: Lime Rock, Laguna Seca, Okayama og Summit Point.",
    news3date: "1. mars 2026", news3title: "Nordschleife AI-trafikk", news3desc: "Touristenfahrten med opptil 20 AI-biler og dynamisk v\u00e6r.",

    // Test Drive
    testdrive: "Testkj\u00f8ring", testdriveMobile: "Test",
    tdSubtitle: "Velg bil og bane fritt, kj\u00f8r lokalt uten nett.",
    tdSelectCar: "Velg bil", tdSelectTrack: "Velg bane", tdOptions: "Innstillinger",
    tdLaunch: "START TESTKJ\u00d8RING", tdLaunching: "Starter...",
    tdNeedsCM: "Krever Content Manager",
    tdCatAll: "Alle", tdCatStreet: "Gatebiler", tdCatCup: "Cup", tdCatGt3: "GT3",
    tdCatGt: "GT", tdCatOpenwheel: "Formelbiler", tdCatCircuit: "Baner", tdCatShort: "Korte baner",
    tdTimeOfDay: "Tidspunkt", tdWeather: "V\u00e6r",
    tdDawn: "Daggry", tdMorning: "Morgen", tdAfternoon: "Ettermiddag", tdSunset: "Solnedgang", tdEvening: "Kveld", tdNight: "Natt",
    tdClear: "Klart", tdCloudy: "Overskyet", tdLightRain: "Lett regn", tdRain: "Regn", tdDynamic: "Dynamisk",
    tdTips: "TIPS",
    tdTip1: "Testkj\u00f8ring krever Content Manager",
    tdTip2: "Alle biler er inkludert i grunnspillet",
    tdTip3: "V\u00e6r og tid p\u00e5virker grip og sikt",
    tdSessionStarted: "Sesjon startet",
    tdCmOpened: "Content Manager \u00e5pnet i bakgrunnen",
    tdNewSession: "Ny sesjon",
    tdStarting: "Starter testkj\u00f8ring...",
    tdBuildingConfig: "Bygger konfigurasjon...",
    tdPreparingTrack: "Klargj\u00f8r bane...",
    tdPreparingCar: "Klargj\u00f8r bil...",
    tdStartingCM: "Starter Content Manager...",
    tdQuickTest: "Hurtig testkj\u00f8ring",
    tdQuickTestDesc: "Velg bil og bane, kj\u00f8r lokalt i Content Manager.",
    tdCar: "Bil", tdTrack: "Bane", tdContinueWith: "Fortsett med",

    // Auth
    loginSteam: "Logg inn med Steam",
    logout: "Logg ut",
    loggedInAs: "Logget inn som",

    // Profile
    profile: "Profil", myProfile: "Min profil",
    totalDrivingTime: "Total kj\u00f8retid",
    personalRecords: "Personlige rekorder",
    favoriteCars: "Favorittbiler",
    noProfileData: "Ingen data funnet",
    steamProfile: "Steam-profil",
    settings: "Innstillinger",
    sessions: "Sesjoner",
    track: "Bane",
    server: "Server",
  },
  en: {
    home: "Home", servers: "Servers", schedule: "Schedule",
    stats: "Statistics", live: "Live Map", liveMobile: "Live",
    brand: "ASSETTO CORSA",
    players: "Players:", connected: "Connected", disconnected: "Disconnected",
    online: "online",
    heroSub: "Assetto Corsa dedicated servers",
    heroDesc: "3 servers with AI traffic, dynamic weather and daily track rotation. Connect directly from this page.",
    serversHeading: "Servers",
    connect: "Connect", connectUpper: "CONNECT",
    loading: "Loading...", down: "DOWN",
    todaysTracks: "TODAY'S TRACKS",
    fixedTrack: "Fixed track", dailyRotation: "Daily rotation",
    nServers: "3 SERVERS",
    selectServer: "Select a server to view details",
    playersLabel: "PLAYERS", trackLabel: "TRACK",
    sessionLabel: "SESSION", timeLeft: "TIME LEFT",
    cars: "Cars", features: "Features",
    aiTraffic: "AI traffic", dynamicWeather: "Dynamic weather",
    trackRotation: "Track rotation",
    maxAi: "Max 20 AI cars", playersOnly: "Players only",
    randomWeather: "RandomWeatherPlugin", fixedWeather: "Fixed weather",
    dailyAt6: "Daily at 06:00", fixedTrackFeature: "Fixed track",
    yes: "YES", no: "NO",
    strackerStats: "Stracker statistics", liveTiming: "Live Timing",
    practice: "Practice", qualifying: "Qualifying", race: "Race",
    freeRoam: "Free roam",
    mx5Format: "Quali 5m + Race 5 laps",
    gt3Format: "Quali 8m + Race 8 laps",
    todaysTracksHeading: "Today's tracks",
    fixedAlways: "Fixed track (always)",
    dayHeader: "DAY", trackHeader: "TRACK",
    mx5Title: "MX-5 Cup \u2014 4 tracks", gt3Title: "GT3 Series \u2014 6 tracks",
    scheduleNote: "Tracks rotate automatically at 06:00 every day. Trackday is always Nordschleife Touristenfahrten.",
    statsHeading: "Statistics",
    statsDesc: "Lap times, personal bests and session history",
    openStats: "Open stracker",
    availableAt: "Available at",
    strackerExplain: "Stracker is a statistics tool for Assetto Corsa that tracks all lap times, personal bests and session history. Each server has its own stracker instance.",
    leaderboard: "Leaderboard",
    recentSessions: "Recent sessions",
    bestLap: "Best lap",
    driver: "Driver",
    car: "Car",
    time: "Time",
    date: "Date",
    type: "Type",
    laps: "Laps",
    totalLaps: "Total laps",
    totalDrivers: "Drivers",
    totalSessions: "Sessions",
    noStatsData: "No statistics available yet",
    position: "Pos",
    result: "Result",
    liveHeading: "AC Live Timings",
    liveTitle: "Live track map and timing",
    liveDesc: "See positions on track in real-time, lap times and gaps between drivers.",
    openLive: "Open Live Timings",
    liveTabTiming: "Live Timing",
    liveTabResults: "Results",
    liveTabRaceControl: "Race Control",
    liveTabCars: "Cars",
    liveTabTracks: "Tracks",
    openInNewTab: "Open in new tab",
    statusConnected: "CONNECTED", statusDisconnected: "DISCONNECTED",
    playersOnline: "players online",
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    rounds: "laps",

    sidebarServers: "SERVERS",
    sidebarTools: "TOOLS",

    newsHeading: "LATEST NEWS",
    upNext: "UP NEXT",
    startsIn: "Starts in",
    alwaysPractice: "Always free roam",
    noData: "No data",

    news1date: "March 11, 2026", news1title: "GT3 Series launched", news1desc: "New GT3 series with 10 cars and 6 tracks in daily rotation.",
    news2date: "March 8, 2026", news2title: "MX-5 Cup 2026", news2desc: "MX-5 Cup is back with new tracks: Lime Rock, Laguna Seca, Okayama and Summit Point.",
    news3date: "March 1, 2026", news3title: "Nordschleife AI traffic", news3desc: "Touristenfahrten with up to 20 AI cars and dynamic weather.",

    // Test Drive
    testdrive: "Test Drive", testdriveMobile: "Test",
    tdSubtitle: "Pick any car and track, drive locally offline.",
    tdSelectCar: "Select car", tdSelectTrack: "Select track", tdOptions: "Options",
    tdLaunch: "START TEST DRIVE", tdLaunching: "Launching...",
    tdNeedsCM: "Requires Content Manager",
    tdCatAll: "All", tdCatStreet: "Street", tdCatCup: "Cup", tdCatGt3: "GT3",
    tdCatGt: "GT", tdCatOpenwheel: "Open Wheel", tdCatCircuit: "Circuits", tdCatShort: "Short tracks",
    tdTimeOfDay: "Time of day", tdWeather: "Weather",
    tdDawn: "Dawn", tdMorning: "Morning", tdAfternoon: "Afternoon", tdSunset: "Sunset", tdEvening: "Evening", tdNight: "Night",
    tdClear: "Clear", tdCloudy: "Cloudy", tdLightRain: "Light Rain", tdRain: "Rain", tdDynamic: "Dynamic",
    tdTips: "TIPS",
    tdTip1: "Test drive requires Content Manager",
    tdTip2: "All cars are included in the base game",
    tdTip3: "Weather and time affect grip and visibility",
    tdSessionStarted: "Session started",
    tdCmOpened: "Content Manager opened in background",
    tdNewSession: "New session",
    tdStarting: "Starting test drive...",
    tdBuildingConfig: "Building configuration...",
    tdPreparingTrack: "Preparing track...",
    tdPreparingCar: "Preparing car...",
    tdStartingCM: "Starting Content Manager...",
    tdQuickTest: "Quick test drive",
    tdQuickTestDesc: "Pick a car and track, drive locally in Content Manager.",
    tdCar: "Car", tdTrack: "Track", tdContinueWith: "Continue with",

    loginSteam: "Login with Steam",
    logout: "Log out",
    loggedInAs: "Logged in as",

    // Profile
    profile: "Profile", myProfile: "My Profile",
    totalDrivingTime: "Total driving time",
    personalRecords: "Personal records",
    favoriteCars: "Favorite cars",
    noProfileData: "No data found",
    steamProfile: "Steam profile",
    settings: "Settings",
    sessions: "Sessions",
    track: "Track",
    server: "Server",
  },
};

const LangContext = createContext({ lang: "no", toggleLang: () => {} });

// ── HELPERS ─────────────────────────────────────────────────────────────────
function trackDisplayName(raw) {
  if (!raw) return "?";
  if (TRACK_NAMES[raw]) return TRACK_NAMES[raw];
  return raw.replace(/-/g, " \u2014 ").replace(/_/g, " ");
}

function formatTimeLeft(ms) {
  if (!ms || ms <= 0) return "0:00";
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getSessionInfo(data, t) {
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

function getNextSession(data, t) {
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

function getTodaysTrack(rotation) {
  const d = new Date();
  let dow = d.getDay();
  dow = dow === 0 ? 7 : dow;
  return rotation[(dow - 1) % rotation.length];
}

function getDomain() {
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return null;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return null;
  const parts = host.split(".");
  if (parts.length >= 2) return parts.slice(-2).join(".");
  return host;
}

const STATS_PORTS = { trackday: 8081, mx5cup: 8082, gt3: 8083 };

function getStatsUrl(serverId) {
  const domain = getDomain();
  if (domain) return `https://stats.${domain}/${serverId}`;
  return `http://${SERVER_IP}:${STATS_PORTS[serverId] || 8081}`;
}

function getAcsmUrl(path) {
  const domain = getDomain();
  if (domain) return `https://live.${domain}${path}`;
  return `http://${SERVER_IP}:8772${path}`;
}

function getLiveUrl() {
  return getAcsmUrl("/live-timing");
}

const LIVE_VIEWS = [
  { id: "live-timing",  path: "/live-timing",  labelKey: "liveTabTiming" },
  { id: "results",      path: "/results",      labelKey: "liveTabResults" },
  { id: "race-control", path: "/race-control", labelKey: "liveTabRaceControl" },
  { id: "cars",         path: "/cars",          labelKey: "liveTabCars" },
  { id: "tracks",       path: "/tracks",        labelKey: "liveTabTracks" },
];

function getJoinUrl(httpPort) {
  return `acmanager://race/online/join?ip=${SERVER_IP}&httpPort=${httpPort}`;
}

function buildRaceIni({ carId, trackId, trackConfig, hour, weatherGraphics }) {
  const sunAngle = Math.max(-80, Math.min(80, (hour - 12) * 16));
  const temp = hour >= 10 && hour <= 18 ? 26 : hour >= 7 && hour <= 20 ? 20 : 14;
  const lines = [
    "[RACE]",
    `TRACK=${trackId}`,
    `CONFIG_TRACK=${trackConfig}`,
    `MODEL=${carId}`,
    "CARS=1",
    "AI_LEVEL=90",
    "PENALTIES=1",
    "",
    "[CAR_0]",
    `MODEL=${carId}`,
    "SKIN=",
    "SETUP=",
    "BALLAST=0",
    "RESTRICTOR=0",
    "",
    "[SESSION_0]",
    "NAME=Practice",
    "TYPE=1",
    "DURATION_MINUTES=60",
    "SPAWN_SET=START",
    "",
    "[WEATHER_0]",
    `GRAPHICS=${weatherGraphics}`,
    `BASE_TEMPERATURE_AMBIENT=${temp}`,
    `BASE_TEMPERATURE_ROAD=${temp + 6}`,
    "VARIATION_AMBIENT=2",
    "VARIATION_ROAD=2",
    "WIND_BASE_SPEED_MIN=3",
    "WIND_BASE_SPEED_MAX=15",
    "",
    "[LIGHTING]",
    `SUN_ANGLE=${sunAngle}`,
    "",
  ];
  return lines.join("\r\n");
}

function getTestDriveUrl(raceIni) {
  const b64 = btoa(raceIni).replace(/=+$/, "");
  return `acmanager://race/config?configData=${b64}`;
}

// ── HOOKS ───────────────────────────────────────────────────────────────────
function useWidth() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
}

function useLang() {
  const { lang, toggleLang } = useContext(LangContext);
  const t = (key) => STRINGS[lang]?.[key] ?? STRINGS.no[key] ?? key;
  return { lang, t, toggleLang };
}

function useAuth() {
  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetch("/auth/profile")
      .then(r => r.ok ? r.json() : null)
      .then(u => { setUser(u); setChecked(true); })
      .catch(() => setChecked(true));
  }, []);

  const login = () => { window.location.href = "/auth/steam"; };
  const logout = async () => {
    await fetch("/auth/logout", { method: "POST" });
    setUser(null);
  };

  return { user, checked, login, logout };
}

function useServerStatus(serverId, interval = 15000) {
  const [state, setState] = useState({ data: null, loading: true, error: null, online: false });

  const fetchData = useCallback(async () => {
    try {
      const resp = await fetch(`/api/${serverId}`, { signal: AbortSignal.timeout(5000) });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      setState({ data, loading: false, error: null, online: true });
    } catch (e) {
      setState(prev => ({ data: prev.data, loading: false, error: e.message, online: false }));
    }
  }, [serverId]);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, interval);
    return () => clearInterval(id);
  }, [fetchData, interval]);

  return state;
}

function useAllServers() {
  const trackday = useServerStatus("trackday");
  const mx5cup = useServerStatus("mx5cup");
  const gt3 = useServerStatus("gt3");
  return { trackday, mx5cup, gt3 };
}

// ── SHARED COMPONENTS ───────────────────────────────────────────────────────
function ST({ children }) {
  return (
    <div style={{
      fontSize: 10, letterSpacing: 2.5, fontWeight: 700,
      color: C.textMuted, paddingBottom: 9, marginBottom: 10,
      borderBottom: `1px solid ${C.borderSub}`, textTransform: "uppercase",
    }}>{children}</div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{
      background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 4, ...style,
    }}>{children}</div>
  );
}

function StatusDot({ status }) {
  const color = { online: C.green, offline: C.red, loading: C.yellow }[status] || C.yellow;
  return (
    <span style={{
      display: "inline-block", width: 8, height: 8, borderRadius: "50%",
      background: color, boxShadow: `0 0 4px ${color}`, flexShrink: 0,
      animation: status === "loading" ? "pulse 1.2s infinite" : "none",
    }} />
  );
}

function ModeBadge({ mode }) {
  const isRace = mode === "Race";
  return (
    <span style={{
      display: "inline-block", padding: "1px 6px", borderRadius: 3,
      fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3,
      background: isRace ? "rgba(34,197,94,0.12)" : "rgba(192,132,252,0.12)",
      color: isRace ? C.green : C.purple,
    }}>{mode}</span>
  );
}

function ServerBadge({ serverId }) {
  const type = SERVER_TYPES[serverId];
  if (!type) return null;
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: 3,
      fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
      background: type.bg, color: type.color,
      border: `1px solid ${type.color}22`,
    }}>{type.label}</span>
  );
}

function ACLogo({ size = 32 }) {
  return (
    <div style={{
      width: size, height: size,
      background: `linear-gradient(145deg, ${C.blue}, #0d4a96)`,
      borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 2px 8px rgba(26,107,196,0.4)", flexShrink: 0,
    }}>
      <span style={{ fontSize: size * 0.42, fontWeight: 900, color: "#fff", letterSpacing: -0.5 }}>aC</span>
    </div>
  );
}

function LangToggle() {
  const { lang, toggleLang } = useLang();
  return (
    <button onClick={toggleLang} style={{
      background: "none", border: `1px solid ${C.border}`, borderRadius: 3,
      padding: "3px 8px", cursor: "pointer", fontSize: 11, fontWeight: 600,
      fontFamily: "inherit", display: "flex", gap: 4, alignItems: "center",
    }}>
      <span style={{ color: lang === "no" ? C.blueBright : C.textDim }}>NO</span>
      <span style={{ color: C.textMuted }}>|</span>
      <span style={{ color: lang === "en" ? C.blueBright : C.textDim }}>EN</span>
    </button>
  );
}

// ── NAVIGATION ──────────────────────────────────────────────────────────────
const NAV = [
  { id: "home", icon: "\u229E" },
  {
    sectionKey: "sidebarServers",
    items: [
      { id: "servers",  icon: "\u2691" },
      { id: "schedule", icon: "\u2261" },
    ],
  },
  {
    sectionKey: "sidebarTools",
    items: [
      { id: "testdrive", icon: "\u2B21" },
      { id: "stats",     icon: "\u223F" },
      { id: "live",      icon: "\u25B6" },
    ],
  },
];

const TABS = [
  { id: "home",      icon: "\u229E" },
  { id: "servers",   icon: "\u2691" },
  { id: "testdrive", icon: "\u2B21" },
  { id: "stats",     icon: "\u223F" },
  { id: "live",      icon: "\u25B6" },
];

// ── SIDEBAR ─────────────────────────────────────────────────────────────────
function NavItem({ id, icon, active, onNav, indent, t }) {
  const isActive = active === id;
  return (
    <div className="nav-item" onClick={() => onNav(id)} style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: indent ? "8px 16px 8px 32px" : "9px 16px", cursor: "pointer",
      background: isActive ? C.bgActive : "transparent",
      borderLeft: isActive ? `3px solid ${C.blueBright}` : "3px solid transparent",
    }}>
      <span style={{ fontSize: 13, color: isActive ? C.blueBright : C.textDim, width: 16, textAlign: "center", flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, flex: 1, color: isActive ? C.white : C.text }}>{t(id)}</span>
    </div>
  );
}

function Sidebar({ active, onNav, auth, onProfile }) {
  const { t } = useLang();
  const [expanded, setExpanded] = useState({ sidebarServers: true, sidebarTools: true });
  const toggle = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div style={{
      width: 226, flexShrink: 0, background: C.bgDark,
      borderRight: `1px solid ${C.border}`,
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      <div style={{
        padding: "16px 18px", borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", gap: 10, background: C.bgDarker,
      }}>
        <ACLogo size={32} />
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.white, letterSpacing: -0.3 }}>aCRacing</div>
          <div style={{ fontSize: 10, color: C.textDim, letterSpacing: 0.5 }}>{t("brand")}</div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
        {NAV.map((entry, idx) => {
          if (entry.id) {
            return <NavItem key={entry.id} {...entry} active={active} onNav={onNav} t={t} />;
          }
          const isExp = expanded[entry.sectionKey] !== false;
          const sectionActive = entry.items.some(i => i.id === active);
          return (
            <div key={entry.sectionKey}>
              <div onClick={() => toggle(entry.sectionKey)} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "10px 16px 4px", cursor: "pointer", userSelect: "none",
                marginTop: idx > 0 ? 6 : 0,
              }}>
                <span style={{
                  fontSize: 9, color: sectionActive ? C.blueBright : C.textMuted,
                  transition: "transform 0.15s", display: "inline-block",
                  transform: isExp ? "rotate(90deg)" : "rotate(0deg)",
                }}>{"\u25B6"}</span>
                <span style={{
                  fontSize: 10, letterSpacing: 2, fontWeight: 700,
                  color: sectionActive ? C.blueBright : C.textMuted,
                }}>{t(entry.sectionKey)}</span>
              </div>
              {isExp && entry.items.map(item => (
                <NavItem key={item.id} {...item} active={active} onNav={onNav} indent t={t} />
              ))}
            </div>
          );
        })}
        {auth.user && (
          <NavItem id="profile" icon={"\u{1F464}"} active={active} onNav={() => onProfile(auth.user.steamId)} t={t} />
        )}
      </div>

      {/* User profile / Steam login */}
      <div style={{ padding: "10px 16px", borderTop: `1px solid ${C.border}` }}>
        {auth.user ? (
          <div>
            <div onClick={() => onProfile(auth.user.steamId)} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, cursor: "pointer" }}>
              <img src={auth.user.avatarSmall} alt="" style={{
                width: 28, height: 28, borderRadius: 4, flexShrink: 0,
                border: `1px solid ${C.border}`,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {auth.user.name}
                </div>
                <div style={{ fontSize: 9, color: C.textDim }}>Steam</div>
              </div>
            </div>
            <button onClick={auth.logout} style={{
              background: "none", border: `1px solid ${C.border}`, borderRadius: 3,
              padding: "4px 10px", cursor: "pointer", fontSize: 10, fontWeight: 600,
              color: C.textDim, fontFamily: "inherit", width: "100%",
              transition: "all 0.15s",
            }}>{t("logout")}</button>
          </div>
        ) : auth.checked ? (
          <button onClick={auth.login} style={{
            display: "flex", alignItems: "center", gap: 8, width: "100%",
            background: "linear-gradient(135deg, #171a21, #1b2838)",
            border: `1px solid ${C.border}`, borderRadius: 3,
            padding: "8px 10px", cursor: "pointer", fontFamily: "inherit",
            transition: "all 0.15s",
          }}>
            <span style={{ fontSize: 16 }}>{"\u{1F3AE}"}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{t("loginSteam")}</span>
          </button>
        ) : null}
      </div>

      <div style={{ padding: "6px 16px 10px", borderTop: `1px solid ${C.border}` }}>
        <LangToggle />
      </div>
    </div>
  );
}

// ── TOP BARS ────────────────────────────────────────────────────────────────
function DesktopTopBar({ time, totalPlayers, anyOnline }) {
  const { t } = useLang();
  return (
    <div style={{
      height: 36, flexShrink: 0, background: C.bgDarker,
      borderBottom: `1px solid ${C.border}`,
      display: "flex", alignItems: "center", justifyContent: "flex-end",
      padding: "0 18px", gap: 16,
    }}>
      <LangToggle />
      <span style={{ color: C.border }}>{"\u2502"}</span>
      <span style={{ fontSize: 11, color: C.textDim, fontVariantNumeric: "tabular-nums" }}>
        {time.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </span>
      <span style={{ color: C.border }}>{"\u2502"}</span>
      <span style={{ fontSize: 11, color: C.text, display: "flex", alignItems: "center", gap: 5 }}>
        <span style={{ color: C.textDim }}>{t("players")}</span>
        <span style={{ fontWeight: 700, color: totalPlayers > 0 ? C.green : C.textDim }}>{totalPlayers}</span>
      </span>
      <span style={{ color: C.border }}>{"\u2502"}</span>
      <span style={{ fontSize: 11, color: C.textDim, display: "flex", alignItems: "center", gap: 5 }}>
        <StatusDot status={anyOnline ? "online" : "offline"} />
        {anyOnline ? t("connected") : t("disconnected")}
      </span>
    </div>
  );
}

function MobileHeader({ title, totalPlayers, auth, onProfile }) {
  const { t } = useLang();
  return (
    <div style={{
      height: 50, flexShrink: 0, background: C.bgDarker,
      borderBottom: `1px solid ${C.border}`,
      display: "flex", alignItems: "center", padding: "0 14px", gap: 10,
    }}>
      <ACLogo size={30} />
      <span style={{ fontSize: 15, fontWeight: 700, color: C.white, flex: 1, letterSpacing: -0.3 }}>{title}</span>
      {auth.user ? (
        <img src={auth.user.avatarSmall} alt="" onClick={() => onProfile(auth.user.steamId)} style={{
          width: 26, height: 26, borderRadius: 4, cursor: "pointer",
          border: `1px solid ${C.border}`,
        }} title={auth.user.name} />
      ) : auth.checked ? (
        <button onClick={auth.login} style={{
          background: "linear-gradient(135deg, #171a21, #1b2838)",
          border: `1px solid ${C.border}`, borderRadius: 3,
          padding: "4px 8px", cursor: "pointer", fontSize: 10, fontWeight: 600,
          color: C.text, fontFamily: "inherit",
        }}>Steam</button>
      ) : null}
      <LangToggle />
      <span style={{ fontSize: 11, color: C.textDim, display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ fontWeight: 700, color: totalPlayers > 0 ? C.green : C.textDim }}>{totalPlayers}</span>
        {t("online")}
      </span>
    </div>
  );
}

function MobileTabBar({ active, onNav }) {
  const { t } = useLang();
  return (
    <div style={{
      height: 58, flexShrink: 0, background: C.bgDarker,
      borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "stretch",
    }}>
      {TABS.map(tab => {
        const on = active === tab.id;
        const label = tab.id === "live" ? t("liveMobile") : tab.id === "testdrive" ? t("testdriveMobile") : t(tab.id);
        return (
          <button key={tab.id} onClick={() => onNav(tab.id)} style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 3,
            background: on ? `linear-gradient(180deg, ${C.bgActive} 0%, ${C.bgDarker} 100%)` : "none",
            border: "none", cursor: "pointer",
            borderTop: on ? `2px solid ${C.blueBright}` : "2px solid transparent",
          }}>
            <span style={{ fontSize: 17, color: on ? C.blueBright : C.textDim, lineHeight: 1 }}>{tab.icon}</span>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, color: on ? C.blueBright : C.textDim }}>{label.toUpperCase()}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── HELPER: get server status type string ───────────────────────────────────
function getStatusType(status) {
  if (status.loading) return "loading";
  if (status.online) return "online";
  return "offline";
}

// ── HOME SCREEN ─────────────────────────────────────────────────────────────
function HomeScreen({ m, servers, onNav }) {
  const { t } = useLang();
  return (
    <div style={{ padding: m ? 12 : 22, overflow: "auto", height: "100%", display: "flex", flexDirection: m ? "column" : "row", gap: m ? 14 : 20 }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: m ? 14 : 18, minWidth: 0 }}>
        {/* Hero */}
        <div style={{
          background: "linear-gradient(135deg, #0a1530 0%, #060e20 60%, #080c14 100%)",
          border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.blue}`,
          borderRadius: 4, padding: m ? "15px" : "22px 24px",
        }}>
          <div style={{ fontSize: 10, color: C.blue, letterSpacing: 2.5, fontWeight: 700, marginBottom: 6, textTransform: "uppercase" }}>
            {t("heroSub")}
          </div>
          <div style={{ fontSize: m ? 22 : 28, fontWeight: 700, color: C.white, marginBottom: 6 }}>aCRacing</div>
          <div style={{ fontSize: 12, color: C.textDim, lineHeight: 1.7, maxWidth: 500 }}>
            {t("heroDesc")}
          </div>
        </div>

        {/* Server cards */}
        <div>
          <ST>{t("serversHeading")}</ST>
          <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "repeat(3, 1fr)", gap: 10 }}>
            {SERVERS.map(s => {
              const status = servers[s.id];
              const st = getStatusType(status);
              const clients = status.data?.clients || 0;
              const max = status.data?.maxclients || s.maxClients;
              const track = st === "online" ? trackDisplayName(status.data?.track) : st === "loading" ? t("loading") : t("down");
              const session = st === "online" ? getSessionInfo(status.data, t) : null;

              return (
                <Card key={s.id} style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <StatusDot status={st} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: C.white, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                    <ServerBadge serverId={s.id} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontFamily: "'Consolas',monospace", fontWeight: 600, color: clients > 0 ? C.green : C.textDim }}>
                      {st === "loading" ? "--" : clients}/{max}
                    </span>
                    <span style={{ fontSize: 11, color: C.textDim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginLeft: 8 }}>{track}</span>
                  </div>
                  {session && (
                    <div style={{
                      padding: "5px 8px", borderRadius: 4, marginBottom: 8,
                      fontSize: 11, fontFamily: "'Consolas',monospace",
                      display: "flex", justifyContent: "space-between",
                      background: session.colors.bg, border: `1px solid ${session.colors.border}`, color: session.colors.text,
                    }}>
                      <span>{session.name}</span>
                      <span>{session.timeDisplay}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8, minHeight: 22 }}>
                    {uniqueBrands(s.cars).map(c => (
                      <img key={c.id} src={carBadgeSrc(c.id)} alt="" title={c.name}
                        style={{ height: 22, width: "auto", opacity: 0.85, filter: "drop-shadow(0 0 1px rgba(0,0,0,0.5))" }}
                        onError={e => { e.target.style.display = "none"; }}
                      />
                    ))}
                  </div>
                  <a href={st !== "offline" ? getJoinUrl(s.httpPort) : undefined} style={{
                    display: "inline-block", padding: "5px 14px", borderRadius: 3,
                    fontSize: 11, fontWeight: 600, textDecoration: "none",
                    background: st === "offline" ? C.bgHover : `linear-gradient(135deg, ${C.blue}, #0d4a96)`,
                    color: st === "offline" ? C.textMuted : "#fff",
                    cursor: st === "offline" ? "default" : "pointer",
                    pointerEvents: st === "offline" ? "none" : "auto",
                  }}>{t("connect")}</a>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Up Next (mobile) */}
        {m && (
          <div>
            <ST>{t("upNext")}</ST>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
              {SERVERS.filter(s => s.mode !== "Practice").map(s => {
                const status = servers[s.id];
                const st = getStatusType(status);
                const next = st === "online" ? getNextSession(status.data, t) : null;
                return (
                  <Card key={s.id} style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                    <StatusDot status={st} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{s.name}</div>
                      {next ? (
                        <div style={{ fontSize: 11, color: C.textDim }}>
                          <span style={{ color: next.colors.text, fontWeight: 600 }}>{next.name}</span>
                          {next.startsIn && <span> — {t("startsIn").toLowerCase()} <span style={{ color: C.orange, fontFamily: "'Consolas',monospace" }}>{next.startsIn}</span></span>}
                        </div>
                      ) : (
                        <div style={{ fontSize: 11, color: C.textDim }}>{st === "loading" ? t("loading") : t("noData")}</div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* News feed */}
        <div>
          <ST>{t("newsHeading")}</ST>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {NEWS.map(n => (
              <Card key={n.id} style={{ padding: "12px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: C.blue, fontWeight: 600 }}>{t(n.dateKey)}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.white, marginBottom: 3 }}>{t(n.titleKey)}</div>
                <div style={{ fontSize: 11, color: C.textDim, lineHeight: 1.5 }}>{t(n.descKey)}</div>
              </Card>
            ))}
          </div>
        </div>

        {/* Test Drive card */}
        <div onClick={() => onNav && onNav("testdrive")} className="ir-row" style={{
          background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 4,
          borderLeft: `4px solid ${C.orange}`, padding: "14px 16px", cursor: "pointer",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>{"\u2B21"}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.white, marginBottom: 2 }}>{t("tdQuickTest")}</div>
              <div style={{ fontSize: 11, color: C.textDim }}>{t("tdQuickTestDesc")}</div>
            </div>
            <span style={{ color: C.textDim, fontSize: 18 }}>{"\u203A"}</span>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      {!m && (
        <div style={{ width: 240, flexShrink: 0, display: "flex", flexDirection: "column", gap: 14 }}>
          <Card>
            <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.borderSub}` }}>
              <span style={{ fontSize: 10, color: C.blue, letterSpacing: 2, fontWeight: 700 }}>{t("todaysTracks")}</span>
            </div>
            <div style={{ padding: "8px 14px 12px" }}>
              {[
                { label: "Trackday", track: "Nordschleife TF (AI)", note: t("fixedTrack") },
                { label: "MX-5 Cup", track: getTodaysTrack(MX5_ROTATION).name, note: t("dailyRotation") },
                { label: "GT3 Series", track: getTodaysTrack(GT3_ROTATION).name, note: t("dailyRotation") },
              ].map(({ label, track, note }) => (
                <div key={label} style={{ padding: "8px 0", borderBottom: `1px solid ${C.borderSub}` }}>
                  <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.white }}>{track}</div>
                  <div style={{ fontSize: 10, color: C.textDim }}>{note}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Up Next */}
          <Card>
            <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.borderSub}` }}>
              <span style={{ fontSize: 10, color: C.orange, letterSpacing: 2, fontWeight: 700 }}>{t("upNext")}</span>
            </div>
            <div style={{ padding: "8px 14px 12px" }}>
              {SERVERS.map(s => {
                const status = servers[s.id];
                const st = getStatusType(status);
                const currentSession = st === "online" ? getSessionInfo(status.data, t) : null;
                const next = st === "online" ? getNextSession(status.data, t) : null;

                return (
                  <div key={s.id} style={{ padding: "8px 0", borderBottom: `1px solid ${C.borderSub}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                      <StatusDot status={st} />
                      <span style={{ fontSize: 10, color: C.textMuted }}>{s.name}</span>
                    </div>
                    {s.mode === "Practice" ? (
                      <div style={{ fontSize: 11, color: C.textDim, fontStyle: "italic" }}>{t("alwaysPractice")}</div>
                    ) : next ? (
                      <div>
                        <div style={{
                          display: "inline-block", padding: "2px 6px", borderRadius: 3, marginBottom: 3,
                          fontSize: 11, fontWeight: 600,
                          background: next.colors.bg, border: `1px solid ${next.colors.border}`, color: next.colors.text,
                        }}>{next.name}</div>
                        {next.startsIn && (
                          <div style={{ fontSize: 10, color: C.textDim }}>
                            {t("startsIn")} <span style={{ color: C.orange, fontWeight: 600, fontFamily: "'Consolas',monospace" }}>{next.startsIn}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ fontSize: 11, color: C.textDim }}>{st === "loading" ? t("loading") : t("noData")}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ── SERVERS SCREEN ──────────────────────────────────────────────────────────
function ServersScreen({ m, servers }) {
  const [sel, setSel] = useState(null);
  const { t } = useLang();
  const selected = sel ? SERVERS.find(s => s.id === sel) : null;

  if (m && selected) {
    const status = servers[selected.id];
    const st = getStatusType(status);
    const clients = status.data?.clients || 0;
    const max = status.data?.maxclients || selected.maxClients;
    const track = st === "online" ? trackDisplayName(status.data?.track) : st === "loading" ? t("loading") : t("down");
    const session = st === "online" ? getSessionInfo(status.data, t) : null;

    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <div style={{
          padding: "11px 13px", background: C.bgDarker,
          borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <button onClick={() => setSel(null)} style={{ background: "none", border: "none", color: C.blueBright, fontSize: 24, cursor: "pointer", padding: "0 4px 0 0", lineHeight: 1 }}>{"\u2039"}</button>
          <StatusDot status={st} />
          <span style={{ fontSize: 14, fontWeight: 600, color: C.white, flex: 1 }}>{selected.name}</span>
          <ModeBadge mode={selected.mode} />
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: 13 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
            {[
              [t("playersLabel"), st === "loading" ? "--" : `${clients}/${max}`, clients > 0 ? C.green : C.textDim],
              [t("trackLabel"), track, C.white],
              [t("sessionLabel"), session?.name || "--", session?.colors?.text || C.textDim],
              [t("timeLeft"), session?.timeDisplay || "--", C.orange],
            ].map(([l, v, col]) => (
              <Card key={l} style={{ padding: "11px 12px" }}>
                <div style={{ fontSize: 9, color: C.textMuted, letterSpacing: 1.5, marginBottom: 3, textTransform: "uppercase" }}>{l}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: col, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</div>
              </Card>
            ))}
          </div>
          <ST>{t("cars")} ({selected.cars.length})</ST>
          <Card style={{ overflow: "hidden", marginBottom: 16 }}>
            {selected.cars.map((c, i) => (
              <div key={c.id} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 13px",
                borderBottom: i < selected.cars.length - 1 ? `1px solid ${C.borderSub}` : "none",
                background: i % 2 === 0 ? C.bgCard : "transparent",
              }}>
                <img src={carBadgeSrc(c.id)} alt="" style={{ height: 20, width: 20, objectFit: "contain" }} onError={e => { e.target.style.display = "none"; }} />
                <span style={{ fontSize: 13, color: C.text }}>{c.name}</span>
              </div>
            ))}
          </Card>
          <ST>{t("features")}</ST>
          <Card style={{ overflow: "hidden", marginBottom: 16 }}>
            {[
              [t("aiTraffic"), selected.hasAI],
              [t("dynamicWeather"), selected.hasWeather],
              [t("trackRotation"), selected.trackRotation],
            ].map(([label, val], i) => (
              <div key={label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 13px",
                borderBottom: i < 2 ? `1px solid ${C.borderSub}` : "none",
                background: i % 2 === 0 ? C.bgCard : "transparent",
              }}>
                <span style={{ fontSize: 12, color: C.text }}>{label}</span>
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 3,
                  background: val ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                  color: val ? C.green : C.red,
                }}>{val ? t("yes") : t("no")}</span>
              </div>
            ))}
          </Card>
          <a href={st !== "offline" ? getJoinUrl(selected.httpPort) : undefined} className="ir-btn-blue" style={{
            display: "block", textAlign: "center", textDecoration: "none",
            width: "100%", padding: "13px 0", fontSize: 14,
            opacity: st === "offline" ? 0.4 : 1,
            pointerEvents: st === "offline" ? "none" : "auto",
          }}>{t("connectUpper")}</a>
          {(getStatsUrl(selected.id) || getLiveUrl()) && (
            <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {getStatsUrl(selected.id) && <a href={getStatsUrl(selected.id)} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: C.blueBright, textDecoration: "none" }}>{t("strackerStats")} {"\u2197"}</a>}
              {getLiveUrl() && <a href={getLiveUrl()} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: C.blueBright, textDecoration: "none" }}>{t("liveTiming")} {"\u2197"}</a>}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: m ? "column" : "row", height: "100%", overflow: "hidden" }}>
      {/* List panel */}
      <div style={{
        width: m ? "100%" : 340, flexShrink: 0,
        borderRight: m ? "none" : `1px solid ${C.border}`,
        display: "flex", flexDirection: "column", overflow: "hidden", background: C.bgDark,
      }}>
        <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, background: C.bgDarker }}>
          <span style={{ fontSize: 10, color: C.blue, letterSpacing: 2, fontWeight: 700 }}>{t("nServers")}</span>
        </div>
        <div style={{ overflow: "auto", flex: 1 }}>
          {SERVERS.map(s => {
            const status = servers[s.id];
            const st = getStatusType(status);
            const clients = status.data?.clients || 0;
            const max = status.data?.maxclients || s.maxClients;
            const track = st === "online" ? trackDisplayName(status.data?.track) : st === "loading" ? t("loading") : t("down");
            const isActive = sel === s.id;
            return (
              <div key={s.id} onClick={() => setSel(s.id)} className="ir-series-row" style={{
                padding: m ? "13px 14px" : "11px 14px",
                borderBottom: `1px solid ${C.borderSub}`,
                borderLeft: isActive ? `3px solid ${C.blueBright}` : "3px solid transparent",
                background: isActive ? C.bgActive : "transparent",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
              }}>
                <StatusDot status={st} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: m ? 14 : 13, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{track}</div>
                  <div style={{ display: "flex", gap: 3, marginTop: 4, flexWrap: "wrap" }}>
                    {uniqueBrands(s.cars).slice(0, 8).map(c => (
                      <img key={c.id} src={carBadgeSrc(c.id)} alt="" title={c.name}
                        style={{ height: 16, width: "auto", opacity: 0.7 }}
                        onError={e => { e.target.style.display = "none"; }}
                      />
                    ))}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "'Consolas',monospace", color: clients > 0 ? C.green : C.textDim }}>
                    {st === "loading" ? "--" : clients}/{max}
                  </div>
                  <ServerBadge serverId={s.id} />
                </div>
                {m && <span style={{ color: C.textDim, fontSize: 18 }}>{"\u203A"}</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop detail */}
      {!m && selected && (() => {
        const status = servers[selected.id];
        const st = getStatusType(status);
        const clients = status.data?.clients || 0;
        const max = status.data?.maxclients || selected.maxClients;
        const track = st === "online" ? trackDisplayName(status.data?.track) : st === "loading" ? t("loading") : t("down");
        const session = st === "online" ? getSessionInfo(status.data, t) : null;

        return (
          <div style={{ flex: 1, overflow: "auto", padding: 22 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20, paddingBottom: 20, borderBottom: `1px solid ${C.border}` }}>
              <StatusDot status={st} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: C.white, marginBottom: 5 }}>{selected.name}</div>
                <div style={{ fontSize: 12, color: C.textDim, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <ModeBadge mode={selected.mode} />
                  <span>{t(selected.sessionFormatKey)}</span>
                  <span>{"\u00B7"}</span>
                  <span>Port {selected.gamePort}</span>
                </div>
              </div>
              <a href={st !== "offline" ? getJoinUrl(selected.httpPort) : undefined} className="ir-btn-blue" style={{
                fontSize: 13, padding: "9px 22px", textDecoration: "none",
                opacity: st === "offline" ? 0.4 : 1, pointerEvents: st === "offline" ? "none" : "auto",
              }}>{t("connectUpper")}</a>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 20 }}>
              {[
                [t("playersLabel"), st === "loading" ? "--" : `${clients}/${max}`, clients > 0 ? C.green : C.textDim],
                [t("trackLabel"), track, C.white],
                [t("sessionLabel"), session?.name || "--", session?.colors?.text || C.textDim],
                [t("timeLeft"), session?.timeDisplay || "--", C.orange],
              ].map(([l, v, col]) => (
                <Card key={l} style={{ padding: "10px 13px" }}>
                  <div style={{ fontSize: 9, color: C.textMuted, letterSpacing: 1.5, marginBottom: 3, textTransform: "uppercase" }}>{l}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: col, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</div>
                </Card>
              ))}
            </div>

            <ST>{t("cars")} ({selected.cars.length})</ST>
            <Card style={{ overflow: "hidden", marginBottom: 20 }}>
              {selected.cars.map((c, i) => (
                <div key={c.id} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                  borderBottom: i < selected.cars.length - 1 ? `1px solid ${C.borderSub}` : "none",
                  background: i % 2 === 0 ? C.bgCard : "transparent",
                }}>
                  <img src={carBadgeSrc(c.id)} alt="" style={{ height: 22, width: 22, objectFit: "contain" }} onError={e => { e.target.style.display = "none"; }} />
                  <span style={{ fontSize: 13, color: C.text }}>{c.name}</span>
                </div>
              ))}
            </Card>

            <ST>{t("features")}</ST>
            <Card style={{ overflow: "hidden", marginBottom: 20 }}>
              {[
                [t("aiTraffic"), selected.hasAI, selected.hasAI ? t("maxAi") : t("playersOnly")],
                [t("dynamicWeather"), selected.hasWeather, selected.hasWeather ? t("randomWeather") : t("fixedWeather")],
                [t("trackRotation"), selected.trackRotation, selected.trackRotation ? t("dailyAt6") : t("fixedTrackFeature")],
              ].map(([label, val, desc], i) => (
                <div key={label} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 14px",
                  borderBottom: i < 2 ? `1px solid ${C.borderSub}` : "none",
                  background: i % 2 === 0 ? C.bgCard : "transparent",
                }}>
                  <div>
                    <span style={{ fontSize: 13, color: C.text }}>{label}</span>
                    <div style={{ fontSize: 10, color: C.textDim, marginTop: 1 }}>{desc}</div>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 3,
                    background: val ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                    color: val ? C.green : C.red,
                  }}>{val ? t("yes") : t("no")}</span>
                </div>
              ))}
            </Card>

            {(getStatsUrl(selected.id) || getLiveUrl()) && (
              <div style={{ display: "flex", gap: 12 }}>
                {getStatsUrl(selected.id) && <a href={getStatsUrl(selected.id)} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.blueBright, textDecoration: "none" }}>{t("strackerStats")} {"\u2197"}</a>}
                {getLiveUrl() && <a href={getLiveUrl()} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.blueBright, textDecoration: "none" }}>{t("liveTiming")} {"\u2197"}</a>}
              </div>
            )}
          </div>
        );
      })()}
      {!m && !sel && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>{"\u2691"}</div>
            <div style={{ fontSize: 14, color: C.textDim }}>{t("selectServer")}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── SCHEDULE SCREEN ─────────────────────────────────────────────────────────
function ScheduleScreen({ m }) {
  const { t } = useLang();
  const d = new Date();
  let todayDow = d.getDay();
  todayDow = todayDow === 0 ? 7 : todayDow;
  const days = t("days");

  return (
    <div style={{ padding: m ? 12 : 22, overflow: "auto", height: "100%" }}>
      <ST>{t("todaysTracksHeading")}</ST>
      <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "repeat(3, 1fr)", gap: 8, marginBottom: 20 }}>
        {[
          { label: "Trackday", track: "Nordschleife TF (AI)", note: t("fixedAlways") },
          { label: "MX-5 Cup", track: getTodaysTrack(MX5_ROTATION).name, note: days[todayDow - 1] },
          { label: "GT3 Series", track: getTodaysTrack(GT3_ROTATION).name, note: days[todayDow - 1] },
        ].map(({ label, track, note }) => (
          <Card key={label} style={{ padding: "12px 14px" }}>
            <div style={{ fontSize: 9, color: C.textMuted, letterSpacing: 1.5, marginBottom: 3, textTransform: "uppercase" }}>{label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.white }}>{track}</div>
            <div style={{ fontSize: 10, color: C.textDim, marginTop: 2 }}>{note}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "1fr 1fr", gap: m ? 14 : 20 }}>
        {[
          { title: t("mx5Title"), rotation: MX5_ROTATION },
          { title: t("gt3Title"), rotation: GT3_ROTATION },
        ].map(({ title, rotation }) => (
          <div key={title}>
            <ST>{title}</ST>
            <Card style={{ overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", padding: "7px 14px", background: C.bgDarker, borderBottom: `1px solid ${C.borderSub}`, fontSize: 10, color: C.textMuted, letterSpacing: 1.5, fontWeight: 700 }}>
                <span>{t("dayHeader")}</span><span>{t("trackHeader")}</span>
              </div>
              {days.map((day, i) => {
                const dow = i + 1;
                const idx = (dow - 1) % rotation.length;
                const isToday = dow === todayDow;
                return (
                  <div key={day} style={{
                    display: "grid", gridTemplateColumns: "100px 1fr", padding: "9px 14px",
                    background: isToday ? C.bgActive : i % 2 === 0 ? C.bgCard : "transparent",
                    borderBottom: i < 6 ? `1px solid ${C.borderSub}` : "none",
                    borderLeft: isToday ? `3px solid ${C.blueBright}` : "3px solid transparent",
                  }}>
                    <span style={{ fontSize: 12, fontWeight: isToday ? 700 : 400, color: isToday ? C.white : C.textDim }}>{day}</span>
                    <span style={{ fontSize: 12, fontWeight: isToday ? 700 : 400, color: isToday ? C.white : C.text }}>{rotation[idx].name}</span>
                  </div>
                );
              })}
            </Card>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, fontSize: 11, color: C.textDim, display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ color: C.blue }}>{"\u25CF"}</span>
        {t("scheduleNote")}
      </div>
    </div>
  );
}

// ── STATS SCREEN ────────────────────────────────────────────────────────────
function formatLapTime(ms) {
  if (!ms || ms <= 0) return "-";
  const mins = Math.floor(ms / 60000);
  const secs = ((ms % 60000) / 1000).toFixed(3);
  return `${mins}:${secs.padStart(6, "0")}`;
}

function formatStatsDate(ts) {
  if (!ts) return "-";
  const d = new Date(ts * 1000);
  return d.toLocaleDateString("nb-NO", { day: "numeric", month: "short" });
}

function useStatsData() {
  const [data, setData] = useState({});
  useEffect(() => {
    const load = async () => {
      const result = {};
      for (const s of SERVERS) {
        try {
          const r = await fetch(`/data/${s.id}.json`, { signal: AbortSignal.timeout(5000) });
          if (r.ok) result[s.id] = await r.json();
        } catch {}
      }
      setData(result);
    };
    load();
    const id = setInterval(load, 300000);
    return () => clearInterval(id);
  }, []);
  return data;
}

function useProfileData(steamId) {
  const [state, setState] = useState({ data: null, loading: false, error: null });
  useEffect(() => {
    if (!steamId) return;
    setState({ data: null, loading: true, error: null });
    fetch(`/api/profile/${steamId}`, { signal: AbortSignal.timeout(10000) })
      .then(r => {
        if (!r.ok) throw new Error(r.status === 404 ? "not_found" : `HTTP ${r.status}`);
        return r.json();
      })
      .then(data => setState({ data, loading: false, error: null }))
      .catch(e => setState({ data: null, loading: false, error: e.message }));
  }, [steamId]);
  return state;
}

function formatDrivingTime(ms, t) {
  if (!ms) return "0m";
  const hours = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  if (hours > 0) return `${hours}t ${mins}m`;
  return `${mins}m`;
}

// ── PROFILE SCREEN ──────────────────────────────────────────────────────────
function ProfileScreen({ m, steamId, auth, onNav }) {
  const { t } = useLang();
  const { data, loading, error } = useProfileData(steamId);
  const isOwnProfile = auth.user?.steamId === steamId;

  if (loading) {
    return (
      <div style={{ padding: m ? 12 : 22, overflow: "auto", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 13, color: C.textDim }}>{t("loading")}</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: m ? 12 : 22, overflow: "auto", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Card style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 12, opacity: 0.3 }}>{"\u{1F464}"}</div>
          <div style={{ fontSize: 13, color: C.textDim }}>{t("noProfileData")}</div>
        </Card>
      </div>
    );
  }

  const trackName = (raw) => TRACK_NAMES[raw] || raw || "-";

  return (
    <div style={{ padding: m ? 12 : 22, overflow: "auto", height: "100%" }}>
      {/* Profile Header */}
      <Card style={{ padding: m ? "16px" : "20px 24px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: m ? "flex-start" : "center", gap: 16, flexWrap: "wrap" }}>
          {data.avatar && (
            <img src={data.avatar} alt="" style={{
              width: m ? 56 : 72, height: m ? 56 : 72, borderRadius: 6,
              border: `2px solid ${C.border}`,
            }} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
              <span style={{ fontSize: m ? 20 : 24, fontWeight: 700, color: C.white }}>{data.name}</span>
              {isOwnProfile && (
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 3,
                  background: "rgba(59,154,254,0.12)", color: C.blueBright,
                }}>{t("myProfile")}</span>
              )}
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <a href={data.profileUrl} target="_blank" rel="noopener noreferrer" style={{
                fontSize: 11, color: C.blueBright, textDecoration: "none",
              }}>{t("steamProfile")} {"\u2197"}</a>
            </div>
          </div>
        </div>
      </Card>

      {/* Summary Stats */}
      <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { label: t("laps"), value: data.summary.validLaps, sub: `/ ${data.summary.totalLaps}` },
          { label: t("sessions"), value: data.summary.totalSessions },
          { label: t("totalDrivingTime"), value: formatDrivingTime(data.summary.totalDrivingTimeMs, t) },
        ].map(({ label, value, sub }) => (
          <Card key={label} style={{ padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: C.white, fontFamily: "Consolas, monospace" }}>
              {value}{sub && <span style={{ fontSize: 12, color: C.textDim }}> {sub}</span>}
            </div>
            <div style={{ fontSize: 10, color: C.textDim, marginTop: 4, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
            {/* Per-server breakdown */}
            {label === t("laps") && (
              <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 8 }}>
                {Object.entries(data.summary.servers).map(([srv, s]) => (
                  <span key={srv} style={{ fontSize: 10, color: SERVER_TYPES[srv]?.color || C.textDim }}>
                    {SERVER_TYPES[srv]?.label}: {s.laps}
                  </span>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "1fr 1fr", gap: 14 }}>
        {/* Personal Records */}
        {data.personalRecords.length > 0 && (
          <Card style={{ overflow: "hidden" }}>
            <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}`, fontSize: 12, fontWeight: 700, color: C.white, display: "flex", alignItems: "center", gap: 6 }}>
              {"\u{1F3C6}"} {t("personalRecords")}
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                <th style={{ padding: "8px 10px", fontSize: 10, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, borderBottom: `1px solid ${C.border}`, textAlign: "left" }}>{t("track")}</th>
                <th style={{ padding: "8px 10px", fontSize: 10, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, borderBottom: `1px solid ${C.border}`, textAlign: "left" }}>{t("car")}</th>
                <th style={{ padding: "8px 10px", fontSize: 10, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, borderBottom: `1px solid ${C.border}`, textAlign: "right" }}>{t("time")}</th>
              </tr></thead>
              <tbody>
                {data.personalRecords.map((r, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? C.bgCard : "transparent" }}>
                    <td style={{ padding: "7px 10px", fontSize: 12, color: C.white, borderBottom: `1px solid ${C.borderSub}` }}>
                      {trackName(r.track)}
                      <div style={{ fontSize: 9, color: SERVER_TYPES[r.server]?.color || C.textDim }}>{SERVER_TYPES[r.server]?.label}</div>
                    </td>
                    <td style={{ padding: "7px 10px", fontSize: 11, color: C.textDim, borderBottom: `1px solid ${C.borderSub}` }}>{r.car}</td>
                    <td style={{ padding: "7px 10px", fontFamily: "Consolas, monospace", fontSize: 12, textAlign: "right", color: C.green, borderBottom: `1px solid ${C.borderSub}` }}>{formatLapTime(r.lapTime)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {/* Favorite Cars */}
        {data.favoriteCars.length > 0 && (
          <Card style={{ overflow: "hidden" }}>
            <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}`, fontSize: 12, fontWeight: 700, color: C.white, display: "flex", alignItems: "center", gap: 6 }}>
              {"\u{1F3CE}\uFE0F"} {t("favoriteCars")}
            </div>
            {data.favoriteCars.map((c, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                borderBottom: i < data.favoriteCars.length - 1 ? `1px solid ${C.borderSub}` : "none",
                background: i % 2 === 0 ? C.bgCard : "transparent",
              }}>
                <img src={carBadgeSrc(c.carId)} alt="" style={{ height: 24, width: 24, objectFit: "contain" }}
                  onError={e => { e.target.style.display = "none"; }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: C.white, fontWeight: 500 }}>{c.car}</div>
                  <div style={{ fontSize: 10, color: C.textDim }}>{c.laps} {t("laps").toLowerCase()}</div>
                </div>
                {c.bestLapTime && (
                  <span style={{ fontFamily: "Consolas, monospace", fontSize: 12, color: C.green }}>{formatLapTime(c.bestLapTime)}</span>
                )}
              </div>
            ))}
          </Card>
        )}
      </div>

      {/* Recent Sessions */}
      {data.recentSessions.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <Card style={{ overflow: "hidden" }}>
            <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}`, fontSize: 12, fontWeight: 700, color: C.white, display: "flex", alignItems: "center", gap: 6 }}>
              {"\u25F6"} {t("recentSessions")}
            </div>
            {data.recentSessions.map((sess, i) => {
              const typeColors = sess.type === "Race" ? { bg: "rgba(34,197,94,0.08)", color: C.green }
                : sess.type === "Qualify" ? { bg: "rgba(59,154,254,0.08)", color: C.blueBright }
                : { bg: "rgba(192,132,252,0.08)", color: C.purple };
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                  borderBottom: i < data.recentSessions.length - 1 ? `1px solid ${C.borderSub}` : "none",
                  background: i % 2 === 0 ? C.bgCard : "transparent",
                }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 3, flexShrink: 0,
                    background: typeColors.bg, color: typeColors.color,
                  }}>{sess.type}</span>
                  <ServerBadge serverId={sess.server} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: C.white }}>{trackName(sess.track)}</div>
                    <div style={{ fontSize: 10, color: C.textDim }}>{sess.car} {"\u00B7"} {sess.laps} {t("laps").toLowerCase()}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    {sess.bestLap && <div style={{ fontFamily: "Consolas, monospace", fontSize: 12, color: C.green }}>{formatLapTime(sess.bestLap)}</div>}
                    <div style={{ fontSize: 10, color: C.textMuted }}>{formatStatsDate(sess.date)}</div>
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
      )}

      {/* Settings (own profile only) */}
      {isOwnProfile && (
        <div style={{ marginTop: 14 }}>
          <Card style={{ padding: "14px 16px" }}>
            <ST>{t("settings")}</ST>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: C.text }}>{t("profile")}</span>
              <LangToggle />
            </div>
            <button onClick={auth.logout} style={{
              background: "none", border: `1px solid ${C.border}`, borderRadius: 3,
              padding: "6px 14px", cursor: "pointer", fontSize: 11, fontWeight: 600,
              color: C.textDim, fontFamily: "inherit", transition: "all 0.15s",
            }}>{t("logout")}</button>
          </Card>
        </div>
      )}
    </div>
  );
}

function StatsScreen({ m, navigateToProfile }) {
  const { t } = useLang();
  const allStats = useStatsData();
  const [activeServer, setActiveServer] = useState("trackday");
  const data = allStats[activeServer];
  const trackName = (raw) => TRACK_NAMES[raw] || raw || "-";

  const tabStyle = (id) => ({
    padding: m ? "7px 14px" : "8px 20px", fontSize: m ? 11 : 12, fontWeight: 600,
    background: activeServer === id ? SERVER_TYPES[id].bg : "transparent",
    color: activeServer === id ? SERVER_TYPES[id].color : C.textDim,
    border: `1px solid ${activeServer === id ? SERVER_TYPES[id].color + "40" : C.border}`,
    borderRadius: 4, cursor: "pointer", transition: "all 0.15s",
  });

  const th = { padding: "8px 10px", fontSize: 10, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, borderBottom: `1px solid ${C.border}`, textAlign: "left" };
  const td = { padding: "7px 10px", fontSize: 12, borderBottom: `1px solid ${C.borderSub}` };
  const tdMono = { ...td, fontFamily: "Consolas, monospace", fontSize: 12 };

  return (
    <div style={{ padding: m ? 12 : 22, overflow: "auto", height: "100%" }}>
      <ST>{t("statsHeading")}</ST>

      {/* Server tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {SERVERS.map(s => (
          <button key={s.id} onClick={() => setActiveServer(s.id)} style={tabStyle(s.id)}>
            {SERVER_TYPES[s.id].label}
          </button>
        ))}
        {getStatsUrl(activeServer) && (
          <a href={getStatsUrl(activeServer)} target="_blank" rel="noopener noreferrer" style={{
            marginLeft: "auto", fontSize: 11, color: C.blueBright, textDecoration: "none",
            alignSelf: "center",
          }}>{t("openStats")} {"\u2197"}</a>
        )}
      </div>

      {!data ? (
        <Card style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: C.textDim }}>{t("noStatsData")}</div>
        </Card>
      ) : (
        <>
          {/* Summary counters */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
            {[
              { label: t("totalLaps"), value: data.stats.validLaps, sub: `/ ${data.stats.totalLaps}` },
              { label: t("totalDrivers"), value: data.stats.totalPlayers },
              { label: t("totalSessions"), value: data.stats.totalSessions },
            ].map(({ label, value, sub }) => (
              <Card key={label} style={{ padding: "12px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: C.white, fontFamily: "Consolas, monospace" }}>
                  {value}{sub && <span style={{ fontSize: 12, color: C.textDim }}> {sub}</span>}
                </div>
                <div style={{ fontSize: 10, color: C.textDim, marginTop: 2, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
              </Card>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "1fr 1fr", gap: 14 }}>
            {/* Leaderboard */}
            <Card style={{ overflow: "hidden" }}>
              <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}`, fontSize: 12, fontWeight: 700, color: C.white, display: "flex", alignItems: "center", gap: 6 }}>
                {"\u223F"} {t("leaderboard")}
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>
                  <th style={th}>#</th>
                  <th style={th}>{t("driver")}</th>
                  <th style={th}>{t("car")}</th>
                  <th style={{ ...th, textAlign: "right" }}>{t("time")}</th>
                </tr></thead>
                <tbody>
                  {data.leaderboard.map((row, i) => (
                    <tr key={i} style={{ background: i === 0 ? "rgba(234,179,8,0.06)" : i % 2 === 0 ? C.bgCard : "transparent" }}>
                      <td style={{ ...td, fontWeight: 700, color: i === 0 ? C.yellow : i < 3 ? C.white : C.textDim, width: 32 }}>{i + 1}</td>
                      <td style={{ ...td, color: C.white, fontWeight: i < 3 ? 600 : 400 }}>
                        {row.steamGuid ? (
                          <span className="profile-link" onClick={() => navigateToProfile(row.steamGuid)} style={{ color: "inherit" }}>{row.name}</span>
                        ) : row.name}
                      </td>
                      <td style={{ ...td, color: C.textDim, fontSize: 11 }}>{row.car}</td>
                      <td style={{ ...tdMono, textAlign: "right", color: i === 0 ? C.yellow : C.green }}>{formatLapTime(row.lapTime)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.leaderboard.length > 0 && (
                <div style={{ padding: "6px 14px", fontSize: 10, color: C.textMuted, borderTop: `1px solid ${C.borderSub}` }}>
                  {trackName(data.leaderboard[0].track)}
                </div>
              )}
            </Card>

            {/* Recent sessions */}
            <Card style={{ overflow: "hidden" }}>
              <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}`, fontSize: 12, fontWeight: 700, color: C.white, display: "flex", alignItems: "center", gap: 6 }}>
                {"\u25F6"} {t("recentSessions")}
              </div>
              {data.recentSessions.map((sess, si) => {
                const typeColors = sess.type === "Race" ? { bg: "rgba(34,197,94,0.08)", color: C.green }
                  : sess.type === "Qualify" ? { bg: "rgba(59,154,254,0.08)", color: C.blueBright }
                  : { bg: "rgba(192,132,252,0.08)", color: C.purple };
                return (
                  <div key={si} style={{ borderBottom: si < data.recentSessions.length - 1 ? `1px solid ${C.borderSub}` : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 3, background: typeColors.bg, color: typeColors.color }}>{sess.type}</span>
                        <span style={{ fontSize: 12, color: C.text }}>{trackName(sess.track)}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 11, color: C.textDim }}>{sess.playerCount}P</span>
                        <span style={{ fontSize: 10, color: C.textMuted }}>{formatStatsDate(sess.startTime)}</span>
                      </div>
                    </div>
                    {sess.results && sess.results.length > 0 && (
                      <div style={{ padding: "0 14px 8px" }}>
                        {sess.results.slice(0, sess.type === "Race" ? 5 : 3).map((r, ri) => (
                          <div key={ri} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2px 0", fontSize: 11 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ width: 18, color: ri === 0 ? C.yellow : ri < 3 ? C.white : C.textDim, fontWeight: 700, fontSize: 10 }}>{r.pos < 1000 ? r.pos : "-"}</span>
                              <span style={{ color: ri < 3 ? C.text : C.textDim }}>{r.steamGuid ? (
                                <span className="profile-link" onClick={() => navigateToProfile(r.steamGuid)} style={{ color: "inherit" }}>{r.name}</span>
                              ) : r.name}</span>
                            </div>
                            <span style={{ fontFamily: "Consolas, monospace", fontSize: 11, color: ri === 0 ? C.green : C.textDim }}>{formatLapTime(r.bestLap)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

// ── LIVE SCREEN ─────────────────────────────────────────────────────────────
function LiveScreen({ m }) {
  const { t } = useLang();
  const [activeView, setActiveView] = useState("live-timing");
  const currentUrl = getAcsmUrl(LIVE_VIEWS.find(v => v.id === activeView).path);

  const tabStyle = (id) => ({
    padding: m ? "7px 14px" : "8px 20px", fontSize: m ? 11 : 12, fontWeight: 600,
    background: activeView === id ? "rgba(26,107,196,0.12)" : "transparent",
    color: activeView === id ? C.blueBright : C.textDim,
    border: `1px solid ${activeView === id ? C.blueBright + "40" : C.border}`,
    borderRadius: 4, cursor: "pointer", transition: "all 0.15s",
  });

  return (
    <div style={{ padding: m ? 12 : 22, overflow: "auto", height: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
      <ST>{t("liveHeading")}</ST>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        {LIVE_VIEWS.map(v => (
          <button key={v.id} onClick={() => setActiveView(v.id)} style={tabStyle(v.id)}>
            {t(v.labelKey)}
          </button>
        ))}
        <a href={currentUrl} target="_blank" rel="noopener noreferrer" style={{
          marginLeft: "auto", fontSize: 11, color: C.blueBright, textDecoration: "none",
          alignSelf: "center",
        }}>{t("openInNewTab")} {"\u2197"}</a>
      </div>

      {m ? (
        /* Mobile: link list */
        <Card style={{ padding: "14px 18px" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.white, marginBottom: 10 }}>{t("liveTitle")}</div>
          <div style={{ fontSize: 12, color: C.textDim, marginBottom: 14, lineHeight: 1.7 }}>{t("liveDesc")}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {LIVE_VIEWS.map(v => (
              <a key={v.id} href={getAcsmUrl(v.path)} target="_blank" rel="noopener noreferrer" style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 14px", background: C.bgHover, borderRadius: 4,
                color: C.blueBright, textDecoration: "none", fontSize: 13, fontWeight: 500,
              }}>
                {t(v.labelKey)}
                <span style={{ fontSize: 11, color: C.textDim }}>{"\u2197"}</span>
              </a>
            ))}
          </div>
        </Card>
      ) : (
        /* Desktop: iframe */
        <div style={{
          flex: 1, minHeight: 500, border: `1px solid ${C.border}`, borderRadius: 4,
          overflow: "hidden", background: C.bgDarker,
        }}>
          <iframe
            src={currentUrl}
            style={{ width: "100%", height: "100%", border: "none" }}
            title={t(LIVE_VIEWS.find(v => v.id === activeView).labelKey)}
          />
        </div>
      )}
    </div>
  );
}

// ── TEST DRIVE SCREEN ────────────────────────────────────────────────────────
function TestDriveScreen({ m }) {
  const { t } = useLang();
  const [step, setStep] = useState("car");
  const [selCar, setSelCar] = useState(null);
  const [selTrack, setSelTrack] = useState(null);
  const [selConfig, setSelConfig] = useState(null);
  const [carCat, setCarCat] = useState("all");
  const [trackCat, setTrackCat] = useState("all");
  const [timePreset, setTimePreset] = useState("afternoon");
  const [weatherPreset, setWeatherPreset] = useState("clear");
  const [progress, setProgress] = useState(0);

  const catKeys = { all: "tdCatAll", street: "tdCatStreet", cup: "tdCatCup", gt3: "tdCatGt3", gt: "tdCatGt", openwheel: "tdCatOpenwheel" };
  const trackCatKeys = { all: "tdCatAll", circuit: "tdCatCircuit", short: "tdCatShort" };
  const timeKeys = { dawn: "tdDawn", morning: "tdMorning", afternoon: "tdAfternoon", sunset: "tdSunset", evening: "tdEvening", night: "tdNight" };
  const weatherKeys = { clear: "tdClear", cloudy: "tdCloudy", lightrain: "tdLightRain", rain: "tdRain", dynamic: "tdDynamic" };
  const carEmojis = { street: "\uD83D\uDE97", cup: "\uD83C\uDFC6", gt3: "\uD83C\uDFC1", gt: "\uD83D\uDD25", openwheel: "\u2699\uFE0F" };

  const filteredCars = carCat === "all" ? TD_CARS : TD_CARS.filter(c => c.cat === carCat);
  const filteredTracks = trackCat === "all" ? TD_TRACKS : TD_TRACKS.filter(tr => tr.cat === trackCat);

  const selectedTime = TD_TIME_PRESETS.find(p => p.id === timePreset);
  const selectedWeather = TD_WEATHER_PRESETS.find(p => p.id === weatherPreset);

  function launch() {
    if (!selCar || !selTrack || !selConfig) return;
    setStep("launching");
    setProgress(0);
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 18 + 4;
      if (p >= 100) {
        p = 100; clearInterval(iv);
        const ini = buildRaceIni({
          carId: selCar.id,
          trackId: selTrack.id,
          trackConfig: selConfig.config,
          hour: selectedTime.hour,
          weatherGraphics: selectedWeather.graphics,
        });
        window.location.href = getTestDriveUrl(ini);
        setTimeout(() => setStep("done"), 400);
      }
      setProgress(Math.min(p, 100));
    }, 220);
  }

  function reset() { setStep("car"); setSelCar(null); setSelTrack(null); setSelConfig(null); setProgress(0); }

  const tabBtn = (active, onClick, label) => ({
    onClick,
    style: {
      padding: m ? "7px 12px" : "7px 14px", fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
      border: "none", background: "none", cursor: "pointer", fontFamily: "inherit",
      color: active ? C.blueBright : C.textDim,
      borderBottom: active ? `2px solid ${C.blueBright}` : "2px solid transparent",
      whiteSpace: "nowrap",
    },
  });

  // ── STEP: LAUNCHING / DONE ──
  if (step === "launching" || step === "done") {
    const launchSteps = [
      [25, t("tdBuildingConfig")],
      [55, t("tdPreparingTrack")],
      [80, t("tdPreparingCar")],
      [95, t("tdStartingCM")],
    ];
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: 24, padding: 20 }}>
        {step === "done" ? (
          <>
            <div style={{ fontSize: 52, marginBottom: 4 }}>{"\uD83C\uDFC1"}</div>
            <div style={{ fontSize: m ? 18 : 22, fontWeight: 700, color: C.white }}>{t("tdSessionStarted")}</div>
            <div style={{ fontSize: 13, color: C.textDim, textAlign: "center" }}>
              {selCar?.name} {"\u00B7"} {selTrack?.name} ({selConfig?.label})
            </div>
            <div style={{
              background: `linear-gradient(135deg,${C.bgCard},${C.bgActive})`,
              border: `1px solid ${C.green}`, borderRadius: 6, padding: "16px 24px", textAlign: "center", marginTop: 4,
            }}>
              <div style={{ fontSize: 11, color: C.green, letterSpacing: 2, fontWeight: 700, marginBottom: 6 }}>{"\u2713"} ASSETTO CORSA</div>
              <div style={{ fontSize: 12, color: C.textDim }}>{t("tdCmOpened")}</div>
            </div>
            <button className="ir-btn-blue" onClick={reset}>{t("tdNewSession")}</button>
          </>
        ) : (
          <>
            <div style={{ position: "relative", width: 80, height: 80 }}>
              <svg width="80" height="80" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="40" cy="40" r="34" fill="none" stroke={C.border} strokeWidth="6"/>
                <circle cx="40" cy="40" r="34" fill="none" stroke={C.blueBright} strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)}`}
                  style={{ transition: "stroke-dashoffset 0.2s ease", filter: `drop-shadow(0 0 6px ${C.blueBright})` }}
                />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: C.white }}>
                {Math.round(progress)}%
              </div>
            </div>
            <div style={{ fontSize: m ? 17 : 20, fontWeight: 700, color: C.white }}>{t("tdStarting")}</div>
            <div style={{ fontSize: 12, color: C.textDim, textAlign: "center" }}>
              {selCar?.name}<br/>
              <span style={{ color: C.textMuted }}>{selTrack?.name} {"\u00B7"} {selConfig?.label}</span>
            </div>
            {launchSteps.map(([thresh, label]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
                <span style={{ color: progress >= thresh ? C.green : C.textMuted, fontSize: 14 }}>
                  {progress >= thresh ? "\u2713" : "\u25CB"}
                </span>
                <span style={{ color: progress >= thresh ? C.text : C.textMuted }}>{label}</span>
              </div>
            ))}
          </>
        )}
      </div>
    );
  }

  // ── STEP: OPTIONS ──
  if (step === "options") {
    return (
      <div style={{ padding: m ? 12 : 22, overflow: "auto", height: "100%", maxWidth: 700 }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 12 }}>
          <button onClick={() => setStep("car")} style={{ background: "none", border: "none", cursor: "pointer", color: C.blue, padding: 0, fontFamily: "inherit", fontSize: 12 }}>{t("tdCar")}</button>
          <span style={{ color: C.textMuted }}>{"\u203A"}</span>
          <button onClick={() => setStep("track")} style={{ background: "none", border: "none", cursor: "pointer", color: C.blue, padding: 0, fontFamily: "inherit", fontSize: 12 }}>{t("tdTrack")}</button>
          <span style={{ color: C.textMuted }}>{"\u203A"}</span>
          <span style={{ color: C.white, fontWeight: 600 }}>{t("tdOptions")}</span>
        </div>

        <ST>{t("tdOptions")}</ST>

        {/* Summary bar */}
        <Card style={{ padding: "12px 14px", marginBottom: 18 }}>
          <div style={{ display: "flex", gap: m ? 10 : 20, flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 9, color: C.textMuted, letterSpacing: 1.5, marginBottom: 2 }}>{t("tdCar").toUpperCase()}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.white }}>{selCar?.name}</div>
            </div>
            <div style={{ color: C.border }}>{"\u2502"}</div>
            <div>
              <div style={{ fontSize: 9, color: C.textMuted, letterSpacing: 1.5, marginBottom: 2 }}>{t("tdTrack").toUpperCase()}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.white }}>{selTrack?.name}</div>
            </div>
            <div style={{ color: C.border }}>{"\u2502"}</div>
            <div>
              <div style={{ fontSize: 9, color: C.textMuted, letterSpacing: 1.5, marginBottom: 2 }}>CONFIG</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.white }}>{selConfig?.label}</div>
            </div>
          </div>
        </Card>

        <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "1fr 1fr", gap: 14, marginBottom: 20 }}>
          {/* Time of day */}
          <div>
            <div style={{ fontSize: 11, color: C.textDim, marginBottom: 8, fontWeight: 600 }}>{t("tdTimeOfDay").toUpperCase()}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {TD_TIME_PRESETS.map(tp => (
                <button key={tp.id} onClick={() => setTimePreset(tp.id)} style={{
                  padding: "7px 14px", borderRadius: 3,
                  border: `1px solid ${timePreset === tp.id ? C.blue : C.border}`,
                  background: timePreset === tp.id ? C.bgActive : "transparent",
                  color: timePreset === tp.id ? C.blueBright : C.textDim,
                  fontFamily: "inherit", fontSize: 12, cursor: "pointer",
                  fontWeight: timePreset === tp.id ? 700 : 400,
                }}>{t(timeKeys[tp.id])}</button>
              ))}
            </div>
          </div>
          {/* Weather */}
          <div>
            <div style={{ fontSize: 11, color: C.textDim, marginBottom: 8, fontWeight: 600 }}>{t("tdWeather").toUpperCase()}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {TD_WEATHER_PRESETS.map(wp => (
                <button key={wp.id} onClick={() => setWeatherPreset(wp.id)} style={{
                  padding: "7px 12px", borderRadius: 3,
                  border: `1px solid ${weatherPreset === wp.id ? C.blue : C.border}`,
                  background: weatherPreset === wp.id ? C.bgActive : "transparent",
                  color: weatherPreset === wp.id ? C.blueBright : C.textDim,
                  fontFamily: "inherit", fontSize: 12, cursor: "pointer",
                  fontWeight: weatherPreset === wp.id ? 700 : 400,
                  display: "flex", alignItems: "center", gap: 5,
                }}>{wp.emoji} {t(weatherKeys[wp.id])}</button>
              ))}
            </div>
          </div>
        </div>

        <button className="ir-btn-blue" onClick={launch} style={{ padding: "13px 32px", fontSize: 15, width: m ? "100%" : "auto" }}>
          {"\u25B6"} {t("tdLaunch")}
        </button>
        <div style={{ marginTop: 10, fontSize: 11, color: C.textMuted }}>
          {t("tdNeedsCM")}{" "}
          <a href="https://acstuff.ru/app/" target="_blank" rel="noopener noreferrer" style={{ color: C.blueBright, textDecoration: "none" }}>acstuff.ru {"\u2197"}</a>
        </div>
      </div>
    );
  }

  // ── STEP: TRACK ──
  if (step === "track") {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "12px 16px", background: C.bgDarker, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10, flexShrink: 0, flexWrap: "wrap" }}>
          <button onClick={() => setStep("car")} style={{ background: "none", border: "none", cursor: "pointer", color: C.blueBright, fontSize: 20, padding: 0, lineHeight: 1 }}>{"\u2039"}</button>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.white, flex: 1 }}>{t("tdSelectTrack")}</span>
          <span style={{ fontSize: 11, color: C.textDim }}>
            {t("tdCar")}: <span style={{ color: C.text, fontWeight: 600 }}>{selCar?.name}</span>
          </span>
        </div>
        {/* Filter */}
        <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, background: C.bgDarker, overflowX: "auto", flexShrink: 0 }}>
          {Object.entries(trackCatKeys).map(([key, strKey]) => (
            <button key={key} {...tabBtn(trackCat === key, () => setTrackCat(key), t(strKey))}>{t(strKey).toUpperCase()}</button>
          ))}
        </div>
        {/* Track list */}
        <div style={{ overflow: "auto", flex: 1 }}>
          {filteredTracks.map((tr, i) => (
            <div key={tr.id} className="ir-row" style={{
              display: "flex", alignItems: "center", gap: 12, padding: m ? "13px 14px" : "11px 14px",
              borderBottom: `1px solid ${C.borderSub}`,
              background: i % 2 === 0 ? C.bgCard : "transparent",
            }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{tr.country}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{tr.name}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
                  {tr.configs.map(cfg => (
                    <button key={cfg.config} onClick={() => { setSelTrack(tr); setSelConfig(cfg); setStep("options"); }} style={{
                      fontSize: 10, padding: "3px 9px", borderRadius: 2,
                      border: `1px solid ${C.border}`, background: C.bgHover,
                      color: C.textDim, cursor: "pointer", fontFamily: "inherit",
                      transition: "all 0.1s",
                    }}
                    onMouseEnter={e => { e.target.style.borderColor = C.blue; e.target.style.color = C.blueBright; }}
                    onMouseLeave={e => { e.target.style.borderColor = C.border; e.target.style.color = C.textDim; }}
                    >{cfg.label}</button>
                  ))}
                </div>
              </div>
              <span style={{ fontSize: 9, color: C.textMuted, background: C.bgCard, border: `1px solid ${C.borderSub}`, padding: "2px 8px", borderRadius: 2, flexShrink: 0, textTransform: "uppercase", letterSpacing: 1 }}>{t(trackCatKeys[tr.cat])}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── STEP: CAR (default) ──
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Page header */}
      <div style={{ padding: "14px 18px", background: C.bgDarker, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ fontSize: m ? 16 : 18, fontWeight: 700, color: C.white, marginBottom: 3 }}>{t("testdrive")}</div>
        <div style={{ fontSize: 11, color: C.textDim }}>{t("tdSubtitle")}</div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: m ? "column" : "row", overflow: "hidden" }}>
        {/* Car selector */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", borderRight: m ? "none" : `1px solid ${C.border}` }}>
          {/* Filter tabs */}
          <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, background: C.bgDarker, overflowX: "auto", flexShrink: 0 }}>
            {Object.entries(catKeys).map(([key, strKey]) => (
              <button key={key} {...tabBtn(carCat === key, () => setCarCat(key), t(strKey))}>{t(strKey).toUpperCase()}</button>
            ))}
          </div>

          {/* Car list */}
          <div style={{ overflow: "auto", flex: 1 }}>
            {filteredCars.map((car, i) => {
              const sel = selCar?.id === car.id;
              return (
                <div key={car.id} onClick={() => setSelCar(car)} className="ir-series-row" style={{
                  display: "flex", alignItems: "center", gap: 10, padding: m ? "12px 14px" : "10px 14px",
                  borderBottom: `1px solid ${C.borderSub}`,
                  borderLeft: sel ? `3px solid ${C.blueBright}` : "3px solid transparent",
                  background: sel ? C.bgActive : i % 2 === 0 ? C.bgCard : "transparent",
                  cursor: "pointer",
                }}>
                  {/* Car icon */}
                  <div style={{
                    width: m ? 38 : 34, height: m ? 38 : 34, borderRadius: 3, flexShrink: 0,
                    background: sel ? `linear-gradient(135deg,${C.blue},${C.blueDim})` : `linear-gradient(135deg,${C.bgHover},${C.bgCard})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, border: `1px solid ${sel ? C.blue : C.border}`,
                  }}>{carEmojis[car.cat] || "\uD83C\uDFCE"}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: m ? 14 : 13, fontWeight: 600, color: sel ? C.white : C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{car.name}</div>
                  </div>
                  <span style={{ fontSize: 9, color: sel ? C.blueBright : C.textMuted, background: sel ? C.blueDim : C.bgCard, border: `1px solid ${sel ? C.blue : C.borderSub}`, padding: "2px 8px", borderRadius: 2, flexShrink: 0, letterSpacing: 1, textTransform: "uppercase" }}>{t(catKeys[car.cat])}</span>
                </div>
              );
            })}
          </div>

          {/* Continue button */}
          {selCar && (
            <div style={{ padding: "12px 14px", borderTop: `1px solid ${C.border}`, background: C.bgDarker, flexShrink: 0 }}>
              <button className="ir-btn-blue" onClick={() => setStep("track")} style={{ width: "100%", padding: "11px 0" }}>
                {t("tdContinueWith")} {selCar.name} {"\u2192"}
              </button>
            </div>
          )}
        </div>

        {/* Tips panel — desktop only */}
        {!m && (
          <div style={{ width: 260, flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "9px 14px", borderBottom: `1px solid ${C.border}`, background: C.bgDarker }}>
              <span style={{ fontSize: 10, color: C.blue, letterSpacing: 2, fontWeight: 700 }}>{t("tdTips")}</span>
            </div>
            <div style={{ padding: "12px 14px" }}>
              {["tdTip1", "tdTip2", "tdTip3"].map((tip, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, fontSize: 11, color: C.textDim }}>
                  <span style={{ color: C.blue, flexShrink: 0 }}>{"\u25CF"}</span>{t(tip)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [profileSteamId, setProfileSteamId] = useState(null);
  const [time, setTime] = useState(new Date());
  const [lang, setLang] = useState(() => localStorage.getItem("acr-lang") || "no");
  const width = useWidth();
  const m = width < 700;
  const servers = useAllServers();
  const auth = useAuth();

  const toggleLang = () => {
    const next = lang === "no" ? "en" : "no";
    setLang(next);
    localStorage.setItem("acr-lang", next);
  };

  const t = (key) => STRINGS[lang]?.[key] ?? STRINGS.no[key] ?? key;

  const navigateToProfile = useCallback((steamId) => {
    setProfileSteamId(steamId);
    setPage("profile");
    window.location.hash = `profile/${steamId}`;
  }, []);

  // Hash-based routing for direct profile links
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith("#profile/")) {
        const id = hash.slice(9);
        if (/^7656119\d{10}$/.test(id)) {
          setProfileSteamId(id);
          setPage("profile");
        }
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Clear hash when navigating away from profile
  const handleNav = useCallback((p) => {
    setPage(p);
    if (p !== "profile") {
      window.location.hash = "";
      setProfileSteamId(null);
    }
  }, []);

  const totalPlayers = ["trackday", "mx5cup", "gt3"].reduce((sum, id) => sum + (servers[id].data?.clients || 0), 0);
  const anyOnline = ["trackday", "mx5cup", "gt3"].some(id => servers[id].online);

  const titles = { home: t("home"), servers: t("servers"), schedule: t("schedule"), testdrive: t("testdrive"), stats: t("stats"), live: t("live"), profile: t("profile") };
  const screens = {
    home:      <HomeScreen m={m} servers={servers} onNav={handleNav} />,
    servers:   <ServersScreen m={m} servers={servers} />,
    schedule:  <ScheduleScreen m={m} />,
    testdrive: <TestDriveScreen m={m} />,
    stats:     <StatsScreen m={m} navigateToProfile={navigateToProfile} />,
    live:      <LiveScreen m={m} />,
    profile:   <ProfileScreen m={m} steamId={profileSteamId} auth={auth} onNav={handleNav} />,
  };

  return (
    <LangContext.Provider value={{ lang, toggleLang }}>
      <div style={{
        height: "100vh", width: "100%", background: C.bg, color: C.text,
        display: "flex", flexDirection: "column",
        fontFamily: "'Barlow','Segoe UI',system-ui,sans-serif", overflow: "hidden",
      }}>
        <style>{`
          *{box-sizing:border-box;margin:0;padding:0;}
          ::-webkit-scrollbar{width:5px;height:5px;}
          ::-webkit-scrollbar-track{background:${C.bgDarker};}
          ::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px;}
          ::-webkit-scrollbar-thumb:hover{background:${C.blue};}
          .ir-btn-blue{
            background:linear-gradient(135deg,${C.blue},#0d4a96);
            color:#fff;border:none;border-radius:3px;
            padding:9px 20px;font-family:inherit;font-weight:700;
            font-size:13px;cursor:pointer;letter-spacing:0.3px;
            transition:all 0.15s;box-shadow:0 2px 8px rgba(26,107,196,0.35);
          }
          .ir-btn-blue:hover{
            background:linear-gradient(135deg,${C.blueHov},#1356a8);
            box-shadow:0 3px 12px rgba(26,107,196,0.5);transform:translateY(-1px);
          }
          .ir-btn-ghost{
            background:transparent;color:${C.text};
            border:1px solid ${C.border};border-radius:3px;
            padding:9px 20px;font-family:inherit;
            font-size:13px;cursor:pointer;transition:all 0.15s;
          }
          .ir-btn-ghost:hover{border-color:${C.blue};color:${C.blueBright};}
          .ir-row{transition:background 0.1s;}
          .ir-row:hover{background:${C.bgHover} !important;}
          .nav-item,.ir-series-row{transition:all 0.1s;}
          .nav-item:hover{background:${C.bgHover} !important;}
          .ir-series-row:hover{background:${C.bgHover} !important;}
          @keyframes fadeIn{from{opacity:0;transform:translateY(4px);}to{opacity:1;transform:translateY(0);}}
          @keyframes pulse{0%,100%{opacity:0.4;}50%{opacity:1;}}
          .screen{animation:fadeIn 0.2s ease;}
          .profile-link{cursor:pointer;transition:color 0.15s;}
          .profile-link:hover{color:${C.blueBright} !important;}
        `}</style>

        {m ? (
          <MobileHeader title={titles[page] || "aCRacing"} totalPlayers={totalPlayers} auth={auth} onProfile={navigateToProfile} />
        ) : (
          <DesktopTopBar time={time} totalPlayers={totalPlayers} anyOnline={anyOnline} />
        )}

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {!m && <Sidebar active={page} onNav={handleNav} auth={auth} onProfile={navigateToProfile} />}
          <div className="screen" key={page === "profile" ? `profile-${profileSteamId}` : page} style={{ flex: 1, overflow: "hidden" }}>
            {screens[page] || <HomeScreen m={m} servers={servers} />}
          </div>
        </div>

        {m ? (
          <MobileTabBar active={page} onNav={handleNav} />
        ) : (
          <div style={{
            height: 28, flexShrink: 0, background: C.bgDarker,
            borderTop: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", padding: "0 18px",
            gap: 22, fontSize: 10, color: C.textMuted, letterSpacing: 0.5,
          }}>
            <span style={{ color: anyOnline ? C.green : C.red, display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: anyOnline ? C.green : C.red, display: "inline-block", boxShadow: `0 0 6px ${anyOnline ? C.green : C.red}` }} />
              {anyOnline ? t("statusConnected") : t("statusDisconnected")}
            </span>
            <span>aCRacing {"\u2014"} 3 servere</span>
            <span>AssettoServer 0.0.54</span>
            <span style={{ marginLeft: "auto" }}>{totalPlayers} {t("playersOnline")}</span>
          </div>
        )}
      </div>
    </LangContext.Provider>
  );
}
