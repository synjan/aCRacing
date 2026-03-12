import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../theme";
import { useLang } from "../../hooks/useLang";
import { ServerBadge } from "../shared";

export function PlayerSearch({ compact }) {
  const { palette: C } = useTheme();
  const { t } = useLang();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(-1);
  const ref = useRef(null);
  const timerRef = useRef(null);

  const search = useCallback((q) => {
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: AbortSignal.timeout(5000) })
      .then(r => r.ok ? r.json() : [])
      .then(data => { setResults(data); setOpen(true); setSelected(-1); setLoading(false); })
      .catch(() => { setResults([]); setLoading(false); });
  }, []);

  const onChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(v), 300);
  };

  const pick = (steamGuid) => {
    setOpen(false);
    setQuery("");
    navigate(`/profile/${steamGuid}`);
  };

  const onKeyDown = (e) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    else if (e.key === "Enter" && selected >= 0) { e.preventDefault(); pick(results[selected].steamGuid); }
    else if (e.key === "Escape") { setOpen(false); }
  };

  // Click outside to close
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input
        value={query}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onFocus={() => { if (results.length > 0) setOpen(true); }}
        placeholder={t("searchPlayers")}
        style={{
          background: C.bgCard, color: C.text, border: `1px solid ${C.border}`,
          borderRadius: 3, padding: compact ? "4px 8px" : "5px 10px",
          fontSize: compact ? 11 : 12, fontFamily: "inherit",
          width: compact ? 140 : 200, outline: "none",
        }}
      />
      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4,
          background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 4,
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)", zIndex: 100, overflow: "hidden",
          minWidth: 220,
        }}>
          {loading ? (
            <div style={{ padding: "10px 12px", fontSize: 11, color: C.textDim }}>{t("searching")}</div>
          ) : results.length === 0 ? (
            <div style={{ padding: "10px 12px", fontSize: 11, color: C.textDim }}>
              {query.length < 2 ? t("searchMinChars") : t("noPlayersFound")}
            </div>
          ) : (
            results.map((r, i) => (
              <div
                key={r.steamGuid}
                onClick={() => pick(r.steamGuid)}
                style={{
                  padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                  background: i === selected ? C.bgActive : "transparent",
                  borderBottom: i < results.length - 1 ? `1px solid ${C.borderSub}` : "none",
                }}
                onMouseEnter={() => setSelected(i)}
              >
                <span style={{ fontSize: 12, color: C.white, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
                <div style={{ display: "flex", gap: 3 }}>
                  {r.servers.map(s => <ServerBadge key={s} serverId={s} />)}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
