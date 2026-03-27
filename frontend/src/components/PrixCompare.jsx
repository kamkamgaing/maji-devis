import { useState } from "react";
import { colors } from "../styles/theme";

const NOMS = { rs: "RS Components", farnell: "Farnell", mouser: "Mouser" };

export default function PrixCompare({ prixList, onSelect, selectedPrix }) {
  if (!prixList?.length) return null;
  const meilleur = Math.min(...prixList.map((p) => parseFloat(p.prix)));
  const clickable = !!onSelect;

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {prixList.map((p) => {
        const prix = parseFloat(p.prix);
        const isBest = prix === meilleur;
        const isSelected = selectedPrix != null && Math.abs(prix - selectedPrix) < 0.001;

        return (
          <div key={p.fournisseur_id}
            role={clickable ? "button" : undefined}
            tabIndex={clickable ? 0 : undefined}
            onClick={clickable ? () => onSelect(prix) : undefined}
            onKeyDown={clickable ? (e) => e.key === "Enter" && onSelect(prix) : undefined}
            title={clickable ? `Utiliser le prix ${NOMS[p.fournisseur_id] || p.fournisseur_id}` : undefined}
            style={{
              padding: "6px 10px", borderRadius: 6, position: "relative",
              background: isSelected ? "rgba(59,130,246,0.15)" : isBest ? colors.successSoft : colors.bg,
              border: `1.5px solid ${isSelected ? colors.accent : isBest ? colors.success : colors.border}`,
              fontSize: 12,
              cursor: clickable ? "pointer" : "default",
              transition: "all 0.15s",
              outline: "none",
            }}>
            {isBest && (
              <div style={{
                position: "absolute", top: -6, right: -4, fontSize: 9,
                background: colors.success, color: "#fff", padding: "0 4px",
                borderRadius: 3, fontWeight: 600,
              }}>
                Suggéré
              </div>
            )}
            <div style={{ fontWeight: 600, color: isSelected ? colors.accent : isBest ? colors.success : colors.text }}>
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
