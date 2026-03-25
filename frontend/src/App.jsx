import { useState } from "react";
import { s, colors } from "./styles/theme";
import Dashboard from "./pages/Dashboard";
import NouveauDevis from "./pages/NouveauDevis";
import DetailDevis from "./pages/DetailDevis";
import Fournisseurs from "./pages/Fournisseurs";

const nav = [
  { id: "dashboard", label: "Tableau de bord" },
  { id: "nouveau", label: "Nouveau devis" },
  { id: "fournisseurs", label: "Fournisseurs & Sync" },
];

export default function App() {
  const [page, setPage] = useState("dashboard");

  const currentPage = page.startsWith("detail:") ? "detail" : page;
  const devisId = page.startsWith("detail:") ? parseInt(page.split(":")[1]) : null;

  return (
    <div style={s.app}>
      <div style={s.sidebar}>
        <div style={s.sidebarLogo}>Maji Devis</div>
        {nav.map((n) => (
          <div key={n.id} style={s.sidebarItem(currentPage === n.id)} onClick={() => setPage(n.id)}>
            {n.label}
          </div>
        ))}
        <div style={{ marginTop: "auto", padding: "16px 20px", borderTop: `1px solid ${colors.border}` }}>
          <div style={{ fontSize: 11, color: colors.textMuted }}>MVP v2.0</div>
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
  );
}
