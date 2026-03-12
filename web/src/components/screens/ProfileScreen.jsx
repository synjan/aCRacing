import { useState, useEffect } from "react";
import { useTheme } from "../../theme";
import { useLang } from "../../hooks/useLang";
import { SERVERS, SERVER_TYPES, TRACK_NAMES, carBadgeSrc, formatLapTime, formatStatsDate, formatDrivingTime } from "../../data/servers";
import { ST, Card, ServerBadge, LangToggle } from "../shared";
import { NotificationSettings } from "../shared/NotificationSettings";

function useProfileData(steamId) {
  const [state, setState] = useState({ data: null, loading: false, error: null });
  useEffect(() => {
    if (!steamId) return;
    setState({ data: null, loading: true, error: null }); // eslint-disable-line react-hooks/set-state-in-effect
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

export function ProfileScreen({ m, steamId, auth }) {
  const { palette: C } = useTheme();
  const { t } = useLang();
  const { data, loading, error } = useProfileData(steamId);
  const isOwnProfile = auth.user?.steamId === steamId;
  const [allSessions, setAllSessions] = useState(null);
  const [sessPage, setSessPage] = useState(1);
  const [sessTotal, setSessTotal] = useState(0);
  const [sessLoading, setSessLoading] = useState(false);
  const [sessFilter, setSessFilter] = useState("");

  function loadAllSessions(page = 1, server = "") {
    setSessLoading(true);
    const url = `/api/profile/${steamId}/sessions?page=${page}&limit=20${server ? `&server=${server}` : ""}`;
    fetch(url, { signal: AbortSignal.timeout(10000) })
      .then(r => r.ok ? r.json() : { sessions: [], total: 0 })
      .then(d => {
        if (page === 1) setAllSessions(d.sessions);
        else setAllSessions(prev => [...(prev || []), ...d.sessions]);
        setSessTotal(d.total);
        setSessPage(page);
        setSessLoading(false);
      })
      .catch(() => setSessLoading(false));
  }

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
          { label: t("totalDrivingTime"), value: formatDrivingTime(data.summary.totalDrivingTimeMs) },
        ].map(({ label, value, sub }) => (
          <Card key={label} style={{ padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: C.white, fontFamily: "Consolas, monospace" }}>
              {value}{sub && <span style={{ fontSize: 12, color: C.textDim }}> {sub}</span>}
            </div>
            <div style={{ fontSize: 10, color: C.textDim, marginTop: 4, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
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
            {!allSessions && (
              <div style={{ padding: "10px 14px", textAlign: "center" }}>
                <button className="ir-btn-ghost" onClick={() => loadAllSessions(1, sessFilter)} style={{ fontSize: 11, padding: "6px 16px" }}>
                  {t("showAll")}
                </button>
              </div>
            )}
          </Card>

          {/* Paginated full session history (Phase 5) */}
          {allSessions && (
            <div style={{ marginTop: 10 }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: 10, color: C.textMuted, letterSpacing: 1, fontWeight: 700 }}>{t("showAll").toUpperCase()}</span>
                <select value={sessFilter} onChange={e => { setSessFilter(e.target.value); loadAllSessions(1, e.target.value); }} style={{
                  background: C.bgCard, color: C.text, border: `1px solid ${C.border}`,
                  borderRadius: 3, padding: "4px 8px", fontSize: 11, fontFamily: "inherit",
                }}>
                  <option value="">{t("allServers") || "Alle servere"}</option>
                  {SERVERS.map(s => <option key={s.id} value={s.id}>{SERVER_TYPES[s.id].label}</option>)}
                </select>
              </div>
              <Card style={{ overflow: "hidden" }}>
                {allSessions.map((sess, i) => {
                  const typeColors = sess.type === "Race" ? { bg: "rgba(34,197,94,0.08)", color: C.green }
                    : sess.type === "Qualify" ? { bg: "rgba(59,154,254,0.08)", color: C.blueBright }
                    : { bg: "rgba(192,132,252,0.08)", color: C.purple };
                  return (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                      borderBottom: i < allSessions.length - 1 ? `1px solid ${C.borderSub}` : "none",
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
              {allSessions.length < sessTotal && (
                <div style={{ textAlign: "center", marginTop: 10 }}>
                  <button className="ir-btn-ghost" onClick={() => loadAllSessions(sessPage + 1, sessFilter)} disabled={sessLoading} style={{ fontSize: 11, padding: "6px 16px" }}>
                    {sessLoading ? t("loading") : t("loadMore")}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Server History (Phase 6) */}
      {data.serverHistory && Object.keys(data.serverHistory).length > 0 && (
        <div style={{ marginTop: 14 }}>
          <Card style={{ overflow: "hidden" }}>
            <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}`, fontSize: 12, fontWeight: 700, color: C.white, display: "flex", alignItems: "center", gap: 6 }}>
              {"\u2691"} {t("serverHistory")}
            </div>
            {SERVERS.map((s, i) => {
              const h = data.serverHistory[s.id];
              if (!h) return null;
              return (
                <div key={s.id} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                  borderBottom: `1px solid ${C.borderSub}`,
                  background: i % 2 === 0 ? C.bgCard : "transparent",
                }}>
                  <ServerBadge serverId={s.id} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: C.white, fontWeight: 500 }}>{s.name}</div>
                    <div style={{ fontSize: 10, color: C.textDim }}>
                      {t("firstVisit")}: {formatStatsDate(h.firstVisit)} {"\u00B7"} {t("lastVisit")}: {formatStatsDate(h.lastVisit)}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.white, fontFamily: "Consolas, monospace" }}>{h.totalVisits}</div>
                    <div style={{ fontSize: 9, color: C.textDim, textTransform: "uppercase", letterSpacing: 1 }}>{t("totalVisits")}</div>
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
          <NotificationSettings />
        </div>
      )}
    </div>
  );
}
