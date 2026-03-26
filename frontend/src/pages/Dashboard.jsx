import { useState, useEffect } from "react";
import { s, colors } from "../styles/theme";
import { devisApi } from "../services/api";
import Badge from "../components/Badge";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import { useToast } from "../components/Toast";

export default function Dashboard({ setPage }) {
  const [devisList, setDevisList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  const charger = () => {
    setLoading(true);
    setError(null);
    devisApi.list()
      .then(setDevisList)
      .catch((err) => {
        setError("Impossible de charger les devis");
        toast.error("Impossible de charger les devis. Vérifiez la connexion au serveur.");
        setDevisList([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { charger(); }, []);

  const totalMontant = devisList.reduce((sum, d) => sum + parseFloat(d.total || 0), 0);
  const enCours = devisList.filter((d) => d.statut === "brouillon").length;
  const valides = devisList.filter((d) => d.statut === "valide").length;

  const fmt = (v) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(v);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <div>
          <div style={s.pageTitle}>Tableau de bord</div>
          <div style={s.pageSubtitle}>Vue d'ensemble de l'activité devis</div>
        </div>
        <button style={s.btn("primary")} onClick={() => setPage("nouveau")}>
          + Nouveau devis
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <div style={s.statsCard(colors.accent)}>
          <div style={s.statsValue}>{devisList.length}</div>
          <div style={s.statsLabel}>Total devis</div>
        </div>
        <div style={s.statsCard("#8B5CF6")}>
          <div style={s.statsValue}>{fmt(totalMontant)}</div>
          <div style={s.statsLabel}>Montant cumulé</div>
        </div>
        <div style={s.statsCard(colors.warning)}>
          <div style={s.statsValue}>{enCours}</div>
          <div style={s.statsLabel}>Brouillons</div>
        </div>
        <div style={s.statsCard(colors.success)}>
          <div style={s.statsValue}>{valides}</div>
          <div style={s.statsLabel}>Validés</div>
        </div>
      </div>

      <div style={s.card}>
        <div style={{ ...s.cardTitle, justifyContent: "space-between" }}>
          <span>Derniers devis</span>
          {error && (
            <button style={{ ...s.btn("ghost"), fontSize: 12, color: colors.warning }} onClick={charger}>
              Réessayer
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <Spinner size={28} label="Chargement des devis..." />
          </div>
        ) : error ? (
          <EmptyState
            icon="⚠️"
            title="Erreur de chargement"
            message={error}
            action={<button style={s.btn("primary")} onClick={charger}>Réessayer</button>}
          />
        ) : devisList.length === 0 ? (
          <EmptyState
            icon="📋"
            title="Aucun devis pour le moment"
            message="Créez votre premier devis pour commencer à suivre vos chiffrages."
            action={<button style={s.btn("primary")} onClick={() => setPage("nouveau")}>Créer un devis</button>}
          />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Référence</th>
                  <th style={s.th}>Client</th>
                  <th style={s.th}>Total</th>
                  <th style={s.th}>Statut</th>
                  <th style={s.th}>Date</th>
                </tr>
              </thead>
              <tbody>
                {devisList.map((d) => (
                  <tr key={d.id} style={s.row} tabIndex={0}
                    onMouseEnter={(e) => (e.currentTarget.style.background = colors.surfaceHover)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    onClick={() => setPage("detail:" + d.id)}
                    onKeyDown={(e) => e.key === "Enter" && setPage("detail:" + d.id)}>
                    <td style={s.td}><span style={{ fontWeight: 600 }}>{d.reference}</span></td>
                    <td style={s.td}>{d.client || <span style={{ color: colors.textMuted, fontStyle: "italic" }}>Sans client</span>}</td>
                    <td style={{ ...s.td, fontWeight: 600 }}>{fmt(parseFloat(d.total))}</td>
                    <td style={s.td}>
                      <Badge type={d.statut === "valide" ? "ok" : "info"}>
                        {d.statut === "valide" ? "Validé" : "Brouillon"}
                      </Badge>
                    </td>
                    <td style={{ ...s.td, color: colors.textSecondary }}>
                      {new Date(d.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
