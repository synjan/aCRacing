import { useTheme } from "../../theme";
import { useLang } from "../../hooks/useLang";
import { useLiveData } from "../../hooks/useLiveData";
import { StatusDot } from "../shared";

// serverName reserved for future use
// eslint-disable-next-line no-unused-vars
export function LiveWidget({ serverId, serverName }) {
  const { palette: C } = useTheme();
  const _t = useLang().t;
  const { data, loading } = useLiveData(serverId);

  if (loading || !data?.session) return null;

  const sessionColors = {
    Race: { bg: "rgba(34,197,94,0.08)", color: C.green },
    Qualifying: { bg: "rgba(59,154,254,0.08)", color: C.blueBright },
    Practice: { bg: "rgba(192,132,252,0.08)", color: C.purple },
  };
  const sc = sessionColors[data.session.type] || sessionColors.Practice;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "6px 10px", borderRadius: 3,
      background: sc.bg, border: `1px solid ${sc.color}20`,
      fontSize: 11,
    }}>
      <StatusDot status={data.driverCount > 0 ? "online" : "offline"} />
      <span style={{ color: sc.color, fontWeight: 600 }}>{data.session.type}</span>
      <span style={{ color: C.textDim }}>{data.driverCount}/{data.maxClients}</span>
      {data.drivers.length > 0 && (
        <span style={{ color: C.white, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {data.drivers[0].name}
        </span>
      )}
    </div>
  );
}
