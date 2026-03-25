import { useState, useEffect } from "react";
import { s, colors } from "../styles/theme";
import { iaApi } from "../services/api";
import ConfidenceBar from "./ConfidenceBar";
import PrixCompare from "./PrixCompare";

export default function LigneDevisRow({ ligne, onUpdate, onSupprimer }) {
  const [anomalie, setAnomalie] = useState({ status: "ok", confiance: 0.8 });

  useEffect(() => {
    let cancelled = false;
    iaApi.checkAnomalie(ligne.catalogue_id, ligne.prix_retenu).then((res) => {
      if (!cancelled) setAnomalie(res);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [ligne.catalogue_id, ligne.prix_retenu]);

  return (
    <tr>
      <td style={s.td}>
        <div style={{ fontWeight: 600 }}>{ligne.nom}</div>
        <div style={{ fontSize: 11, color: colors.textSecondary }}>{ligne.ref}</div>
      </td>
      <td style={s.td}>
        <input type="number" min={1} value={ligne.quantite}
          onChange={(e) => onUpdate({ ...ligne, quantite: parseInt(e.target.value) || 1 })}
          style={{ ...s.input, width: 70, textAlign: "center" }} />
      </td>
      <td style={s.td}>
        <PrixCompare prixList={ligne.prix} />
      </td>
      <td style={s.td}>
        <input type="number" step={0.01} value={ligne.prix_retenu}
          onChange={(e) => onUpdate({ ...ligne, prix_retenu: parseFloat(e.target.value) || 0 })}
          style={{ ...s.input, width: 90, textAlign: "right" }} />
      </td>
      <td style={s.td}>
        <ConfidenceBar value={anomalie.confiance} />
        {anomalie.status !== "ok" && (
          <div style={{ fontSize: 11, color: anomalie.status === "critique" ? colors.danger : colors.warning, marginTop: 4 }}>
            {anomalie.message}
          </div>
        )}
      </td>
      <td style={{ ...s.td, fontWeight: 600 }}>
        {(ligne.quantite * ligne.prix_retenu).toFixed(2)} EUR
      </td>
      <td style={s.td}>
        <button style={{ ...s.btn("ghost"), padding: "4px 8px", color: colors.danger, border: "none" }}
          onClick={() => onSupprimer(ligne._localId)}>
          Suppr.
        </button>
      </td>
    </tr>
  );
}
