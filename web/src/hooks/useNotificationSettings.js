import { useState, useCallback } from "react";

const STORAGE_KEY = "acr-notification-settings";
const OLD_KEY = "acr-notifications";

const DEFAULTS = {
  servers: {},
  minutesBefore: 10,
  types: { raceStart: true, qualifyEnd: true, personalRecord: true },
  quietHours: { enabled: false, from: "23:00", to: "07:00" },
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };

    // Migrate from old format
    const old = localStorage.getItem(OLD_KEY);
    if (old) {
      const oldPrefs = JSON.parse(old);
      const migrated = { ...DEFAULTS, servers: oldPrefs };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      localStorage.removeItem(OLD_KEY);
      return migrated;
    }
  } catch { /* ignore */ }
  return DEFAULTS;
}

export function useNotificationSettings() {
  const [settings, setSettings] = useState(loadSettings);

  const updateSettings = useCallback((updates) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleServer = useCallback((serverId) => {
    setSettings(prev => {
      const next = { ...prev, servers: { ...prev.servers, [serverId]: !prev.servers[serverId] } };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      if (next.servers[serverId] && "Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }
      return next;
    });
  }, []);

  return { settings, updateSettings, toggleServer };
}

export function isQuietHour(quietHours) {
  if (!quietHours?.enabled) return false;
  const now = new Date();
  const hhmm = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
  const { from, to } = quietHours;
  if (from <= to) return hhmm >= from && hhmm < to;
  return hhmm >= from || hhmm < to; // overnight range
}
