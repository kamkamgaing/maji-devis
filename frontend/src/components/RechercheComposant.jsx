import { useState, useEffect, useCallback } from "react";
import { s, colors } from "../styles/theme";
import { catalogueApi } from "../services/api";
import PrixCompare from "./PrixCompare";

export default function RechercheComposant({ onAjouter }) {
  const [recherche, setRecherche] = useState("");
  const [resultats, setResultats] = useState([]);

  const chercher = useCallback(async (term) => {
    if (!term) { setResultats([]); return; }
    try {
      const data = await catalogueApi.search(term);
      setResultats(data);
    } catch {
      setResultats([]);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => chercher(recherche), 300);
    return () => clearTimeout(timer);
  }, [recherche, chercher]);

  return (
    <div style={s.card}>
      <div style={s.cardTitle}>Recherche composants</div>
      <input
        style={s.input}
        placeholder="Rechercher par nom, reference ou categorie..."
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
      />
      {recherche.length > 0 && (
        <div style={{ marginTop: 12, maxHeight: 300, overflow: "auto" }}>
          {resultats.length === 0 ? (
            <div style={{ padding: 12, color: colors.textSecondary, fontSize: 13 }}>Aucun composant trouve</div>
          ) : resultats.map((c) => (
            <div key={c.id} style={{ ...s.row, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 6 }}
              onMouseEnter={(e) => (e.currentTarget.style.background = colors.surfaceHover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{c.nom}</div>
                <div style={{ fontSize: 11, color: colors.textSecondary }}>{c.ref} | {c.categorie}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <PrixCompare prixList={c.prix} />
                <button style={s.btn("primary")} onClick={() => onAjouter(c)}>Ajouter</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
