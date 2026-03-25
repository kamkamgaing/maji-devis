import { useState, useEffect } from "react";
import { s, colors } from "../styles/theme";
import { iaApi } from "../services/api";

export default function ModalPrompt({ catalogueId, onFermer }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(true);

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
    justification: "Prix dans la fourchette historique, tendance haussiere moderee. Fournisseur avec le meilleur prix et stock suffisant.",
  }, null, 2);

  return (
    <div style={s.overlay} onClick={onFermer}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Exemple de prompt IA</div>
        {loading ? (
          <div style={{ color: colors.textSecondary }}>Chargement...</div>
        ) : (
          <>
            <div style={{ fontSize: 11, fontWeight: 600, color: colors.accent, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Prompt envoye au LLM
            </div>
            <pre style={{ background: colors.bg, padding: 14, borderRadius: 8, fontSize: 12, lineHeight: 1.6, whiteSpace: "pre-wrap", border: `1px solid ${colors.border}`, marginBottom: 16, color: colors.textSecondary }}>
              {prompt}
            </pre>
            <div style={{ fontSize: 11, fontWeight: 600, color: colors.success, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Reponse structuree (JSON)
            </div>
            <pre style={{ background: colors.bg, padding: 14, borderRadius: 8, fontSize: 12, lineHeight: 1.6, whiteSpace: "pre-wrap", border: `1px solid ${colors.border}`, color: colors.success }}>
              {fakeReponse}
            </pre>
            <div style={{ marginTop: 16, fontSize: 12, color: colors.textSecondary, lineHeight: 1.6 }}>
              Le LLM repond en JSON strict. On parse la reponse, on compare le prix recommande avec nos seuils de detection d'anomalie, et on affiche le resultat au deviseur avec le niveau de confiance.
            </div>
          </>
        )}
        <button style={{ ...s.btn("primary"), marginTop: 16 }} onClick={onFermer}>Fermer</button>
      </div>
    </div>
  );
}
