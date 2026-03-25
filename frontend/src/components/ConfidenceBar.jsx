import { colors } from "../styles/theme";

export default function ConfidenceBar({ value }) {
  const pct = Math.round(value * 100);
  const color = pct > 80 ? colors.success : pct > 50 ? colors.warning : colors.danger;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 60, height: 4, background: colors.border, borderRadius: 2 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.3s" }} />
      </div>
      <span style={{ fontSize: 11, color, fontWeight: 600 }}>{pct}%</span>
    </div>
  );
}
