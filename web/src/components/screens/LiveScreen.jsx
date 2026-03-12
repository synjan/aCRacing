import { useState } from "react";
import { useTheme } from "../../theme";
import { useLang } from "../../hooks/useLang";
import { useLiveData } from "../../hooks/useLiveData";
import { SERVERS, LIVE_VIEWS, SERVER_TYPES, TRACK_NAMES, getAcsmUrl } from "../../data/servers";
import { ST, Card, StatusDot } from "../shared";

function LiveServerCard({ serverId, m }) {
  const { palette: C } = useTheme();
  const { t } = useLang();
  const { data, loading } = useLiveData(serverId);
  const st = SERVER_TYPES[serverId];

  return (
    <Card style={{ padding: m ? 12 : 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <StatusDot status={data?.driverCount > 0 ? "online" : "offline"} />
        <span style={{ fontSize: 14, fontWeight: 700, color: st?.color || C.white }}>{st?.label || serverId}</span>
        {data?.session && (
          <span style={{
            fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 3,
            background: data.session.type === "Race" ? "rgba(34,197,94,0.08)" :
                       data.session.type === "Qualifying" ? "rgba(59,154,254,0.08)" : "rgba(192,132,252,0.08)",
            color: data.session.type === "Race" ? C.green :
                   data.session.type === "Qualifying" ? C.blueBright : C.purple,
          }}>{data.session.type}</span>
        )}
        {data && <span style={{ fontSize: 11, color: C.textDim, marginLeft: "auto" }}>{data.driverCount}/{data.maxClients}</span>}
      </div>

      {loading ? (
        <div style={{ fontSize: 11, color: C.textDim }}>{t("loading")}</div>
      ) : !data?.session ? (
        <div style={{ fontSize: 11, color: C.textDim }}>{t("noLiveData")}</div>
      ) : (
        <>
          {data.session.track && (
            <div style={{ fontSize: 12, color: C.text, marginBottom: 8 }}>
              {TRACK_NAMES[data.session.track] || data.session.track}
            </div>
          )}
          {data.drivers.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {data.drivers.map((d, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "4px 8px",
                  background: i % 2 === 0 ? C.bgHover : "transparent", borderRadius: 2,
                  fontSize: 12,
                }}>
                  <span style={{ color: C.white, flex: 1 }}>{d.name}</span>
                  <span style={{ color: C.textDim, fontSize: 11 }}>{d.car}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 11, color: C.textMuted }}>{t("noPlayersFound")}</div>
          )}
        </>
      )}
    </Card>
  );
}

export function LiveScreen({ m }) {
  const { palette: C } = useTheme();
  const { t } = useLang();
  const [tab, setTab] = useState("dashboard");
  const [mapView, setMapView] = useState("live-timing");

  const tabStyle = (id) => ({
    padding: m ? "7px 14px" : "8px 20px", fontSize: m ? 11 : 12, fontWeight: 600,
    background: tab === id ? "rgba(26,107,196,0.12)" : "transparent",
    color: tab === id ? C.blueBright : C.textDim,
    border: `1px solid ${tab === id ? C.blueBright + "40" : C.border}`,
    borderRadius: 4, cursor: "pointer", transition: "all 0.15s",
  });

  return (
    <div style={{ padding: m ? 12 : 22, overflow: "auto", height: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
      <ST>{t("liveHeading")}</ST>

      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <button onClick={() => setTab("dashboard")} style={tabStyle("dashboard")}>{t("liveDashboard")}</button>
        <button onClick={() => setTab("map")} style={tabStyle("map")}>{t("liveMap")}</button>
      </div>

      {tab === "dashboard" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {SERVERS.map(s => (
            <LiveServerCard key={s.id} serverId={s.id} m={m} />
          ))}
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: C.textDim }}>{t("liveView")}:</span>
            <select value={mapView} onChange={e => setMapView(e.target.value)} style={{
              background: C.bgCard, color: C.text, border: `1px solid ${C.border}`,
              borderRadius: 3, padding: "4px 8px", fontSize: 12, fontFamily: "inherit",
            }}>
              {LIVE_VIEWS.map(v => <option key={v.id} value={v.id}>{t(v.labelKey)}</option>)}
            </select>
            <a href={getAcsmUrl(LIVE_VIEWS.find(v => v.id === mapView).path)} target="_blank" rel="noopener noreferrer"
               style={{ marginLeft: "auto", fontSize: 11, color: C.blueBright, textDecoration: "none" }}>
              {t("openInNewTab")} {"\u2197"}
            </a>
          </div>
          {m ? (
            <Card style={{ padding: "14px 18px" }}>
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
            <div style={{
              flex: 1, minHeight: 500, border: `1px solid ${C.border}`, borderRadius: 4,
              overflow: "hidden", background: C.bgDarker,
            }}>
              <iframe
                src={getAcsmUrl(LIVE_VIEWS.find(v => v.id === mapView).path)}
                style={{ width: "100%", height: "100%", border: "none" }}
                title={t(LIVE_VIEWS.find(v => v.id === mapView).labelKey)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
