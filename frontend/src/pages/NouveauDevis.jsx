import { useState, useEffect } from "react";
import { s, colors } from "../styles/theme";
import { devisApi, transportApi, productionApi } from "../services/api";
import RechercheComposant from "../components/RechercheComposant";
import LigneDevisRow from "../components/LigneDevisRow";
import ModalPrompt from "../components/ModalPrompt";
import ModalAnomalieDemo from "../components/ModalAnomalieDemo";

export default function NouveauDevis({ setPage }) {
  const [client, setClient] = useState("");
  const [projet, setProjet] = useState("");
  const [lignes, setLignes] = useState([]);
  const [production, setProduction] = useState([]);
  const [coutsProduction, setCoutsProduction] = useState([]);
  const [zone, setZone] = useState("zone1");
  const [poidsEstime, setPoidsEstime] = useState(5);
  const [marge, setMarge] = useState(15);
  const [transportCout, setTransportCout] = useState(0);
  const [showPrompt, setShowPrompt] = useState(null);
  const [showAnomalie, setShowAnomalie] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    productionApi.list().then(setCoutsProduction).catch(() => {});
  }, []);

  useEffect(() => {
    transportApi.calculer(poidsEstime, zone)
      .then((res) => setTransportCout(res.cout))
      .catch(() => setTransportCout(0));
  }, [poidsEstime, zone]);

  const ajouterComposant = (composant) => {
    if (lignes.find((l) => l.catalogue_id === composant.id)) return;
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
  };

  const ajouterProduction = (type) => {
    if (production.find((p) => p.type === type)) return;
    const cp = coutsProduction.find((c) => c.type === type);
    setProduction([...production, { type, heures: 1, label: cp?.label, taux_horaire: parseFloat(cp?.taux_horaire || 0) }]);
  };

  const totalComposants = lignes.reduce((sum, l) => sum + l.quantite * l.prix_retenu, 0);
  const totalProduction = production.reduce((sum, p) => sum + p.heures * p.taux_horaire, 0);
  const sousTotal = totalComposants + totalProduction + transportCout;
  const montantMarge = sousTotal * marge / 100;
  const total = sousTotal + montantMarge;

  const sauvegarder = async (statut) => {
    if (!client || saving) return;
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
      setPage("dashboard");
    } catch (err) {
      alert("Erreur: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={s.pageTitle}>Nouveau devis</div>
          <div style={s.pageSubtitle}>Assemblez votre devis etape par etape</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={s.btn("ghost")} onClick={() => setShowAnomalie(true)}>Demo anomalies IA</button>
          <button style={s.btn("ghost")} onClick={() => sauvegarder("brouillon")} disabled={saving}>Brouillon</button>
          <button style={s.btn("primary")} onClick={() => sauvegarder("valide")} disabled={saving}>Valider le devis</button>
        </div>
      </div>

      <div style={{ ...s.card, display: "flex", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 11, color: colors.textSecondary, display: "block", marginBottom: 4 }}>Client *</label>
          <input style={s.input} placeholder="Nom du client" value={client} onChange={(e) => setClient(e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 11, color: colors.textSecondary, display: "block", marginBottom: 4 }}>Projet</label>
          <input style={s.input} placeholder="Reference projet" value={projet} onChange={(e) => setProjet(e.target.value)} />
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
                  <th style={s.th}>Qte</th>
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
                    onSupprimer={(id) => setLignes(lignes.filter((x) => x._localId !== id))} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={s.card}>
        <div style={s.cardTitle}>Couts de production</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          {coutsProduction.map((cp) => (
            <button key={cp.type} style={{ ...s.btn("ghost"), fontSize: 12 }}
              onClick={() => ajouterProduction(cp.type)}>
              + {cp.label} ({parseFloat(cp.taux_horaire).toFixed(0)} EUR/h)
            </button>
          ))}
        </div>
        {production.map((p, i) => (
          <div key={p.type} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 13, width: 140 }}>{p.label}</span>
            <input type="number" min={0.5} step={0.5} value={p.heures}
              onChange={(e) => setProduction(production.map((x, j) => j === i ? { ...x, heures: parseFloat(e.target.value) || 0 } : x))}
              style={{ ...s.input, width: 70, textAlign: "center" }} />
            <span style={{ fontSize: 12, color: colors.textSecondary }}>h x {p.taux_horaire} EUR</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{(p.heures * p.taux_horaire).toFixed(2)} EUR</span>
            <button style={{ ...s.btn("ghost"), padding: "2px 6px", color: colors.danger, border: "none" }}
              onClick={() => setProduction(production.filter((_, j) => j !== i))}>x</button>
          </div>
        ))}
      </div>

      <div style={s.card}>
        <div style={s.cardTitle}>Transport</div>
        <div style={{ display: "flex", gap: 16 }}>
          <div>
            <label style={{ fontSize: 11, color: colors.textSecondary, display: "block", marginBottom: 4 }}>Zone</label>
            <select style={s.select} value={zone} onChange={(e) => setZone(e.target.value)}>
              <option value="zone1">Zone 1 (locale)</option>
              <option value="zone2">Zone 2 (nationale)</option>
              <option value="zone3">Zone 3 (internationale)</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: colors.textSecondary, display: "block", marginBottom: 4 }}>Poids estime (kg)</label>
            <input type="number" min={1} value={poidsEstime} onChange={(e) => setPoidsEstime(parseInt(e.target.value) || 1)}
              style={{ ...s.input, width: 100 }} />
          </div>
          <div style={{ paddingTop: 18, fontSize: 13 }}>
            Cout transport : <span style={{ fontWeight: 700 }}>{transportCout.toFixed(2)} EUR</span>
          </div>
        </div>
      </div>

      <div style={{ ...s.card, borderColor: colors.accent }}>
        <div style={s.cardTitle}>Recapitulatif</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 400 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: colors.textSecondary }}>Total composants</span>
            <span>{totalComposants.toFixed(2)} EUR</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: colors.textSecondary }}>Total production</span>
            <span>{totalProduction.toFixed(2)} EUR</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: colors.textSecondary }}>Transport</span>
            <span>{transportCout.toFixed(2)} EUR</span>
          </div>
          <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 8, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: colors.textSecondary }}>Sous-total HT</span>
            <span style={{ fontWeight: 600 }}>{sousTotal.toFixed(2)} EUR</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: colors.textSecondary }}>Marge</span>
              <input type="number" min={0} max={50} value={marge} onChange={(e) => setMarge(parseInt(e.target.value) || 0)}
                style={{ ...s.input, width: 50, textAlign: "center", padding: "4px 6px" }} />
              <span style={{ color: colors.textSecondary }}>%</span>
            </div>
            <span>{montantMarge.toFixed(2)} EUR</span>
          </div>
          <div style={{ borderTop: `2px solid ${colors.accent}`, paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 16, fontWeight: 700 }}>Total TTC</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: colors.accent }}>{total.toFixed(2)} EUR</span>
          </div>
        </div>
      </div>

      {showPrompt && <ModalPrompt catalogueId={showPrompt} onFermer={() => setShowPrompt(null)} />}
      {showAnomalie && <ModalAnomalieDemo onFermer={() => setShowAnomalie(false)} />}
    </div>
  );
}
