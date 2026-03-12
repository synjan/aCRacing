import { useState } from "react";
import { useTheme } from "../../theme";
import { useLang } from "../../hooks/useLang";
import { useNotificationSettings } from "../../hooks/useNotificationSettings";
import { SERVERS, SERVER_TYPES, carBadgeSrc, uniqueBrands, trackDisplayName, getSessionInfo, getStatsUrl, getLiveUrl, getJoinUrl, getStatusType } from "../../data/servers";
import { ST, Card, StatusDot, ModeBadge, ServerBadge } from "../shared";

export function ServersScreen({ m, servers }) {
  const [sel, setSel] = useState(null);
  const { palette: C } = useTheme();
  const { t } = useLang();
  const { settings: notifSettings, toggleServer: toggleNotif } = useNotificationSettings();
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
          {selected.mode === "Race" && (
            <button onClick={() => toggleNotif(selected.id)} style={{
              display: "block", width: "100%", marginTop: 8, padding: "10px 0",
              background: notifSettings.servers[selected.id] ? "rgba(34,197,94,0.12)" : "transparent",
              border: `1px solid ${notifSettings.servers[selected.id] ? C.green + "40" : C.border}`,
              borderRadius: 3, cursor: "pointer", fontSize: 12, fontWeight: 600,
              color: notifSettings.servers[selected.id] ? C.green : C.textDim, fontFamily: "inherit",
            }}>{notifSettings.servers[selected.id] ? "\u2714 " : "\u{1F514} "}{t("notifyMe")}</button>
          )}
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
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {selected.mode === "Race" && (
                  <button onClick={() => toggleNotif(selected.id)} style={{
                    background: notifSettings.servers[selected.id] ? "rgba(34,197,94,0.12)" : "transparent",
                    border: `1px solid ${notifSettings.servers[selected.id] ? C.green + "40" : C.border}`,
                    borderRadius: 3, padding: "9px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600,
                    color: notifSettings.servers[selected.id] ? C.green : C.textDim, fontFamily: "inherit",
                  }}>{notifSettings.servers[selected.id] ? "\u2714 " : "\u{1F514} "}{t("notifyMe")}</button>
                )}
                <a href={st !== "offline" ? getJoinUrl(selected.httpPort) : undefined} className="ir-btn-blue" style={{
                  fontSize: 13, padding: "9px 22px", textDecoration: "none",
                  opacity: st === "offline" ? 0.4 : 1, pointerEvents: st === "offline" ? "none" : "auto",
                }}>{t("connectUpper")}</a>
              </div>
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
