import { useEffect, useRef } from "react";
import { s, colors } from "../styles/theme";
import Badge from "./Badge";

export default function ModalAnomalieDemo({ onFermer }) {
  const closeRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onFermer(); };
    document.addEventListener("keydown", handler);
    closeRef.current?.focus();
    return () => document.removeEventListener("keydown", handler);
  }, [onFermer]);

  const exemples = [
    { prix: 0.12, attendu: 12.50, status: "critique", desc: "Erreur facteur ×100 (virgule décalée)" },
    { prix: 1250, attendu: 12.50, status: "critique", desc: "Erreur facteur ×100 (prix en centimes)" },
    { prix: 15.80, attendu: 12.50, status: "attention", desc: "Prix hors fourchette haute (+26%)" },
    { prix: 12.30, attendu: 12.50, status: "ok", desc: "Prix dans la fourchette normale" },
  ];

  return (
    <div style={s.overlay} onClick={onFermer} role="dialog" aria-modal="true">
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Détection d'anomalies IA</div>
          <button ref={closeRef} onClick={onFermer}
            style={{ background: "none", border: "none", color: colors.textMuted, cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>
        <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 16 }}>
          Composant : SKF 6205-2RS (moyenne historique : 12,50 €)
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {exemples.map((ex, i) => (
            <div key={i} style={{ padding: 14, borderRadius: 8, background: colors.bg, border: `1px solid ${colors.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Prix proposé : {ex.prix.toFixed(2)} €</div>
                <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{ex.desc}</div>
              </div>
              <Badge type={ex.status}>{ex.status === "ok" ? "Validé" : ex.status === "attention" ? "Attention" : "Bloqué"}</Badge>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, padding: 14, borderRadius: 8, background: colors.accentSoft, fontSize: 12, color: colors.text }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Algorithme utilisé :</div>
          <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8, color: colors.textSecondary }}>
            <li>Calcul moyenne + écart-type sur l'historique 6 mois</li>
            <li>Seuils statistiques à ±2 écarts-types</li>
            <li>Détection facteur ×100 / ×0.01 (erreur de virgule)</li>
            <li>Score de confiance 0–100% affiché au deviseur</li>
          </ol>
        </div>
        <button style={{ ...s.btn("primary"), marginTop: 16 }} onClick={onFermer}>Fermer</button>
      </div>
    </div>
  );
}
