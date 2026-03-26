import { useState, useEffect, useRef } from "react";
import { s, colors } from "../styles/theme";
import { iaApi } from "../services/api";
import Spinner from "./Spinner";

export default function ModalPrompt({ catalogueId, onFermer }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(true);
  const closeRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onFermer(); };
    document.addEventListener("keydown", handler);
    closeRef.current?.focus();
    return () => document.removeEventListener("keydown", handler);
  }, [onFermer]);

  useEffect(() => {
    iaApi.getPrompt(catalogueId).then((data) => {
      setPrompt(data.prompt);
    }).catch(() => {
      setPrompt("Erreur lors du chargement du prompt.");
    }).finally(() => setLoading(false));
  }, [catalogueId]);

  const fakeReponse = JSON.stringify({
    prix_recommande: 11.80,
    fournisseur_recommande: "Farnell",
    confiance: 0.92,
    justification: "Prix dans la fourchette historique, tendance haussière modérée. Fournisseur avec le meilleur prix et stock suffisant.",
  }, null, 2);

  return (
    <div style={s.overlay} onClick={onFermer} role="dialog" aria-modal="true">
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Exemple de prompt IA</div>
          <button ref={closeRef} onClick={onFermer}
            style={{ background: "none", border: "none", color: colors.textMuted, cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>

        {loading ? (
          <div style={{ padding: 20, textAlign: "center" }}><Spinner size={22} label="Chargement du prompt..." /></div>
        ) : (
          <>
            <div style={{ fontSize: 11, fontWeight: 600, color: colors.accent, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Prompt envoyé au LLM
            </div>
            <pre style={{ background: colors.bg, padding: 14, borderRadius: 8, fontSize: 12, lineHeight: 1.6, whiteSpace: "pre-wrap", border: `1px solid ${colors.border}`, marginBottom: 16, color: colors.textSecondary }}>
              {prompt}
            </pre>
            <div style={{ fontSize: 11, fontWeight: 600, color: colors.success, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Réponse structurée — Exemple fictif
            </div>
            <pre style={{ background: colors.bg, padding: 14, borderRadius: 8, fontSize: 12, lineHeight: 1.6, whiteSpace: "pre-wrap", border: `1px solid ${colors.border}`, color: colors.success }}>
              {fakeReponse}
            </pre>
            <div style={{ marginTop: 16, fontSize: 12, color: colors.textSecondary, lineHeight: 1.6 }}>
              Le LLM répond en JSON strict. On parse la réponse, on compare le prix recommandé avec nos seuils de détection d'anomalie, et on affiche le résultat au deviseur avec le niveau de confiance.
            </div>
          </>
        )}
        <button style={{ ...s.btn("primary"), marginTop: 16 }} onClick={onFermer}>Fermer</button>
      </div>
    </div>
  );
}
