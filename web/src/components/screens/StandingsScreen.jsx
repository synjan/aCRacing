import { useState, useEffect, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../theme";
import { useLang } from "../../hooks/useLang";
import { SERVER_TYPES, TRACK_NAMES, formatLapTime, formatStatsDate } from "../../data/servers";
import { ST, Card } from "../shared";

const RACE_SERVERS = [
  { id: "mx5cup" },
  { id: "gt3" },
];

function buildMonths() {
  const months = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    d.setDate(1); d.setHours(0, 0, 0, 0);
    const from = Math.floor(d.getTime() / 1000);
    const endD = new Date(d);
    endD.setMonth(endD.getMonth() + 1);
    const to = Math.floor(endD.getTime() / 1000);
    months.push({ label: d.toLocaleString("default", { month: "long", year: "numeric" }), from, to });
  }
  return months;
}

export function StandingsScreen({ m }) {
  const { palette: C } = useTheme();
  const { t } = useLang();
  const navigate = useNavigate();
  const [activeServer, setActiveServer] = useState("mx5cup");
  const [months] = useState(() => buildMonths());
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDriver, setExpandedDriver] = useState(null);
  const [driverDetail, setDriverDetail] = useState(null);

  const month = months[selectedMonth];

  useEffect(() => {
    setLoading(true); // eslint-disable-line react-hooks/set-state-in-effect
    setStandings([]);
    setExpandedDriver(null);
    setDriverDetail(null);
    fetch(`/api/standings/${activeServer}?from=${month.from}&to=${month.to}`, { signal: AbortSignal.timeout(10000) })
      .then(r => r.ok ? r.json() : [])
      .then(data => { setStandings(data); setLoading(false); })
      .catch(() => { setStandings([]); setLoading(false); });
  }, [activeServer, month]);

  function toggleDriver(steamGuid) {
    if (expandedDriver === steamGuid) {
      setExpandedDriver(null);
      setDriverDetail(null);
      return;
    }
    setExpandedDriver(steamGuid);
    setDriverDetail(null);
    fetch(`/api/standings/${activeServer}/${steamGuid}?from=${month.from}&to=${month.to}`, { signal: AbortSignal.timeout(10000) })
      .then(r => r.ok ? r.json() : null)
      .then(data => setDriverDetail(data))
      .catch(() => setDriverDetail(null));
  }

  const trackName = (raw) => TRACK_NAMES[raw] || raw || "-";

  const tabStyle = (id) => ({
    padding: m ? "7px 14px" : "8px 20px", fontSize: m ? 11 : 12, fontWeight: 600,
    background: activeServer === id ? SERVER_TYPES[id].bg : "transparent",
    color: activeServer === id ? SERVER_TYPES[id].color : C.textDim,
    border: `1px solid ${activeServer === id ? SERVER_TYPES[id].color + "40" : C.border}`,
    borderRadius: 4, cursor: "pointer", transition: "all 0.15s",
  });

  const thStyle = {
    padding: "8px 10px", fontSize: 10, color: C.textMuted, fontWeight: 700,
    textTransform: "uppercase", letterSpacing: 1.2, borderBottom: `1px solid ${C.border}`,
    textAlign: "left",
  };

  return (
    <div style={{ padding: m ? 12 : 22, overflow: "auto", height: "100%" }}>
      <ST>{t("standings")}</ST>

      {/* Server tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {RACE_SERVERS.map(s => (
          <button key={s.id} onClick={() => setActiveServer(s.id)} style={tabStyle(s.id)}>
            {SERVER_TYPES[s.id].label}
          </button>
        ))}
      </div>

      {/* Month selector */}
      <div style={{ marginBottom: 16 }}>
        <select
          value={selectedMonth}
          onChange={e => setSelectedMonth(Number(e.target.value))}
          style={{
            background: C.bgCard, color: C.text, border: `1px solid ${C.border}`,
            borderRadius: 4, padding: "8px 12px", fontSize: 12, fontFamily: "inherit",
            cursor: "pointer", minWidth: 200,
          }}
        >
          {months.map((mo, i) => (
            <option key={i} value={i}>{mo.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <Card style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: C.textDim }}>{t("loading")}</div>
        </Card>
      ) : standings.length === 0 ? (
        <Card style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: C.textDim }}>{t("noStandings")}</div>
        </Card>
      ) : (
        <Card style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <th style={thStyle}>{t("position")}</th>
              <th style={thStyle}>{t("driver")}</th>
              <th style={{ ...thStyle, textAlign: "right" }}>{t("points")}</th>
              <th style={{ ...thStyle, textAlign: "right" }}>{t("race")}</th>
              <th style={{ ...thStyle, textAlign: "right" }}>{t("wins")}</th>
              <th style={{ ...thStyle, textAlign: "right" }}>{t("podiums")}</th>
              <th style={{ ...thStyle, textAlign: "right" }}>{t("fastestLap")}</th>
            </tr></thead>
            <tbody>
              {standings.map((row, i) => {
                const posColor = i === 0 ? "#ffd700" : i === 1 ? "#c0c0c0" : i === 2 ? "#cd7f32" : C.textDim;
                const isExpanded = expandedDriver === row.steamGuid;
                return (
                  <Fragment key={row.steamGuid || i}>
                    <tr
                      className="ir-row"
                      onClick={() => row.steamGuid && toggleDriver(row.steamGuid)}
                      style={{
                        background: i === 0 ? "rgba(234,179,8,0.06)" : i % 2 === 0 ? C.bgCard : "transparent",
                        cursor: row.steamGuid ? "pointer" : "default",
                      }}
                    >
                      <td style={{ padding: "7px 10px", fontSize: 12, fontWeight: 700, color: posColor, borderBottom: `1px solid ${C.borderSub}`, width: 40 }}>{i + 1}</td>
                      <td style={{ padding: "7px 10px", fontSize: 12, color: C.white, fontWeight: i < 3 ? 600 : 400, borderBottom: `1px solid ${C.borderSub}` }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {row.steamGuid ? (
                            <span className="profile-link" onClick={(e) => { e.stopPropagation(); navigate(`/profile/${row.steamGuid}`); }} style={{ color: "inherit" }}>{row.name}</span>
                          ) : row.name}
                          <span style={{ color: C.textDim, fontSize: 14, transition: "transform 0.15s", transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}>{"\u25B6"}</span>
                        </span>
                      </td>
                      <td style={{ padding: "7px 10px", fontFamily: "Consolas, monospace", fontSize: 12, textAlign: "right", color: i === 0 ? "#ffd700" : C.white, fontWeight: 700, borderBottom: `1px solid ${C.borderSub}` }}>{row.points}</td>
                      <td style={{ padding: "7px 10px", fontSize: 11, textAlign: "right", color: C.textDim, borderBottom: `1px solid ${C.borderSub}` }}>{row.races}</td>
                      <td style={{ padding: "7px 10px", fontSize: 11, textAlign: "right", color: row.wins > 0 ? C.green : C.textDim, borderBottom: `1px solid ${C.borderSub}` }}>{row.wins}</td>
                      <td style={{ padding: "7px 10px", fontSize: 11, textAlign: "right", color: row.podiums > 0 ? C.blueBright : C.textDim, borderBottom: `1px solid ${C.borderSub}` }}>{row.podiums}</td>
                      <td style={{ padding: "7px 10px", fontSize: 11, textAlign: "right", color: row.flBonus > 0 ? C.purple : C.textDim, borderBottom: `1px solid ${C.borderSub}` }}>{row.flBonus || 0}</td>
                    </tr>

                    {isExpanded && driverDetail && (
                      <tr><td colSpan={7} style={{ padding: 0, borderBottom: `1px solid ${C.borderSub}` }}>
                        <div style={{ padding: "8px 14px 12px", background: C.bgDarker }}>
                          <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead><tr>
                              <th style={{ ...thStyle, fontSize: 9 }}>{t("date")}</th>
                              <th style={{ ...thStyle, fontSize: 9 }}>{t("track")}</th>
                              <th style={{ ...thStyle, fontSize: 9, textAlign: "right" }}>{t("position")}</th>
                              <th style={{ ...thStyle, fontSize: 9, textAlign: "right" }}>{t("points")}</th>
                              <th style={{ ...thStyle, fontSize: 9, textAlign: "right" }}>{t("bestLap")}</th>
                            </tr></thead>
                            <tbody>
                              {(driverDetail.races || []).map((race, ri) => (
                                <tr key={ri} style={{ background: ri % 2 === 0 ? "transparent" : C.bgCard }}>
                                  <td style={{ padding: "5px 10px", fontSize: 10, color: C.textMuted, borderBottom: `1px solid ${C.borderSub}` }}>{formatStatsDate(race.timestamp)}</td>
                                  <td style={{ padding: "5px 10px", fontSize: 11, color: C.textDim, borderBottom: `1px solid ${C.borderSub}` }}>{trackName(race.track)}</td>
                                  <td style={{ padding: "5px 10px", fontSize: 11, textAlign: "right", fontWeight: 600, color: race.position <= 3 ? (race.position === 1 ? "#ffd700" : race.position === 2 ? "#c0c0c0" : "#cd7f32") : C.textDim, borderBottom: `1px solid ${C.borderSub}` }}>{race.position}</td>
                                  <td style={{ padding: "5px 10px", fontFamily: "Consolas, monospace", fontSize: 11, textAlign: "right", color: C.white, borderBottom: `1px solid ${C.borderSub}` }}>{race.points}</td>
                                  <td style={{ padding: "5px 10px", fontFamily: "Consolas, monospace", fontSize: 11, textAlign: "right", color: C.green, borderBottom: `1px solid ${C.borderSub}` }}>{formatLapTime(race.bestLap)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td></tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
