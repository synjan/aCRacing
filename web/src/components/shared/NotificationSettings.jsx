import { useTheme } from "../../theme";
import { useLang } from "../../hooks/useLang";
import { useNotificationSettings } from "../../hooks/useNotificationSettings";
import { Card } from "../shared";

export function NotificationSettings() {
  const { palette: C } = useTheme();
  const { t } = useLang();
  const { settings, updateSettings, toggleServer } = useNotificationSettings();

  const rowStyle = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.borderSub}` };
  const labelStyle = { fontSize: 12, color: C.text };
  const toggleBtnStyle = (active) => ({
    width: 36, height: 20, borderRadius: 10, border: "none", cursor: "pointer",
    background: active ? C.green : C.border, position: "relative", transition: "background 0.2s",
  });
  const toggleDotStyle = (active) => ({
    width: 16, height: 16, borderRadius: "50%", background: "#fff",
    position: "absolute", top: 2, left: active ? 18 : 2, transition: "left 0.2s",
  });

  return (
    <Card style={{ padding: 16, marginTop: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.white, marginBottom: 12 }}>{t("notificationSettings")}</div>

      {/* Server toggles */}
      {["mx5cup", "gt3"].map(id => (
        <div key={id} style={rowStyle}>
          <span style={labelStyle}>{id === "mx5cup" ? "MX-5 Cup" : "GT3 Series"}</span>
          <button onClick={() => toggleServer(id)} style={toggleBtnStyle(settings.servers[id])}>
            <span style={toggleDotStyle(settings.servers[id])} />
          </button>
        </div>
      ))}

      {/* Minutes before */}
      <div style={rowStyle}>
        <span style={labelStyle}>{t("minutesBefore")}</span>
        <select
          value={settings.minutesBefore}
          onChange={e => updateSettings({ minutesBefore: parseInt(e.target.value) })}
          style={{ background: C.bgCard, color: C.text, border: `1px solid ${C.border}`, borderRadius: 3, padding: "3px 6px", fontSize: 12, fontFamily: "inherit" }}
        >
          {[5, 10, 15, 20].map(m => <option key={m} value={m}>{m} min</option>)}
        </select>
      </div>

      {/* Notification types */}
      {[
        { key: "raceStart", label: t("raceStartNotif") },
        { key: "qualifyEnd", label: t("qualifyEndNotif") },
        { key: "personalRecord", label: t("personalRecordNotif") },
      ].map(({ key, label }) => (
        <div key={key} style={rowStyle}>
          <span style={labelStyle}>{label}</span>
          <button onClick={() => updateSettings({ types: { ...settings.types, [key]: !settings.types[key] } })} style={toggleBtnStyle(settings.types[key])}>
            <span style={toggleDotStyle(settings.types[key])} />
          </button>
        </div>
      ))}

      {/* Quiet hours */}
      <div style={rowStyle}>
        <span style={labelStyle}>{t("quietHours")}</span>
        <button onClick={() => updateSettings({ quietHours: { ...settings.quietHours, enabled: !settings.quietHours.enabled } })} style={toggleBtnStyle(settings.quietHours.enabled)}>
          <span style={toggleDotStyle(settings.quietHours.enabled)} />
        </button>
      </div>
      {settings.quietHours.enabled && (
        <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 0" }}>
          <span style={{ fontSize: 11, color: C.textDim }}>{t("quietFrom")}</span>
          <input type="time" value={settings.quietHours.from}
            onChange={e => updateSettings({ quietHours: { ...settings.quietHours, from: e.target.value } })}
            style={{ background: C.bgCard, color: C.text, border: `1px solid ${C.border}`, borderRadius: 3, padding: "2px 4px", fontSize: 11, fontFamily: "inherit" }}
          />
          <span style={{ fontSize: 11, color: C.textDim }}>{t("quietTo")}</span>
          <input type="time" value={settings.quietHours.to}
            onChange={e => updateSettings({ quietHours: { ...settings.quietHours, to: e.target.value } })}
            style={{ background: C.bgCard, color: C.text, border: `1px solid ${C.border}`, borderRadius: 3, padding: "2px 4px", fontSize: 11, fontFamily: "inherit" }}
          />
        </div>
      )}
    </Card>
  );
}
