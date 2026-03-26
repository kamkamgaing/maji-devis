import { useState, useEffect } from "react";
import { s, colors } from "../styles/theme";
import { syncApi } from "../services/api";
import Badge from "../components/Badge";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../components/Toast";

const NOMS = { rs: "RS Components", farnell: "Farnell", mouser: "Mouser" };

export default function Fournisseurs() {
  const [status, setStatus] = useState(null);
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncingOne, setSyncingOne] = useState(null);
  const [confirmSyncAll, setConfirmSyncAll] = useState(false);
  const toast = useToast();

  const charger = async () => {
    try {
      const [st, hist] = await Promise.all([syncApi.status(), syncApi.historique()]);
      setStatus(st);
      setHistorique(hist);
      setError(null);
    } catch {
      setError("Impossible de charger les données fournisseurs");
      toast.error("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { charger(); }, []);

  const lancerSyncAll = async () => {
    setConfirmSyncAll(false);
    setSyncing(true);
    try {
      await syncApi.syncAll();
      await charger();
      toast.success("Synchronisation terminée !");
    } catch (err) {
      toast.error("Échec de la synchronisation : " + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const lancerSyncOne = async (id) => {
    setSyncingOne(id);
    try {
      await syncApi.syncOne(id);
      await charger();
      toast.success(`${NOMS[id] || id} synchronisé !`);
    } catch (err) {
      toast.error(`Échec sync ${NOMS[id] || id} : ${err.message}`);
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

  const modeBadge = (mode) => mode === "api" ? "ok" : "attention";

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <Spinner size={28} label="Chargement des fournisseurs..." />
      </div>
    );
  }

  if (error && !status) {
    return (
      <EmptyState
        icon="⚠️"
        title="Erreur de connexion"
        message={error}
        action={<button style={s.btn("primary")} onClick={charger}>Réessayer</button>}
      />
    );
  }

  const nbApi = status?.fournisseurs?.filter((f) => f.mode === "api").length || 0;
  const nbScraper = status?.fournisseurs?.filter((f) => f.mode === "scraper").length || 0;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={s.pageTitle}>Fournisseurs & Synchronisation</div>
          <div style={s.pageSubtitle}>
            Mise à jour automatique des prix et stocks via API ou scraping web
          </div>
        </div>
        <button style={s.btn("primary")} onClick={() => setConfirmSyncAll(true)} disabled={syncing}>
          {syncing ? <Spinner size={14} color="#fff" /> : "🔄 Synchroniser tout"}
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
        <div style={s.statsCard("#8B5CF6")}>
          <div style={s.statsValue}>{status?.connectes || 0}</div>
          <div style={s.statsLabel}>Actifs</div>
        </div>
      </div>

      <div style={s.card}>
        <div style={s.cardTitle}>État des connexions</div>
        <div style={{ overflowX: "auto" }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Fournisseur</th>
                <th style={s.th}>Mode</th>
                <th style={s.th}>Dernière synchro</th>
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
                    {f.derniere_synchro
                      ? new Date(f.derniere_synchro).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                      : <span style={{ fontStyle: "italic" }}>Jamais</span>}
                  </td>
                  <td style={s.td}>
                    <Badge type={statutBadge(f.dernier_statut)}>{f.dernier_statut || "—"}</Badge>
                  </td>
                  <td style={s.td}>{f.produits_maj}</td>
                  <td style={s.td}>
                    <button
                      style={{ ...s.btn("primary"), fontSize: 12, padding: "5px 12px" }}
                      disabled={syncingOne === f.id}
                      onClick={() => lancerSyncOne(f.id)}>
                      {syncingOne === f.id ? <Spinner size={12} color="#fff" /> : "Synchro"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ ...s.card, borderColor: colors.accent }}>
        <div style={{ fontWeight: 600, marginBottom: 8, color: colors.accent }}>Comment ça marche</div>
        <div style={{ display: "flex", gap: 24 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: colors.success }}>Mode API (recommandé)</div>
            <div style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 1.7 }}>
              Connexion directe et fiable aux API officielles des fournisseurs. Nécessite une clé API gratuite.
              Ajoutez vos clés dans le fichier <code style={{ background: colors.bg, padding: "2px 6px", borderRadius: 4 }}>.env</code> :
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
              Extraction automatique des prix depuis les sites web des fournisseurs. Aucune clé requise.
              Moins fiable (peut casser si le site change) et plus lent (délais entre requêtes pour éviter le blocage).
            </div>
          </div>
        </div>
      </div>

      {historique.length > 0 ? (
        <div style={s.card}>
          <div style={s.cardTitle}>Historique des synchronisations</div>
          <div style={{ overflowX: "auto" }}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Fournisseur</th>
                  <th style={s.th}>Statut</th>
                  <th style={s.th}>Produits MAJ</th>
                  <th style={s.th}>Erreurs</th>
                  <th style={s.th}>Date</th>
                  <th style={s.th}>Durée</th>
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
                      <td style={{ ...s.td, color: colors.textSecondary }}>
                        {new Date(h.started_at).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td style={{ ...s.td, color: colors.textSecondary }}>{duree != null ? `${duree}s` : "..."}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={s.card}>
          <EmptyState
            icon="📊"
            title="Aucun historique"
            message="Lancez une synchronisation pour voir l'historique ici."
          />
        </div>
      )}

      {confirmSyncAll && (
        <ConfirmDialog
          title="Synchroniser tous les fournisseurs ?"
          message="Cette opération va mettre à jour les prix et stocks de tous les fournisseurs. Cela peut prendre quelques minutes."
          confirmLabel="Synchroniser"
          variant="primary"
          onConfirm={lancerSyncAll}
          onCancel={() => setConfirmSyncAll(false)}
        />
      )}
    </div>
  );
}
