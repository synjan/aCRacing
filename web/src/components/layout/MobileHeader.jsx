import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../theme";
import { useLang } from "../../hooks/useLang";
import { ACLogo, LangToggle } from "../shared";
import { PlayerSearch } from "../shared/PlayerSearch";

export function MobileHeader({ title, totalPlayers, auth }) {
  const { palette: C } = useTheme();
  const { t } = useLang();
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  return (
    <div style={{
      height: 50, flexShrink: 0, background: C.bgDarker,
      borderBottom: `1px solid ${C.border}`,
      display: "flex", alignItems: "center", padding: "0 14px", gap: 10,
    }}>
      <ACLogo size={30} />
      <span style={{ fontSize: 15, fontWeight: 700, color: C.white, flex: 1, letterSpacing: -0.3 }}>{title}</span>
      <button onClick={() => setShowSearch(s => !s)} style={{
        background: "none", border: "none", color: showSearch ? C.blueBright : C.textDim,
        fontSize: 16, cursor: "pointer", padding: "0 2px",
      }}>{"\u{1F50D}"}</button>
      {showSearch && <PlayerSearch compact />}
      {auth.user ? (
        <img src={auth.user.avatarSmall} alt="" onClick={() => navigate(`/profile/${auth.user.steamId}`)} style={{
          width: 26, height: 26, borderRadius: 4, cursor: "pointer",
          border: `1px solid ${C.border}`,
        }} title={auth.user.name} />
      ) : auth.checked ? (
        <button onClick={auth.login} style={{
          background: "linear-gradient(135deg, #171a21, #1b2838)",
          border: `1px solid ${C.border}`, borderRadius: 3,
          padding: "4px 8px", cursor: "pointer", fontSize: 10, fontWeight: 600,
          color: C.text, fontFamily: "inherit",
        }}>Steam</button>
      ) : null}
      <LangToggle />
      <span style={{ fontSize: 11, color: C.textDim, display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ fontWeight: 700, color: totalPlayers > 0 ? C.green : C.textDim }}>{totalPlayers}</span>
        {t("online")}
      </span>
    </div>
  );
}
