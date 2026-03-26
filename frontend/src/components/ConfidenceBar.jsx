import { colors } from "../styles/theme";

export default function ConfidenceBar({ value }) {
  const pct = Math.round(value * 100);
  const color = pct > 80 ? colors.success : pct > 50 ? colors.warning : colors.danger;
  const label = pct > 80 ? "Confiance élevée" : pct > 50 ? "Confiance moyenne" : "Confiance faible";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }} title={`${label} (${pct}%)`}
      role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div style={{ width: 60, height: 6, background: colors.border, borderRadius: 3 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.3s" }} />
      </div>
      <span style={{ fontSize: 11, color, fontWeight: 600 }}>{pct}%</span>
    </div>
  );
}
