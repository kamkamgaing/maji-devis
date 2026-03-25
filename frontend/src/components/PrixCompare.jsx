import { colors } from "../styles/theme";

export default function PrixCompare({ prixList }) {
  if (!prixList?.length) return null;
  const meilleur = Math.min(...prixList.map((p) => parseFloat(p.prix)));

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {prixList.map((p) => {
        const prix = parseFloat(p.prix);
        const isBest = prix === meilleur;
        return (
          <div key={p.fournisseur_id} style={{
            padding: "6px 10px", borderRadius: 6,
            background: isBest ? colors.successSoft : colors.bg,
            border: `1px solid ${isBest ? colors.success : colors.border}`,
            fontSize: 12,
          }}>
            <div style={{ fontWeight: 600, color: isBest ? colors.success : colors.text }}>
              {prix.toFixed(2)} EUR
            </div>
            <div style={{ fontSize: 10, color: colors.textSecondary }}>
              {p.fournisseur_id}
            </div>
          </div>
        );
      })}
    </div>
  );
}
