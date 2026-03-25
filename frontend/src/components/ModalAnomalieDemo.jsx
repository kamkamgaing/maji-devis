import { s, colors } from "../styles/theme";
import Badge from "./Badge";

export default function ModalAnomalieDemo({ onFermer }) {
  const exemples = [
    { prix: 0.12, attendu: 12.50, status: "critique", desc: "Erreur facteur x100 (virgule decalee)" },
    { prix: 1250, attendu: 12.50, status: "critique", desc: "Erreur facteur x100 (prix en centimes)" },
    { prix: 15.80, attendu: 12.50, status: "attention", desc: "Prix hors fourchette haute (+26%)" },
    { prix: 12.30, attendu: 12.50, status: "ok", desc: "Prix dans la fourchette normale" },
  ];

  return (
    <div style={s.overlay} onClick={onFermer}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Detection d'anomalies IA</div>
        <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 16 }}>
          Composant : SKF 6205-2RS (moyenne historique : 12.50 EUR)
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {exemples.map((ex, i) => (
            <div key={i} style={{ padding: 14, borderRadius: 8, background: colors.bg, border: `1px solid ${colors.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Prix propose : {ex.prix.toFixed(2)} EUR</div>
                <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{ex.desc}</div>
              </div>
              <Badge type={ex.status}>{ex.status === "ok" ? "Valide" : ex.status === "attention" ? "Attention" : "Bloque"}</Badge>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, padding: 14, borderRadius: 8, background: colors.accentSoft, fontSize: 12, lineHeight: 1.6, color: colors.text }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Algorithme utilise :</div>
          1. Calcul moyenne + ecart-type sur l'historique 6 mois{"\n"}
          2. Seuils statistiques a +/- 2 ecarts-types{"\n"}
          3. Detection facteur x100 / x0.01 (erreur de virgule){"\n"}
          4. Score de confiance 0-100% affiche au deviseur
        </div>
        <button style={{ ...s.btn("primary"), marginTop: 16 }} onClick={onFermer}>Fermer</button>
      </div>
    </div>
  );
}
