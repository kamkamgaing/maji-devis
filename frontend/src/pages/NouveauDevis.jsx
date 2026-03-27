import { useState, useEffect } from "react";
import { s, colors } from "../styles/theme";
import { devisApi, transportApi, productionApi } from "../services/api";
import RechercheComposant from "../components/RechercheComposant";
import LigneDevisRow from "../components/LigneDevisRow";
import ModalPrompt from "../components/ModalPrompt";
import ModalAnomalieDemo from "../components/ModalAnomalieDemo";
import ConfirmDialog from "../components/ConfirmDialog";
import Spinner from "../components/Spinner";
import { useToast } from "../components/Toast";

export default function NouveauDevis({ setPage }) {
  const [client, setClient] = useState("");
  const [clientTouched, setClientTouched] = useState(false);
  const [projet, setProjet] = useState("");
  const [lignes, setLignes] = useState([]);
  const [production, setProduction] = useState([]);
  const [coutsProduction, setCoutsProduction] = useState([]);
  const [zone, setZone] = useState("zone1");
  const [poidsEstime, setPoidsEstime] = useState(5);
  const [marge, setMarge] = useState(15);
  const [transportCout, setTransportCout] = useState(0);
  const [transportLoading, setTransportLoading] = useState(false);
  const [showPrompt, setShowPrompt] = useState(null);
  const [showAnomalie, setShowAnomalie] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const toast = useToast();

  useEffect(() => {
    productionApi.list().then(setCoutsProduction).catch(() => {
      toast.warning("Impossible de charger les coûts de production");
    });
  }, []);

  useEffect(() => {
    setTransportLoading(true);
    transportApi.calculer(poidsEstime, zone)
      .then((res) => setTransportCout(res.cout))
      .catch(() => {
        setTransportCout(0);
        toast.warning("Calcul du transport indisponible");
      })
      .finally(() => setTransportLoading(false));
  }, [poidsEstime, zone]);

  const ajouterComposant = (composant) => {
    const existant = lignes.find((l) => l.catalogue_id === composant.id);
    if (existant) {
      setLignes(lignes.map((l) =>
        l.catalogue_id === composant.id ? { ...l, quantite: l.quantite + 1 } : l
      ));
      toast.success(`${composant.nom} — quantité portée à ${existant.quantite + 1}`);
      return;
    }
    const meilleurPrix = Math.min(...composant.prix.map((p) => parseFloat(p.prix)));
    setLignes([...lignes, {
      _localId: Date.now(),
      catalogue_id: composant.id,
      nom: composant.nom,
      ref: composant.ref,
      prix: composant.prix,
      quantite: 1,
      prix_retenu: meilleurPrix,
    }]);
    toast.success(`${composant.nom} ajouté au devis`);
  };

  const ajouterProduction = (type) => {
    if (production.find((p) => p.type === type)) {
      toast.info("Ce poste de production est déjà ajouté");
      return;
    }
    const cp = coutsProduction.find((c) => c.type === type);
    setProduction([...production, { type, heures: 1, label: cp?.label, taux_horaire: parseFloat(cp?.taux_horaire || 0) }]);
  };

  const totalComposants = lignes.reduce((sum, l) => sum + l.quantite * l.prix_retenu, 0);
  const totalProduction = production.reduce((sum, p) => sum + p.heures * p.taux_horaire, 0);
  const sousTotal = totalComposants + totalProduction + transportCout;
  const montantMarge = sousTotal * marge / 100;
  const total = sousTotal + montantMarge;

  const fmt = (v) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(v);

  const clientError = clientTouched && !client.trim();

  const sauvegarder = async (statut) => {
    if (saving) return;
    if (!client.trim()) {
      setClientTouched(true);
      toast.error("Le nom du client est obligatoire");
      return;
    }
    if (lignes.length === 0 && production.length === 0) {
      toast.warning("Ajoutez au moins un composant ou un poste de production");
      return;
    }
    setSaving(true);
    try {
      await devisApi.create({
        clientName: client,
        projet,
        zone,
        poids_estime: poidsEstime,
        marge,
        total_composants: totalComposants,
        total_production: totalProduction,
        transport: transportCout,
        montant_marge: montantMarge,
        total,
        statut,
        lignes: lignes.map((l) => ({ catalogue_id: l.catalogue_id, quantite: l.quantite, prix_retenu: l.prix_retenu })),
        production: production.map((p) => ({ type: p.type, heures: p.heures })),
      });
      toast.success(statut === "valide" ? "Devis validé avec succès !" : "Brouillon enregistré");
      setPage("dashboard");
    } catch (err) {
      toast.error("Impossible d'enregistrer le devis : " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={s.pageTitle}>Nouveau devis</div>
          <div style={s.pageSubtitle}>Assemblez votre devis étape par étape</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button style={s.btn("ghost")} onClick={() => setShowAnomalie(true)}>Démo anomalies IA</button>
          <button style={s.btn("ghost")} onClick={() => sauvegarder("brouillon")} disabled={saving}>
            {saving ? <Spinner size={14} color="#fff" /> : "Brouillon"}
          </button>
          <button style={s.btn("primary")} onClick={() => sauvegarder("valide")} disabled={saving}>
            {saving ? <Spinner size={14} color="#fff" /> : "Valider le devis"}
          </button>
        </div>
      </div>

      <div style={{ ...s.card, display: "flex", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 11, color: clientError ? colors.danger : colors.textSecondary, display: "block", marginBottom: 4 }}>
            Client {clientError ? "— Ce champ est requis" : "*"}
          </label>
          <input
            style={{
              ...s.input,
              borderColor: clientError ? colors.danger : colors.border,
              boxShadow: clientError ? `0 0 0 2px ${colors.dangerSoft}` : "none",
            }}
            placeholder="Nom du client"
            value={client}
            onChange={(e) => setClient(e.target.value)}
            onBlur={() => setClientTouched(true)}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 11, color: colors.textSecondary, display: "block", marginBottom: 4 }}>Projet</label>
          <input style={s.input} placeholder="Référence projet (optionnel)" value={projet} onChange={(e) => setProjet(e.target.value)} />
        </div>
      </div>

      <RechercheComposant onAjouter={ajouterComposant} />

      {lignes.length > 0 && (
        <div style={s.card}>
          <div style={{ ...s.cardTitle, justifyContent: "space-between" }}>
            <span>Composants ({lignes.length})</span>
            <button style={{ ...s.btn("ghost"), fontSize: 11 }} onClick={() => setShowPrompt(lignes[0].catalogue_id)}>
              Voir prompt IA
            </button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Composant</th>
                  <th style={s.th}>Qté</th>
                  <th style={s.th}>Prix fournisseurs</th>
                  <th style={s.th}>Prix retenu</th>
                  <th style={s.th}>Confiance IA</th>
                  <th style={s.th}>Sous-total</th>
                  <th style={s.th}></th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((l) => (
                  <LigneDevisRow key={l._localId} ligne={l}
                    onUpdate={(updated) => setLignes(lignes.map((x) => x._localId === updated._localId ? updated : x))}
                    onSupprimer={(id) => setConfirmDelete(id)} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={s.card}>
        <div style={s.cardTitle}>Coûts de production</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          {coutsProduction.map((cp) => (
            <button key={cp.type} style={{ ...s.btn("ghost"), fontSize: 12 }}
              onClick={() => ajouterProduction(cp.type)}>
              + {cp.label} ({parseFloat(cp.taux_horaire).toFixed(0)} €/h)
            </button>
          ))}
        </div>
        {production.length === 0 && (
          <div style={{ fontSize: 12, color: colors.textMuted, padding: "8px 0" }}>
            Cliquez sur un type de production ci-dessus pour l'ajouter au devis.
          </div>
        )}
        {production.map((p, i) => (
          <div key={p.type} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 13, width: 140 }}>{p.label}</span>
            <input type="number" min={0.5} step={0.5} value={p.heures}
              onChange={(e) => setProduction(production.map((x, j) => j === i ? { ...x, heures: parseFloat(e.target.value) || 0 } : x))}
              style={{ ...s.input, width: 70, textAlign: "center" }} />
            <span style={{ fontSize: 12, color: colors.textSecondary }}>h × {p.taux_horaire} €</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{fmt(p.heures * p.taux_horaire)}</span>
            <button style={{ ...s.btn("ghost"), padding: "2px 6px", color: colors.danger, border: "none" }}
              onClick={() => setProduction(production.filter((_, j) => j !== i))}>✕</button>
          </div>
        ))}
      </div>

      <div style={s.card}>
        <div style={s.cardTitle}>Transport</div>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-end" }}>
          <div>
            <label style={{ fontSize: 11, color: colors.textSecondary, display: "block", marginBottom: 4 }}>Zone</label>
            <select style={s.select} value={zone} onChange={(e) => setZone(e.target.value)}>
              <option value="zone1">Zone 1 — Locale</option>
              <option value="zone2">Zone 2 — Nationale</option>
              <option value="zone3">Zone 3 — Internationale</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: colors.textSecondary, display: "block", marginBottom: 4 }}>Poids estimé (kg)</label>
            <input type="number" min={1} value={poidsEstime} onChange={(e) => setPoidsEstime(parseInt(e.target.value) || 1)}
              style={{ ...s.input, width: 100 }} />
          </div>
          <div style={{ paddingBottom: 4, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
            {transportLoading
              ? <Spinner size={14} label="Calcul..." />
              : <>Coût transport : <span style={{ fontWeight: 700 }}>{fmt(transportCout)}</span></>
            }
          </div>
        </div>
      </div>

      <div style={{ ...s.card, borderColor: colors.accent, background: `linear-gradient(135deg, ${colors.surface} 0%, rgba(59,130,246,0.04) 100%)` }}>
        <div style={s.cardTitle}>Récapitulatif</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 400 }}>
          {[
            ["Total composants", totalComposants],
            ["Total production", totalProduction],
            ["Transport", transportCout],
          ].map(([label, val]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: colors.textSecondary }}>{label}</span>
              <span>{fmt(val)}</span>
            </div>
          ))}
          <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 8, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: colors.textSecondary }}>Sous-total HT</span>
            <span style={{ fontWeight: 600 }}>{fmt(sousTotal)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: colors.textSecondary }}>Marge</span>
              <input type="number" min={0} max={50} value={marge} onChange={(e) => setMarge(parseInt(e.target.value) || 0)}
                style={{ ...s.input, width: 50, textAlign: "center", padding: "4px 6px" }} />
              <span style={{ color: colors.textSecondary }}>%</span>
            </div>
            <span>{fmt(montantMarge)}</span>
          </div>
          <div style={{ borderTop: `2px solid ${colors.accent}`, paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 16, fontWeight: 700 }}>Total</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: colors.accent }}>{fmt(total)}</span>
          </div>
        </div>
      </div>

      {showPrompt && <ModalPrompt catalogueId={showPrompt} onFermer={() => setShowPrompt(null)} />}
      {showAnomalie && <ModalAnomalieDemo onFermer={() => setShowAnomalie(false)} />}
      {confirmDelete != null && (
        <ConfirmDialog
          title="Supprimer ce composant ?"
          message="Cette ligne sera retirée du devis. Vous pourrez toujours la rajouter depuis la recherche."
          confirmLabel="Supprimer"
          onConfirm={() => { setLignes(lignes.filter((x) => x._localId !== confirmDelete)); setConfirmDelete(null); }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
