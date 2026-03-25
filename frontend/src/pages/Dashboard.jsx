import { useState, useEffect } from "react";
import { s, colors } from "../styles/theme";
import { devisApi } from "../services/api";
import Badge from "../components/Badge";

export default function Dashboard({ setPage }) {
  const [devisList, setDevisList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    devisApi.list()
      .then(setDevisList)
      .catch(() => setDevisList([]))
      .finally(() => setLoading(false));
  }, []);

  const totalMontant = devisList.reduce((sum, d) => sum + parseFloat(d.total || 0), 0);
  const enCours = devisList.filter((d) => d.statut === "brouillon").length;
  const valides = devisList.filter((d) => d.statut === "valide").length;

  return (
    <div>
      <div style={s.pageTitle}>Tableau de bord</div>
      <div style={s.pageSubtitle}>Vue d'ensemble de l'activite devis</div>

      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <div style={s.statsCard(colors.accent)}>
          <div style={s.statsValue}>{devisList.length}</div>
          <div style={s.statsLabel}>Devis total</div>
        </div>
        <div style={s.statsCard(colors.success)}>
          <div style={s.statsValue}>{totalMontant.toFixed(0)} EUR</div>
          <div style={s.statsLabel}>Montant cumule</div>
        </div>
        <div style={s.statsCard(colors.warning)}>
          <div style={s.statsValue}>{enCours}</div>
          <div style={s.statsLabel}>En cours</div>
        </div>
        <div style={s.statsCard(colors.success)}>
          <div style={s.statsValue}>{valides}</div>
          <div style={s.statsLabel}>Valides</div>
        </div>
      </div>

      <div style={s.card}>
        <div style={{ ...s.cardTitle, justifyContent: "space-between" }}>
          <span>Derniers devis</span>
          <button style={s.btn("primary")} onClick={() => setPage("nouveau")}>Nouveau devis</button>
        </div>
        {loading ? (
          <div style={{ padding: 24, textAlign: "center", color: colors.textSecondary }}>Chargement...</div>
        ) : devisList.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: colors.textSecondary }}>
            Aucun devis. Cliquez sur "Nouveau devis" pour commencer.
          </div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Reference</th>
                <th style={s.th}>Client</th>
                <th style={s.th}>Total</th>
                <th style={s.th}>Statut</th>
                <th style={s.th}>Date</th>
              </tr>
            </thead>
            <tbody>
              {devisList.map((d) => (
                <tr key={d.id} style={s.row}
                  onMouseEnter={(e) => (e.currentTarget.style.background = colors.surfaceHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  onClick={() => setPage("detail:" + d.id)}>
                  <td style={s.td}><span style={{ fontWeight: 600 }}>{d.reference}</span></td>
                  <td style={s.td}>{d.client}</td>
                  <td style={{ ...s.td, fontWeight: 600 }}>{parseFloat(d.total).toFixed(2)} EUR</td>
                  <td style={s.td}>
                    <Badge type={d.statut === "valide" ? "ok" : "info"}>{d.statut}</Badge>
                  </td>
                  <td style={{ ...s.td, color: colors.textSecondary }}>
                    {new Date(d.created_at).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
