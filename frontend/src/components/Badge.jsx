import { s } from "../styles/theme";

export default function Badge({ type, children }) {
  return <span style={s.badge(type)}>{children}</span>;
}
