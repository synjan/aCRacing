import { createContext } from "react";

export const LangContext = createContext({ lang: "no", toggleLang: () => {} });

export const STRINGS = {
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

    // Theme
    darkTheme: "M\u00f8rkt tema",
    lightTheme: "Lyst tema",

    // Leaderboard
    allTracks: "Alle baner",
    selectTrack: "Velg bane",
    noLeaderboardData: "Ingen leaderboard-data",

    // Race results
    results: "Resultater",
    raceResults: "Race-resultater",
    noResults: "Ingen resultater enn\u00e5",
    loadMore: "Last mer",
    playersCount: "spillere",

    // Server health
    responseTime: "Responstid",
    uptime: "Oppetid",
    serverHealth: "Serverhelse",

    // Onboarding
    welcome: "Velkommen til aCRacing!",
    whatDoYouWant: "Hva har du lyst til?",
    freeDriving: "Fri kj\u00f8ring",
    racing: "Race",
    testDriving: "Testkj\u00f8ring",
    chooseSeries: "Velg serie",
    todaysTrackIs: "Dagens bane er",
    connectNow: "Koble til n\u00e5",
    dontShowAgain: "Ikke vis igjen",
    skip: "Hopp over",
    next: "Neste",

    // Last session
    continueSession: "Fortsett",
    lastSession: "Siste sesjon",
    connectAgain: "Koble til igjen",

    // Calendar
    calendar: "Kalender",
    nextRaces: "Neste race",
    countdown: "Nedtelling",
    noUpcomingRaces: "Ingen kommende race",

    // Notifications
    notifications: "Varsler",
    notifyMe: "Varsle meg",
    raceStartingSoon: "Race starter snart!",
    qualifyingIn: "Kvalifisering om",

    // Session history
    showAll: "Vis alle",
    filterByServer: "Filtrer etter server",
    filterByType: "Filtrer etter type",
    allServers: "Alle servere",
    allTypes: "Alle typer",

    // Server history
    serverHistory: "Server-historikk",
    firstVisit: "F\u00f8rste bes\u00f8k",
    lastVisit: "Siste bes\u00f8k",
    totalVisits: "Totale bes\u00f8k",

    // Rate limiting
    tooManyRequests: "For mange foresp\u00f8rsler, pr\u00f8v igjen senere",
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

    // Theme
    darkTheme: "Dark theme",
    lightTheme: "Light theme",

    // Leaderboard
    allTracks: "All tracks",
    selectTrack: "Select track",
    noLeaderboardData: "No leaderboard data",

    // Race results
    results: "Results",
    raceResults: "Race results",
    noResults: "No results yet",
    loadMore: "Load more",
    playersCount: "players",

    // Server health
    responseTime: "Response time",
    uptime: "Uptime",
    serverHealth: "Server health",

    // Onboarding
    welcome: "Welcome to aCRacing!",
    whatDoYouWant: "What would you like to do?",
    freeDriving: "Free driving",
    racing: "Racing",
    testDriving: "Test driving",
    chooseSeries: "Choose series",
    todaysTrackIs: "Today's track is",
    connectNow: "Connect now",
    dontShowAgain: "Don't show again",
    skip: "Skip",
    next: "Next",

    // Last session
    continueSession: "Continue",
    lastSession: "Last session",
    connectAgain: "Connect again",

    // Calendar
    calendar: "Calendar",
    nextRaces: "Next races",
    countdown: "Countdown",
    noUpcomingRaces: "No upcoming races",

    // Notifications
    notifications: "Notifications",
    notifyMe: "Notify me",
    raceStartingSoon: "Race starting soon!",
    qualifyingIn: "Qualifying in",

    // Session history
    showAll: "Show all",
    filterByServer: "Filter by server",
    filterByType: "Filter by type",
    allServers: "All servers",
    allTypes: "All types",

    // Server history
    serverHistory: "Server history",
    firstVisit: "First visit",
    lastVisit: "Last visit",
    totalVisits: "Total visits",

    // Rate limiting
    tooManyRequests: "Too many requests, please try again later",
  },
};
