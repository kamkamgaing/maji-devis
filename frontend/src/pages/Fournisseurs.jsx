import { useState, useEffect } from "react";
import { s, colors } from "../styles/theme";
import { syncApi } from "../services/api";
import Badge from "../components/Badge";

const NOMS = { rs: "RS Components", farnell: "Farnell", mouser: "Mouser" };

export default function Fournisseurs() {
  const [status, setStatus] = useState(null);
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncingOne, setSyncingOne] = useState(null);

  const charger = async () => {
    try {
      const [st, hist] = await Promise.all([syncApi.status(), syncApi.historique()]);
      setStatus(st);
      setHistorique(hist);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { charger(); }, []);

  const lancerSyncAll = async () => {
    setSyncing(true);
    try {
      await syncApi.syncAll();
      await charger();
    } catch (err) {
      alert("Erreur: " + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const lancerSyncOne = async (id) => {
    setSyncingOne(id);
    try {
      await syncApi.syncOne(id);
      await charger();
    } catch (err) {
      alert("Erreur: " + err.message);
    } finally {
      setSyncingOne(null);
    }
  };

  const statutBadge = (statut) => {
    if (statut === "termine") return "ok";
    if (statut === "partiel") return "attention";
    if (statut === "echec") return "critique";
    return "info";
  };

  const modeBadge = (mode) => {
    if (mode === "api") return "ok";
    if (mode === "scraper") return "attention";
    return "info";
  };

  if (loading) return <div style={{ color: colors.textSecondary, padding: 24 }}>Chargement...</div>;

  const nbApi = status?.fournisseurs?.filter((f) => f.mode === "api").length || 0;
  const nbScraper = status?.fournisseurs?.filter((f) => f.mode === "scraper").length || 0;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={s.pageTitle}>Fournisseurs & Synchronisation</div>
          <div style={s.pageSubtitle}>
            Mise a jour automatique des prix et stocks via API ou scraping web
          </div>
        </div>
        <button style={s.btn("primary")} onClick={lancerSyncAll} disabled={syncing}>
          {syncing ? "Synchro en cours..." : "Synchroniser tout"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <div style={s.statsCard(colors.accent)}>
          <div style={s.statsValue}>{status?.total_fournisseurs || 0}</div>
          <div style={s.statsLabel}>Fournisseurs</div>
        </div>
        <div style={s.statsCard(colors.success)}>
          <div style={s.statsValue}>{nbApi}</div>
          <div style={s.statsLabel}>Via API</div>
        </div>
        <div style={s.statsCard(colors.warning)}>
          <div style={s.statsValue}>{nbScraper}</div>
          <div style={s.statsLabel}>Via Scraping</div>
        </div>
        <div style={s.statsCard(colors.success)}>
          <div style={s.statsValue}>{status?.connectes || 0}</div>
          <div style={s.statsLabel}>Actifs</div>
        </div>
      </div>

      <div style={s.card}>
        <div style={s.cardTitle}>Etat des connexions</div>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Fournisseur</th>
              <th style={s.th}>Mode</th>
              <th style={s.th}>Derniere synchro</th>
              <th style={s.th}>Statut</th>
              <th style={s.th}>Produits MAJ</th>
              <th style={s.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {status?.fournisseurs?.map((f) => (
              <tr key={f.id}>
                <td style={s.td}>
                  <span style={{ fontWeight: 600 }}>{NOMS[f.id] || f.id}</span>
                </td>
                <td style={s.td}>
                  <Badge type={modeBadge(f.mode)}>
                    {f.mode === "api" ? "API officielle" : "Scraping web"}
                  </Badge>
                </td>
                <td style={{ ...s.td, color: colors.textSecondary }}>
                  {f.derniere_synchro ? new Date(f.derniere_synchro).toLocaleString("fr-FR") : "Jamais"}
                </td>
                <td style={s.td}>
                  <Badge type={statutBadge(f.dernier_statut)}>{f.dernier_statut}</Badge>
                </td>
                <td style={s.td}>{f.produits_maj}</td>
                <td style={s.td}>
                  <button
                    style={{ ...s.btn("primary"), fontSize: 12, padding: "5px 12px" }}
                    disabled={syncingOne === f.id}
                    onClick={() => lancerSyncOne(f.id)}>
                    {syncingOne === f.id ? "..." : "Synchro"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ ...s.card, borderColor: colors.accent }}>
        <div style={{ fontWeight: 600, marginBottom: 8, color: colors.accent }}>Comment ca marche</div>
        <div style={{ display: "flex", gap: 24 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: colors.success }}>Mode API (recommande)</div>
            <div style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 1.7 }}>
              Connexion directe et fiable aux API officielles des fournisseurs. Necessite une cle API gratuite.
              Ajoutez vos cles dans le fichier <code style={{ background: colors.bg, padding: "2px 6px", borderRadius: 4 }}>.env</code> :
            </div>
            <pre style={{ background: colors.bg, padding: 10, borderRadius: 6, fontSize: 11, marginTop: 6, border: `1px solid ${colors.border}`, color: colors.textSecondary }}>
{`RS_API_KEY=votre_cle
FARNELL_API_KEY=votre_cle
MOUSER_API_KEY=votre_cle`}
            </pre>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: colors.warning }}>Mode Scraping (actuel)</div>
            <div style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 1.7 }}>
              Extraction automatique des prix depuis les sites web des fournisseurs. Aucune cle requise.
              Moins fiable (peut casser si le site change) et plus lent (delais entre requetes pour eviter le blocage).
            </div>
          </div>
        </div>
      </div>

      {historique.length > 0 && (
        <div style={s.card}>
          <div style={s.cardTitle}>Historique des synchronisations</div>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Fournisseur</th>
                <th style={s.th}>Statut</th>
                <th style={s.th}>Produits MAJ</th>
                <th style={s.th}>Erreurs</th>
                <th style={s.th}>Date</th>
                <th style={s.th}>Duree</th>
              </tr>
            </thead>
            <tbody>
              {historique.map((h) => {
                const duree = h.finished_at && h.started_at
                  ? Math.round((new Date(h.finished_at) - new Date(h.started_at)) / 1000)
                  : null;
                return (
                  <tr key={h.id}>
                    <td style={s.td}>{h.fournisseur_nom}</td>
                    <td style={s.td}><Badge type={statutBadge(h.statut)}>{h.statut}</Badge></td>
                    <td style={s.td}>{h.produits_maj}</td>
                    <td style={{ ...s.td, color: h.erreurs > 0 ? colors.danger : colors.textSecondary }}>{h.erreurs}</td>
                    <td style={{ ...s.td, color: colors.textSecondary }}>{new Date(h.started_at).toLocaleString("fr-FR")}</td>
                    <td style={{ ...s.td, color: colors.textSecondary }}>{duree != null ? `${duree}s` : "..."}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
