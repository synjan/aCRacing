import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../theme";
import { useLang } from "../../hooks/useLang";
import { SERVERS, MX5_ROTATION, GT3_ROTATION, NEWS, SERVER_TYPES, carBadgeSrc, uniqueBrands, trackDisplayName, getSessionInfo, getNextSession, getTodaysTrack, getJoinUrl, getStatusType } from "../../data/servers";
import { ST, Card, StatusDot, ServerBadge } from "../shared";
import { LiveWidget } from "../shared/LiveWidget";

function useHealth() {
  const [health, setHealth] = useState({});
  useEffect(() => {
    function load() {
      fetch("/api/health", { signal: AbortSignal.timeout(5000) })
        .then(r => r.ok ? r.json() : {})
        .then(setHealth)
        .catch(() => {});
    }
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, []);
  return health;
}

export function HomeScreen({ m, servers, lastSession }) {
  const { palette: C } = useTheme();
  const { t } = useLang();
  const navigate = useNavigate();
  const health = useHealth();

  return (
    <div style={{ padding: m ? 12 : 22, overflow: "auto", height: "100%", display: "flex", flexDirection: m ? "column" : "row", gap: m ? 14 : 20 }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: m ? 14 : 18, minWidth: 0 }}>
        {/* Last Session (Phase 8) */}
        {lastSession && (
          <div style={{
            background: C.bgCard, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.green}`,
            borderRadius: 4, padding: "14px 16px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{"\u25B6"}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, color: C.textMuted, letterSpacing: 1, marginBottom: 2, textTransform: "uppercase" }}>{t("lastSession")}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.white }}>{lastSession.serverName}</div>
              </div>
              <a href={getJoinUrl(lastSession.httpPort)} className="ir-btn-blue" style={{
                textDecoration: "none", fontSize: 12, padding: "7px 16px",
              }}>{t("connectAgain")}</a>
            </div>
          </div>
        )}

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
              const h = health[s.id];

              return (
                <Card key={s.id} style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <StatusDot status={st} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: C.white, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                    <ServerBadge serverId={s.id} />
                  </div>
                  {h && (
                    <div style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 10 }}>
                      {h.responseMs != null && (
                        <span style={{ color: h.responseMs < 100 ? C.green : h.responseMs < 300 ? C.orange : C.red, fontFamily: "Consolas, monospace" }}>
                          {h.responseMs}ms
                        </span>
                      )}
                      <span style={{ color: parseFloat(h.uptimePercent) >= 99 ? C.green : parseFloat(h.uptimePercent) >= 90 ? C.orange : C.red, fontFamily: "Consolas, monospace" }}>
                        {h.uptimePercent}% {t("uptime").toLowerCase()}
                      </span>
                    </div>
                  )}
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
                  <LiveWidget serverId={s.id} />
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
        <div onClick={() => navigate("/testdrive")} className="ir-row" style={{
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
