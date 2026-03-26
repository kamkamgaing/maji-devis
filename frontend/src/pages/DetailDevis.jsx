import { useState, useEffect } from "react";
import { s, colors } from "../styles/theme";
import { devisApi } from "../services/api";
import Badge from "../components/Badge";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import { useToast } from "../components/Toast";

export default function DetailDevis({ devisId, setPage }) {
  const [devis, setDevis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    devisApi.getById(devisId)
      .then(setDevis)
      .catch(() => {
        setDevis(null);
        toast.error("Impossible de charger ce devis");
      })
      .finally(() => setLoading(false));
  }, [devisId]);

  const fmt = (v) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(parseFloat(v || 0));

  const telechargerPdf = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/pdf/devis/${devis.id}`);
      if (!res.ok) throw new Error("Erreur serveur");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `devis-${devis.reference}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("PDF téléchargé !");
    } catch {
      toast.error("Le téléchargement du PDF a échoué. Réessayez.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <Spinner size={28} label="Chargement du devis..." />
      </div>
    );
  }

  if (!devis) {
    return (
      <EmptyState
        icon="🔍"
        title="Devis introuvable"
        message="Ce devis n'existe pas ou a été supprimé."
        action={<button style={s.btn("primary")} onClick={() => setPage("dashboard")}>Retour au tableau de bord</button>}
      />
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, fontSize: 12, color: colors.textMuted }}>
        <span style={{ cursor: "pointer", color: colors.accent }} onClick={() => setPage("dashboard")}
          onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
          onMouseLeave={(e) => e.target.style.textDecoration = "none"}>
          Tableau de bord
        </span>
        <span>›</span>
        <span style={{ color: colors.textSecondary }}>{devis.reference}</span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={s.pageTitle}>{devis.reference}</div>
          <div style={s.pageSubtitle}>
            {devis.client} {devis.projet ? `— ${devis.projet}` : ""} | {new Date(devis.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button style={s.btn("primary")} onClick={telechargerPdf} disabled={downloading}>
            {downloading ? <Spinner size={14} color="#fff" /> : "📄 Télécharger PDF"}
          </button>
          <Badge type={devis.statut === "valide" ? "ok" : "info"}>
            {devis.statut === "valide" ? "Validé" : "Brouillon"}
          </Badge>
        </div>
      </div>

      {devis.lignes?.length > 0 ? (
        <div style={s.card}>
          <div style={s.cardTitle}>Composants ({devis.lignes.length})</div>
          <div style={{ overflowX: "auto" }}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Composant</th>
                  <th style={s.th}>Référence</th>
                  <th style={s.th}>Quantité</th>
                  <th style={s.th}>Prix unitaire</th>
                  <th style={s.th}>Sous-total</th>
                </tr>
              </thead>
              <tbody>
                {devis.lignes.map((l) => (
                  <tr key={l.id}>
                    <td style={s.td}>{l.nom}</td>
                    <td style={{ ...s.td, color: colors.textSecondary, fontFamily: "monospace", fontSize: 12 }}>{l.ref}</td>
                    <td style={s.td}>{l.quantite}</td>
                    <td style={s.td}>{fmt(l.prix_retenu)}</td>
                    <td style={{ ...s.td, fontWeight: 600 }}>{fmt(l.quantite * parseFloat(l.prix_retenu))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={s.card}>
          <EmptyState icon="📦" title="Aucun composant" message="Ce devis ne contient pas de composants." />
        </div>
      )}

      {devis.production?.length > 0 && (
        <div style={s.card}>
          <div style={s.cardTitle}>Production ({devis.production.length})</div>
          <div style={{ overflowX: "auto" }}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Opération</th>
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
                    <td style={s.td}>{fmt(p.taux_horaire)}/h</td>
                    <td style={{ ...s.td, fontWeight: 600 }}>{fmt(p.heures * parseFloat(p.taux_horaire))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ ...s.card, maxWidth: 400, borderColor: colors.accent, background: `linear-gradient(135deg, ${colors.surface} 0%, rgba(59,130,246,0.04) 100%)` }}>
        <div style={s.cardTitle}>Total</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            ["Composants", devis.total_composants],
            ["Production", devis.total_production],
            ["Transport", devis.transport],
            [`Marge (${devis.marge}%)`, devis.montant_marge],
          ].map(([label, val]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: colors.textSecondary }}>{label}</span>
              <span>{fmt(val)}</span>
            </div>
          ))}
          <div style={{ borderTop: `2px solid ${colors.accent}`, paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 16, fontWeight: 700 }}>Total</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: colors.accent }}>{fmt(devis.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
