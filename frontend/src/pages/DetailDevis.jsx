import { useState, useEffect } from "react";
import { s, colors } from "../styles/theme";
import { devisApi } from "../services/api";
import Badge from "../components/Badge";

export default function DetailDevis({ devisId, setPage }) {
  const [devis, setDevis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    devisApi.getById(devisId)
      .then(setDevis)
      .catch(() => setDevis(null))
      .finally(() => setLoading(false));
  }, [devisId]);

  if (loading) return <div style={{ color: colors.textSecondary, padding: 24 }}>Chargement...</div>;
  if (!devis) return <div style={s.pageTitle}>Devis introuvable</div>;

  return (
    <div>
      <button style={{ ...s.btn("ghost"), marginBottom: 16, fontSize: 12 }} onClick={() => setPage("dashboard")}>
        Retour
      </button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={s.pageTitle}>{devis.reference}</div>
          <div style={s.pageSubtitle}>
            {devis.client} {devis.projet ? `- ${devis.projet}` : ""} | {new Date(devis.created_at).toLocaleDateString("fr-FR")}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            style={s.btn("primary")}
            onClick={() => {
              const link = document.createElement("a");
              link.href = `/api/pdf/devis/${devis.id}`;
              link.download = `devis-${devis.reference}.pdf`;
              link.click();
            }}>
            Telecharger PDF
          </button>
          <Badge type={devis.statut === "valide" ? "ok" : "info"}>{devis.statut}</Badge>
        </div>
      </div>

      <div style={s.card}>
        <div style={s.cardTitle}>Composants ({devis.lignes?.length || 0})</div>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Composant</th>
              <th style={s.th}>Ref</th>
              <th style={s.th}>Qte</th>
              <th style={s.th}>Prix unitaire</th>
              <th style={s.th}>Sous-total</th>
            </tr>
          </thead>
          <tbody>
            {devis.lignes?.map((l) => (
              <tr key={l.id}>
                <td style={s.td}>{l.nom}</td>
                <td style={{ ...s.td, color: colors.textSecondary }}>{l.ref}</td>
                <td style={s.td}>{l.quantite}</td>
                <td style={s.td}>{parseFloat(l.prix_retenu).toFixed(2)} EUR</td>
                <td style={{ ...s.td, fontWeight: 600 }}>{(l.quantite * parseFloat(l.prix_retenu)).toFixed(2)} EUR</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {devis.production?.length > 0 && (
        <div style={s.card}>
          <div style={s.cardTitle}>Production</div>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Operation</th>
                <th style={s.th}>Heures</th>
                <th style={s.th}>Taux horaire</th>
                <th style={s.th}>Sous-total</th>
              </tr>
            </thead>
            <tbody>
              {devis.production.map((p) => (
                <tr key={p.id}>
                  <td style={s.td}>{p.label}</td>
                  <td style={s.td}>{p.heures}h</td>
                  <td style={s.td}>{parseFloat(p.taux_horaire).toFixed(2)} EUR/h</td>
                  <td style={{ ...s.td, fontWeight: 600 }}>{(p.heures * parseFloat(p.taux_horaire)).toFixed(2)} EUR</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ ...s.card, maxWidth: 400, borderColor: colors.accent }}>
        <div style={s.cardTitle}>Total</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: colors.textSecondary }}>Composants</span>
            <span>{parseFloat(devis.total_composants).toFixed(2)} EUR</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: colors.textSecondary }}>Production</span>
            <span>{parseFloat(devis.total_production).toFixed(2)} EUR</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: colors.textSecondary }}>Transport</span>
            <span>{parseFloat(devis.transport).toFixed(2)} EUR</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: colors.textSecondary }}>Marge ({devis.marge}%)</span>
            <span>{parseFloat(devis.montant_marge).toFixed(2)} EUR</span>
          </div>
          <div style={{ borderTop: `2px solid ${colors.accent}`, paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 16, fontWeight: 700 }}>Total</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: colors.accent }}>{parseFloat(devis.total).toFixed(2)} EUR</span>
          </div>
        </div>
      </div>
    </div>
  );
}
