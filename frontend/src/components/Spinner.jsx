import { colors } from "../styles/theme";

export default function Spinner({ size = 20, color = colors.accent, label = "" }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <div style={{
        width: size, height: size, border: `2px solid ${colors.border}`,
        borderTopColor: color, borderRadius: "50%",
        animation: "maji-spin 0.6s linear infinite",
      }} />
      {label && <span style={{ fontSize: 12, color: colors.textSecondary }}>{label}</span>}
      <style>{`@keyframes maji-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
