import { colors } from "../styles/theme";

export default function EmptyState({ icon = "\uD83D\uDCCB", title, message, action }) {
  return (
    <div style={{ padding: "40px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: colors.text, marginBottom: 6 }}>{title}</div>
      {message && <div style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 16, maxWidth: 320, margin: "0 auto 16px" }}>{message}</div>}
      {action}
    </div>
  );
}
