import { colors } from "../styles/theme";

const NOMS = { rs: "RS Components", farnell: "Farnell", mouser: "Mouser" };

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
            fontSize: 12, position: "relative",
          }}>
            {isBest && <div style={{ position: "absolute", top: -6, right: -4, fontSize: 10, background: colors.success, color: "#fff", padding: "0 4px", borderRadius: 3, fontWeight: 600 }}>Best</div>}
            <div style={{ fontWeight: 600, color: isBest ? colors.success : colors.text }}>
              {prix.toFixed(2)} €
            </div>
            <div style={{ fontSize: 10, color: colors.textSecondary }}>
              {NOMS[p.fournisseur_id] || p.fournisseur_id}
            </div>
          </div>
        );
      })}
    </div>
  );
}
