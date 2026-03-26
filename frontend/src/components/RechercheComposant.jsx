import { useState, useEffect, useCallback } from "react";
import { s, colors } from "../styles/theme";
import { catalogueApi } from "../services/api";
import PrixCompare from "./PrixCompare";
import Spinner from "./Spinner";

export default function RechercheComposant({ onAjouter }) {
  const [recherche, setRecherche] = useState("");
  const [resultats, setResultats] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(false);

  const chercher = useCallback(async (term) => {
    if (!term) { setResultats([]); setSearching(false); return; }
    setSearching(true);
    setError(false);
    try {
      const data = await catalogueApi.search(term);
      setResultats(data);
    } catch {
      setResultats([]);
      setError(true);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => chercher(recherche), 300);
    return () => clearTimeout(timer);
  }, [recherche, chercher]);

  return (
    <div style={s.card}>
      <div style={s.cardTitle}>🔍 Recherche composants</div>
      <div style={{ position: "relative" }}>
        <input
          style={s.input}
          placeholder="Rechercher par nom, référence ou catégorie..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
        />
        {recherche && (
          <button
            onClick={() => { setRecherche(""); setResultats([]); }}
            style={{
              position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", color: colors.textMuted, cursor: "pointer",
              fontSize: 16, padding: "2px 6px",
            }}>
            ✕
          </button>
        )}
      </div>
      {recherche.length > 0 && (
        <div style={{ marginTop: 12, maxHeight: 300, overflow: "auto" }}>
          {searching ? (
            <div style={{ padding: 16, textAlign: "center" }}>
              <Spinner size={18} label="Recherche en cours..." />
            </div>
          ) : error ? (
            <div style={{ padding: 12, color: colors.danger, fontSize: 13 }}>
              Erreur de connexion. Vérifiez le serveur.
            </div>
          ) : resultats.length === 0 ? (
            <div style={{ padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>📦</div>
              <div style={{ color: colors.textSecondary, fontSize: 13 }}>
                Aucun composant trouvé pour « {recherche} »
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 6 }}>
                {resultats.length} résultat{resultats.length > 1 ? "s" : ""}
              </div>
              {resultats.map((c) => (
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
