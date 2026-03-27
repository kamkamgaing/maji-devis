import { useState, useEffect } from "react";
import { s, colors } from "../styles/theme";
import { iaApi } from "../services/api";
import ConfidenceBar from "./ConfidenceBar";
import PrixCompare from "./PrixCompare";
import Spinner from "./Spinner";

export default function LigneDevisRow({ ligne, onUpdate, onSupprimer }) {
  const [anomalie, setAnomalie] = useState({ status: "ok", confiance: 0.8 });
  const [loadingIA, setLoadingIA] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoadingIA(true);
    iaApi.checkAnomalie(ligne.catalogue_id, ligne.prix_retenu).then((res) => {
      if (!cancelled) setAnomalie(res);
    }).catch(() => {}).finally(() => {
      if (!cancelled) setLoadingIA(false);
    });
    return () => { cancelled = true; };
  }, [ligne.catalogue_id, ligne.prix_retenu]);

  const fmt = (v) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(v);

  return (
    <tr>
      <td style={s.td}>
        <div style={{ fontWeight: 600 }}>{ligne.nom}</div>
        <div style={{ fontSize: 11, color: colors.textSecondary, fontFamily: "monospace" }}>{ligne.ref}</div>
      </td>
      <td style={s.td}>
        <input type="number" min={1} value={ligne.quantite}
          onChange={(e) => onUpdate({ ...ligne, quantite: parseInt(e.target.value) || 1 })}
          style={{ ...s.input, width: 70, textAlign: "center" }} />
      </td>
      <td style={s.td}>
        <PrixCompare
          prixList={ligne.prix}
          selectedPrix={ligne.prix_retenu}
          onSelect={(prix) => onUpdate({ ...ligne, prix_retenu: prix })}
        />
      </td>
      <td style={s.td}>
        <input type="number" step={0.01} value={ligne.prix_retenu}
          onChange={(e) => onUpdate({ ...ligne, prix_retenu: parseFloat(e.target.value) || 0 })}
          style={{ ...s.input, width: 90, textAlign: "right" }} />
      </td>
      <td style={s.td}>
        {loadingIA ? (
          <Spinner size={14} label="Analyse IA..." />
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <ConfidenceBar value={anomalie.confiance} />
              {anomalie.source === "llm" && (
                <span style={{ fontSize: 9, color: colors.accent, background: colors.accentSoft, padding: "1px 5px", borderRadius: 3, fontWeight: 600 }}>LLM</span>
              )}
            </div>
            {anomalie.message && (
              <div style={{
                fontSize: 11, marginTop: 4, maxWidth: 220, lineHeight: 1.4,
                color: anomalie.status === "critique" ? colors.danger : anomalie.status === "attention" ? colors.warning : colors.textSecondary,
              }}>
                {anomalie.message}
              </div>
            )}
            {anomalie.prix_recommande && anomalie.status !== "ok" && (
              <div style={{ fontSize: 10, color: colors.accent, marginTop: 2, cursor: "pointer" }}
                title="Cliquez pour appliquer le prix recommandé"
                onClick={() => onUpdate({ ...ligne, prix_retenu: anomalie.prix_recommande })}>
                Prix recommandé : {fmt(anomalie.prix_recommande)}
              </div>
            )}
          </>
        )}
      </td>
      <td style={{ ...s.td, fontWeight: 600 }}>
        {fmt(ligne.quantite * ligne.prix_retenu)}
      </td>
      <td style={s.td}>
        <button style={{ ...s.btn("ghost"), padding: "4px 8px", color: colors.danger, border: "none" }}
          title="Supprimer cette ligne"
          onClick={() => onSupprimer(ligne._localId)}>
          🗑
        </button>
      </td>
    </tr>
  );
}
