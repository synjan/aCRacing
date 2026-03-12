import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, useParams } from "react-router-dom";
import { C, CLight, ThemeContext, useTheme } from "./theme";
import { LangContext } from "./i18n";
import { useWidth } from "./hooks/useWidth";
import { useAuth } from "./hooks/useAuth";
import { useAllServers } from "./hooks/useServerStatus";
import { useLang } from "./hooks/useLang";
import { Sidebar } from "./components/layout/Sidebar";
import { DesktopTopBar } from "./components/layout/DesktopTopBar";
import { MobileHeader } from "./components/layout/MobileHeader";
import { MobileTabBar } from "./components/layout/MobileTabBar";
import { HomeScreen } from "./components/screens/HomeScreen";
import { ServersScreen } from "./components/screens/ServersScreen";
import { ScheduleScreen } from "./components/screens/ScheduleScreen";
import { StatsScreen } from "./components/screens/StatsScreen";
import { LiveScreen } from "./components/screens/LiveScreen";
import { TestDriveScreen } from "./components/screens/TestDriveScreen";
import { ProfileScreen } from "./components/screens/ProfileScreen";
import { LeaderboardScreen } from "./components/screens/LeaderboardScreen";
import { RaceResultsScreen } from "./components/screens/RaceResultsScreen";
import { StandingsScreen } from "./components/screens/StandingsScreen";
import { CalendarScreen } from "./components/screens/CalendarScreen";
import { OnboardingFlow } from "./components/screens/OnboardingFlow";

function ProfileRoute({ m, auth }) {
  const { steamId } = useParams();
  return <ProfileScreen m={m} steamId={steamId} auth={auth} />;
}

function StatusBar({ totalPlayers, anyOnline }) {
  const { t } = useLang();
  const { palette: P } = useTheme();
  return (
    <div style={{
      height: 28, flexShrink: 0, background: P.bgDarker,
      borderTop: `1px solid ${P.border}`,
      display: "flex", alignItems: "center", padding: "0 18px",
      gap: 22, fontSize: 10, color: P.textMuted, letterSpacing: 0.5,
    }}>
      <span style={{ color: anyOnline ? P.green : P.red, display: "flex", alignItems: "center", gap: 5 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: anyOnline ? P.green : P.red, display: "inline-block", boxShadow: `0 0 6px ${anyOnline ? P.green : P.red}` }} />
        {anyOnline ? t("statusConnected") : t("statusDisconnected")}
      </span>
      <span>aCRacing {"\u2014"} 3 servere</span>
      <span>AssettoServer 0.0.54</span>
      <span style={{ marginLeft: "auto" }}>{totalPlayers} {t("playersOnline")}</span>
    </div>
  );
}

// ── Last session helper (Phase 8) ──
function useLastSession() {
  const [lastSession, setLastSession] = useState(() => {
    try {
      const raw = localStorage.getItem("acr-last-session");
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (Date.now() - data.timestamp > 24 * 60 * 60 * 1000) return null;
      return data;
    } catch { return null; }
  });

  const saveSession = (serverId, serverName, httpPort) => {
    const data = { serverId, serverName, httpPort, timestamp: Date.now() };
    localStorage.setItem("acr-last-session", JSON.stringify(data));
    setLastSession(data);
  };

  return { lastSession, saveSession };
}

// ── Race notification helper (Phase 10) ──
function useRaceNotifications(servers) {
  const [prefs, setPrefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("acr-notifications") || "{}"); } catch { return {}; }
  });
  const [lastNotified, setLastNotified] = useState({});

  const toggleServer = (serverId) => {
    const next = { ...prefs, [serverId]: !prefs[serverId] };
    setPrefs(next);
    localStorage.setItem("acr-notifications", JSON.stringify(next));

    // Request notification permission
    if (next[serverId] && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  };

  // Check for upcoming races
  useEffect(() => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    for (const [id, enabled] of Object.entries(prefs)) {
      if (!enabled) continue;
      const status = servers[id];
      if (!status?.online || !status.data) continue;

      const data = status.data;
      if (!data.sessiontypes || data.sessiontypes.length <= 1) continue;

      const currentType = data.sessiontypes[data.session];
      const nextIdx = (data.session + 1) % data.sessiontypes.length;
      const nextType = data.sessiontypes[nextIdx];

      // Notify when qualifying has < 10min left and next session is race
      if (currentType === 2 && nextType === 3 && data.timeleft > 0 && data.timeleft < 600000) {
        const key = `${id}-${data.session}`;
        if (lastNotified[key]) continue;

        const mins = Math.ceil(data.timeleft / 60000);
        new Notification("aCRacing", {
          body: `Race starter om ${mins} min pa ${id === "mx5cup" ? "MX-5 Cup" : "GT3 Series"}!`,
          icon: "/favicon.ico",
        });
        setLastNotified(prev => ({ ...prev, [key]: true })); // eslint-disable-line react-hooks/set-state-in-effect
      }
    }
  }, [servers, prefs, lastNotified]);

  return { prefs, toggleServer };
}

function AppShell() {
  const { t } = useLang();
  const { palette: P } = useTheme();
  const width = useWidth();
  const m = width < 700;
  const servers = useAllServers();
  const auth = useAuth();
  const [time, setTime] = useState(new Date());
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem("acr-onboarding-done"));
  const location = useLocation();
  const { lastSession } = useLastSession();
  useRaceNotifications(servers);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const totalPlayers = ["trackday", "mx5cup", "gt3"].reduce((sum, id) => sum + (servers[id].data?.clients || 0), 0);
  const anyOnline = ["trackday", "mx5cup", "gt3"].some(id => servers[id].online);

  const pageId = location.pathname === "/" ? "home" : location.pathname.slice(1).split("/")[0] || "home";
  const titles = {
    home: t("home"), servers: t("servers"), schedule: t("schedule"), testdrive: t("testdrive"),
    stats: t("stats"), live: t("live"), profile: t("profile"),
    leaderboard: t("leaderboard"), results: t("raceResults"), standings: t("standings"), calendar: t("calendar"),
  };

  return (
    <div style={{
      height: "100vh", width: "100%", color: P.text,
      display: "flex", flexDirection: "column",
      fontFamily: "'Barlow','Segoe UI',system-ui,sans-serif", overflow: "hidden",
    }}>
      {showOnboarding && <OnboardingFlow onDismiss={() => setShowOnboarding(false)} />}

      {m ? (
        <MobileHeader title={titles[pageId] || "aCRacing"} totalPlayers={totalPlayers} auth={auth} />
      ) : (
        <DesktopTopBar time={time} totalPlayers={totalPlayers} anyOnline={anyOnline} />
      )}

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {!m && <Sidebar auth={auth} />}
        <div className="screen" key={pageId} style={{ flex: 1, overflow: "hidden" }}>
          <Routes>
            <Route path="/" element={<HomeScreen m={m} servers={servers} lastSession={lastSession} />} />
            <Route path="/servers" element={<ServersScreen m={m} servers={servers} />} />
            <Route path="/schedule" element={<ScheduleScreen m={m} />} />
            <Route path="/testdrive" element={<TestDriveScreen m={m} />} />
            <Route path="/stats" element={<StatsScreen m={m} />} />
            <Route path="/live" element={<LiveScreen m={m} />} />
            <Route path="/leaderboard" element={<LeaderboardScreen m={m} />} />
            <Route path="/results" element={<RaceResultsScreen m={m} />} />
            <Route path="/standings" element={<StandingsScreen m={m} />} />
            <Route path="/calendar" element={<CalendarScreen m={m} />} />
            <Route path="/profile/:steamId" element={<ProfileRoute m={m} auth={auth} />} />
            <Route path="*" element={<HomeScreen m={m} servers={servers} lastSession={lastSession} />} />
          </Routes>
        </div>
      </div>

      {m ? <MobileTabBar /> : <StatusBar totalPlayers={totalPlayers} anyOnline={anyOnline} />}
    </div>
  );
}

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem("acr-lang") || "no");
  const [theme, setTheme] = useState(() => localStorage.getItem("acr-theme") || "dark");

  const toggleLang = () => {
    const next = lang === "no" ? "en" : "no";
    setLang(next);
    localStorage.setItem("acr-lang", next);
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("acr-theme", next);
  };

  const palette = theme === "dark" ? C : CLight;

  return (
    <LangContext.Provider value={{ lang, toggleLang }}>
      <ThemeContext.Provider value={{ theme, palette, toggleTheme }}>
        <div style={{ background: palette.bg, minHeight: "100vh" }}>
          <style>{`
            *{box-sizing:border-box;margin:0;padding:0;}
            ::-webkit-scrollbar{width:5px;height:5px;}
            ::-webkit-scrollbar-track{background:${palette.bgDarker};}
            ::-webkit-scrollbar-thumb{background:${palette.border};border-radius:3px;}
            ::-webkit-scrollbar-thumb:hover{background:${palette.blue};}
            .ir-btn-blue{
              background:linear-gradient(135deg,${palette.blue},#0d4a96);
              color:#fff;border:none;border-radius:3px;
              padding:9px 20px;font-family:inherit;font-weight:700;
              font-size:13px;cursor:pointer;letter-spacing:0.3px;
              transition:all 0.15s;box-shadow:0 2px 8px rgba(26,107,196,0.35);
            }
            .ir-btn-blue:hover{
              background:linear-gradient(135deg,${palette.blueHov},#1356a8);
              box-shadow:0 3px 12px rgba(26,107,196,0.5);transform:translateY(-1px);
            }
            .ir-btn-ghost{
              background:transparent;color:${palette.text};
              border:1px solid ${palette.border};border-radius:3px;
              padding:9px 20px;font-family:inherit;
              font-size:13px;cursor:pointer;transition:all 0.15s;
            }
            .ir-btn-ghost:hover{border-color:${palette.blue};color:${palette.blueBright};}
            .ir-row{transition:background 0.1s;}
            .ir-row:hover{background:${palette.bgHover} !important;}
            .nav-item,.ir-series-row{transition:all 0.1s;}
            .nav-item:hover{background:${palette.bgHover} !important;}
            .ir-series-row:hover{background:${palette.bgHover} !important;}
            @keyframes fadeIn{from{opacity:0;transform:translateY(4px);}to{opacity:1;transform:translateY(0);}}
            @keyframes pulse{0%,100%{opacity:0.4;}50%{opacity:1;}}
            .screen{animation:fadeIn 0.2s ease;}
            .profile-link{cursor:pointer;transition:color 0.15s;}
            .profile-link:hover{color:${palette.blueBright} !important;}
          `}</style>
          <BrowserRouter>
            <AppShell />
          </BrowserRouter>
        </div>
      </ThemeContext.Provider>
    </LangContext.Provider>
  );
}
