import { useState } from "react";
import { s, colors } from "./styles/theme";
import { ToastProvider } from "./components/Toast";
import Dashboard from "./pages/Dashboard";
import NouveauDevis from "./pages/NouveauDevis";
import DetailDevis from "./pages/DetailDevis";
import Fournisseurs from "./pages/Fournisseurs";

const nav = [
  { id: "dashboard", label: "Tableau de bord", icon: "\uD83D\uDCCA" },
  { id: "nouveau", label: "Nouveau devis", icon: "\u2795" },
  { id: "fournisseurs", label: "Fournisseurs", icon: "\uD83D\uDD17" },
];

export default function App() {
  const [page, setPage] = useState("dashboard");

  const currentPage = page.startsWith("detail:") ? "detail" : page;
  const devisId = page.startsWith("detail:") ? parseInt(page.split(":")[1]) : null;

  return (
    <ToastProvider>
      <div style={s.app}>
        <div style={s.sidebar}>
          <div style={s.sidebarLogo}>Maji Devis</div>
          <div style={{ fontSize: 10, color: colors.textMuted, padding: "0 20px 20px", marginTop: -16 }}>
            Manufacture the Future
          </div>
          {nav.map((n) => (
            <div key={n.id}
              role="button" tabIndex={0}
              style={s.sidebarItem(currentPage === n.id)}
              onClick={() => setPage(n.id)}
              onKeyDown={(e) => e.key === "Enter" && setPage(n.id)}>
              <span style={{ marginRight: 8 }}>{n.icon}</span> {n.label}
            </div>
          ))}
          <div style={{ marginTop: "auto", padding: "16px 20px", borderTop: `1px solid ${colors.border}` }}>
            <div style={{ fontSize: 11, color: colors.textMuted }}>v2.0</div>
            <div style={{ fontSize: 11, color: colors.textMuted }}>Groupe Maji</div>
          </div>
        </div>
        <div style={s.main}>
          {currentPage === "dashboard" && <Dashboard setPage={setPage} />}
          {currentPage === "nouveau" && <NouveauDevis setPage={setPage} />}
          {currentPage === "detail" && <DetailDevis devisId={devisId} setPage={setPage} />}
          {currentPage === "fournisseurs" && <Fournisseurs />}
        </div>
      </div>
    </ToastProvider>
  );
}
