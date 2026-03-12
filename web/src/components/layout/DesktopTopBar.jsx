import { useTheme } from "../../theme";
import { useLang } from "../../hooks/useLang";
import { StatusDot, LangToggle, ThemeToggle } from "../shared";
import { PlayerSearch } from "../shared/PlayerSearch";

export function DesktopTopBar({ time, totalPlayers, anyOnline }) {
  const { palette: C } = useTheme();
  const { t } = useLang();
  return (
    <div style={{
      height: 36, flexShrink: 0, background: C.bgDarker,
      borderBottom: `1px solid ${C.border}`,
      display: "flex", alignItems: "center", justifyContent: "flex-end",
      padding: "0 18px", gap: 16,
    }}>
      <PlayerSearch />
      <span style={{ color: C.border }}>{"\u2502"}</span>
      <LangToggle />
      <ThemeToggle />
      <span style={{ color: C.border }}>{"\u2502"}</span>
      <span style={{ fontSize: 11, color: C.textDim, fontVariantNumeric: "tabular-nums" }}>
        {time.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </span>
      <span style={{ color: C.border }}>{"\u2502"}</span>
      <span style={{ fontSize: 11, color: C.text, display: "flex", alignItems: "center", gap: 5 }}>
        <span style={{ color: C.textDim }}>{t("players")}</span>
        <span style={{ fontWeight: 700, color: totalPlayers > 0 ? C.green : C.textDim }}>{totalPlayers}</span>
      </span>
      <span style={{ color: C.border }}>{"\u2502"}</span>
      <span style={{ fontSize: 11, color: C.textDim, display: "flex", alignItems: "center", gap: 5 }}>
        <StatusDot status={anyOnline ? "online" : "offline"} />
        {anyOnline ? t("connected") : t("disconnected")}
      </span>
    </div>
  );
}
