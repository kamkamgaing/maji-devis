import { useState, useEffect, useCallback, useRef } from "react";

// ---------------------------------------------------------------------------
// DATA LAYER - Donnees simulees realistes (remplacables par API)
// ---------------------------------------------------------------------------

const FOURNISSEURS = [
  { id: "rs", nom: "RS Components", delai: "24-48h" },
  { id: "farnell", nom: "Farnell", delai: "24-48h" },
  { id: "mouser", nom: "Mouser", delai: "3-5j" },
];

const CATALOGUE = [
  { id: "SKF-6205", ref: "SKF 6205-2RS", nom: "Roulement a billes etanche", categorie: "Mecanique", unite: "piece", prix: { rs: 12.50, farnell: 11.80, mouser: 12.10 }, stock: { rs: 1450, farnell: 870, mouser: 2300 } },
  { id: "VIS-M8X40", ref: "DIN 912 M8x40", nom: "Vis CHC M8x40 inox A2", categorie: "Visserie", unite: "lot de 100", prix: { rs: 18.30, farnell: 17.90, mouser: 19.50 }, stock: { rs: 5000, farnell: 3200, mouser: 8000 } },
  { id: "MOT-NEMA23", ref: "NEMA 23 2.8A", nom: "Moteur pas a pas NEMA 23", categorie: "Electrique", unite: "piece", prix: { rs: 45.00, farnell: 42.50, mouser: 44.20 }, stock: { rs: 120, farnell: 85, mouser: 200 } },
  { id: "JOINT-NBR50", ref: "NBR 50x62x6", nom: "Joint torique NBR 50mm", categorie: "Etancheite", unite: "lot de 10", prix: { rs: 8.20, farnell: 7.90, mouser: 8.50 }, stock: { rs: 3000, farnell: 2100, mouser: 4500 } },
  { id: "TOLE-ALU2", ref: "AL 5052 2mm", nom: "Tole aluminium 2mm 1000x500", categorie: "Matiere premiere", unite: "feuille", prix: { rs: 35.00, farnell: 33.50, mouser: 36.80 }, stock: { rs: 200, farnell: 150, mouser: 300 } },
  { id: "CAP-470UF", ref: "EEUFR1V471", nom: "Condensateur 470uF 35V", categorie: "Electronique", unite: "piece", prix: { rs: 1.85, farnell: 1.72, mouser: 1.90 }, stock: { rs: 12000, farnell: 8500, mouser: 15000 } },
  { id: "CABLE-4G2", ref: "H07RN-F 4G2.5", nom: "Cable souple 4G2.5mm2 (m)", categorie: "Electrique", unite: "metre", prix: { rs: 4.20, farnell: 3.95, mouser: 4.50 }, stock: { rs: 5000, farnell: 3000, mouser: 7000 } },
  { id: "CAPT-PT100", ref: "PT100 Class A", nom: "Sonde temperature PT100", categorie: "Capteur", unite: "piece", prix: { rs: 28.50, farnell: 26.80, mouser: 29.00 }, stock: { rs: 300, farnell: 180, mouser: 450 } },
  { id: "ROUL-51105", ref: "SKF 51105", nom: "Butee a billes axiale", categorie: "Mecanique", unite: "piece", prix: { rs: 15.80, farnell: 14.90, mouser: 16.20 }, stock: { rs: 800, farnell: 500, mouser: 1200 } },
  { id: "RELAIS-24V", ref: "G2R-1-E 24DC", nom: "Relais industriel 24V 16A", categorie: "Electrique", unite: "piece", prix: { rs: 9.40, farnell: 8.80, mouser: 9.70 }, stock: { rs: 2000, farnell: 1500, mouser: 3500 } },
];

const HISTORIQUE_PRIX = {
  "SKF-6205": [11.20, 11.50, 11.80, 12.00, 12.30, 12.50],
  "VIS-M8X40": [16.50, 17.00, 17.30, 17.80, 18.00, 18.30],
  "MOT-NEMA23": [40.00, 41.50, 42.00, 43.00, 44.00, 45.00],
  "JOINT-NBR50": [7.20, 7.50, 7.80, 7.90, 8.00, 8.20],
  "TOLE-ALU2": [30.00, 31.50, 32.00, 33.00, 34.00, 35.00],
};

const COUTS_PRODUCTION = {
  fraisage: { tauxHoraire: 65, label: "Fraisage CNC" },
  tournage: { tauxHoraire: 55, label: "Tournage CNC" },
  soudure: { tauxHoraire: 45, label: "Soudure" },
  assemblage: { tauxHoraire: 35, label: "Assemblage" },
  controle: { tauxHoraire: 40, label: "Controle qualite" },
};

const GRILLE_TRANSPORT = [
  { poidsMax: 5, zone1: 8.50, zone2: 12.00, zone3: 18.00 },
  { poidsMax: 20, zone1: 15.00, zone2: 22.00, zone3: 35.00 },
  { poidsMax: 100, zone1: 35.00, zone2: 55.00, zone3: 85.00 },
  { poidsMax: 500, zone1: 75.00, zone2: 120.00, zone3: 180.00 },
];

// ---------------------------------------------------------------------------
// IA MODULE - Detection anomalies + suggestion
// ---------------------------------------------------------------------------

function detecterAnomalie(composantId, prixPropose) {
  const historique = HISTORIQUE_PRIX[composantId];
  if (!historique || historique.length < 2) return { status: "ok", confiance: 0.8 };

  const moyenne = historique.reduce((a, b) => a + b, 0) / historique.length;
  const ecartType = Math.sqrt(historique.map(p => Math.pow(p - moyenne, 2)).reduce((a, b) => a + b, 0) / historique.length);
  const seuilBas = moyenne - 2 * ecartType;
  const seuilHaut = moyenne + 2 * ecartType;

  if (prixPropose < moyenne * 0.1) {
    return { status: "critique", message: `Prix suspect : ${prixPropose.toFixed(2)} EUR (possible erreur x100, attendu ~${moyenne.toFixed(2)} EUR)`, confiance: 0.15 };
  }
  if (prixPropose > moyenne * 5) {
    return { status: "critique", message: `Prix anormalement eleve : ${prixPropose.toFixed(2)} EUR (attendu ~${moyenne.toFixed(2)} EUR)`, confiance: 0.15 };
  }
  if (prixPropose < seuilBas || prixPropose > seuilHaut) {
    return { status: "attention", message: `Prix hors fourchette habituelle (${seuilBas.toFixed(2)} - ${seuilHaut.toFixed(2)} EUR)`, confiance: 0.55 };
  }
  return { status: "ok", confiance: 0.95 };
}

function suggererPrix(composantId) {
  const historique = HISTORIQUE_PRIX[composantId];
  if (!historique || historique.length < 2) return null;
  const tendance = historique[historique.length - 1] - historique[historique.length - 2];
  const suggestion = historique[historique.length - 1] + tendance;
  return { prix: Math.max(0, suggestion), source: "Projection lineaire sur historique" };
}

function genererPromptExemple(composant) {
  return `Tu es un assistant specialise dans le chiffrage industriel.

Contexte : Je dois estimer le prix du composant "${composant.nom}" (ref: ${composant.ref}).
Historique des prix sur 6 mois : ${(HISTORIQUE_PRIX[composant.id] || []).join(", ")} EUR.
Prix actuels fournisseurs :
- RS Components : ${composant.prix.rs} EUR
- Farnell : ${composant.prix.farnell} EUR
- Mouser : ${composant.prix.mouser} EUR

Reponds en JSON strict :
{
  "prix_recommande": <number>,
  "fournisseur_recommande": "<string>",
  "confiance": <0-1>,
  "justification": "<string>"
}`;
}

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const colors = {
  bg: "#0F1117",
  surface: "#1A1D27",
  surfaceHover: "#222633",
  border: "#2A2E3B",
  borderLight: "#363B4D",
  text: "#E8E9ED",
  textSecondary: "#8B8FA3",
  textMuted: "#5C6078",
  accent: "#3B82F6",
  accentHover: "#2563EB",
  accentSoft: "rgba(59,130,246,0.12)",
  success: "#10B981",
  successSoft: "rgba(16,185,129,0.12)",
  warning: "#F59E0B",
  warningSoft: "rgba(245,158,11,0.12)",
  danger: "#EF4444",
  dangerSoft: "rgba(239,68,68,0.12)",
};

const s = {
  app: { minHeight: "100vh", background: colors.bg, color: colors.text, fontFamily: "'DM Sans', 'Segoe UI', sans-serif", fontSize: 14 },
  sidebar: { width: 220, background: colors.surface, borderRight: `1px solid ${colors.border}`, padding: "20px 0", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 10 },
  sidebarLogo: { padding: "0 20px 24px", fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", color: colors.accent },
  sidebarItem: (active) => ({ padding: "10px 20px", cursor: "pointer", fontSize: 13, fontWeight: active ? 600 : 400, color: active ? colors.text : colors.textSecondary, background: active ? colors.accentSoft : "transparent", borderRight: active ? `2px solid ${colors.accent}` : "2px solid transparent", transition: "all 0.15s" }),
  main: { marginLeft: 220, padding: "24px 32px" },
  pageTitle: { fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: 24 },
  card: { background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 20, marginBottom: 16 },
  cardTitle: { fontSize: 14, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 },
  input: { width: "100%", padding: "9px 12px", background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 6, color: colors.text, fontSize: 13, outline: "none", boxSizing: "border-box" },
  select: { padding: "9px 12px", background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 6, color: colors.text, fontSize: 13, outline: "none" },
  btn: (variant = "primary") => ({
    padding: "8px 16px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.15s",
    background: variant === "primary" ? colors.accent : variant === "danger" ? colors.danger : "transparent",
    color: variant === "ghost" ? colors.textSecondary : "#fff",
    border: variant === "ghost" ? `1px solid ${colors.border}` : "none",
  }),
  badge: (type) => ({
    display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600,
    background: type === "ok" ? colors.successSoft : type === "attention" ? colors.warningSoft : type === "critique" ? colors.dangerSoft : colors.accentSoft,
    color: type === "ok" ? colors.success : type === "attention" ? colors.warning : type === "critique" ? colors.danger : colors.accent,
  }),
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "8px 12px", fontSize: 11, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `1px solid ${colors.border}` },
  td: { padding: "10px 12px", fontSize: 13, borderBottom: `1px solid ${colors.border}` },
  row: { transition: "background 0.1s", cursor: "pointer" },
  statsCard: (color) => ({ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: "16px 20px", borderLeft: `3px solid ${color}`, flex: 1 }),
  statsValue: { fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em" },
  statsLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  modal: { background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24, width: 600, maxHeight: "80vh", overflow: "auto" },
};

// ---------------------------------------------------------------------------
// COMPONENTS
// ---------------------------------------------------------------------------

function Badge({ type, children }) {
  return <span style={s.badge(type)}>{children}</span>;
}

function ConfidenceBar({ value }) {
  const pct = Math.round(value * 100);
  const color = pct > 80 ? colors.success : pct > 50 ? colors.warning : colors.danger;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 60, height: 4, background: colors.border, borderRadius: 2 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.3s" }} />
      </div>
      <span style={{ fontSize: 11, color, fontWeight: 600 }}>{pct}%</span>
    </div>
  );
}

function PrixCompare({ composant }) {
  const meilleur = Math.min(composant.prix.rs, composant.prix.farnell, composant.prix.mouser);
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {FOURNISSEURS.map(f => {
        const prix = composant.prix[f.id];
        const isBest = prix === meilleur;
        return (
          <div key={f.id} style={{ padding: "6px 10px", borderRadius: 6, background: isBest ? colors.successSoft : colors.bg, border: `1px solid ${isBest ? colors.success : colors.border}`, fontSize: 12 }}>
            <div style={{ fontWeight: 600, color: isBest ? colors.success : colors.text }}>{prix.toFixed(2)} EUR</div>
            <div style={{ fontSize: 10, color: colors.textSecondary }}>{f.nom}</div>
          </div>
        );
      })}
    </div>
  );
}

function RechercheComposant({ onAjouter }) {
  const [recherche, setRecherche] = useState("");
  const resultats = CATALOGUE.filter(c =>
    c.nom.toLowerCase().includes(recherche.toLowerCase()) ||
    c.ref.toLowerCase().includes(recherche.toLowerCase()) ||
    c.categorie.toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <div style={s.card}>
      <div style={s.cardTitle}>Recherche composants</div>
      <input
        style={s.input}
        placeholder="Rechercher par nom, reference ou categorie..."
        value={recherche}
        onChange={e => setRecherche(e.target.value)}
      />
      {recherche.length > 0 && (
        <div style={{ marginTop: 12, maxHeight: 300, overflow: "auto" }}>
          {resultats.length === 0 ? (
            <div style={{ padding: 12, color: colors.textSecondary, fontSize: 13 }}>Aucun composant trouve</div>
          ) : resultats.map(c => (
            <div key={c.id} style={{ ...s.row, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 6 }}
              onMouseEnter={e => e.currentTarget.style.background = colors.surfaceHover}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{c.nom}</div>
                <div style={{ fontSize: 11, color: colors.textSecondary }}>{c.ref} | {c.categorie}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <PrixCompare composant={c} />
                <button style={s.btn("primary")} onClick={() => onAjouter(c)}>Ajouter</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LigneDevisRow({ ligne, onUpdate, onSupprimer }) {
  const anomalie = detecterAnomalie(ligne.composant.id, ligne.prixRetenu);
  return (
    <tr>
      <td style={s.td}>
        <div style={{ fontWeight: 600 }}>{ligne.composant.nom}</div>
        <div style={{ fontSize: 11, color: colors.textSecondary }}>{ligne.composant.ref}</div>
      </td>
      <td style={s.td}>
        <input type="number" min={1} value={ligne.quantite} onChange={e => onUpdate({ ...ligne, quantite: parseInt(e.target.value) || 1 })}
          style={{ ...s.input, width: 70, textAlign: "center" }} />
      </td>
      <td style={s.td}>
        <PrixCompare composant={ligne.composant} />
      </td>
      <td style={s.td}>
        <input type="number" step={0.01} value={ligne.prixRetenu} onChange={e => onUpdate({ ...ligne, prixRetenu: parseFloat(e.target.value) || 0 })}
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
      <td style={{ ...s.td, fontWeight: 600 }}>{(ligne.quantite * ligne.prixRetenu).toFixed(2)} EUR</td>
      <td style={s.td}>
        <button style={{ ...s.btn("ghost"), padding: "4px 8px", color: colors.danger, border: "none" }} onClick={() => onSupprimer(ligne.id)}>Suppr.</button>
      </td>
    </tr>
  );
}

function ModalPrompt({ composant, onFermer }) {
  const prompt = genererPromptExemple(composant);
  const fakeReponse = JSON.stringify({
    prix_recommande: Math.min(composant.prix.rs, composant.prix.farnell, composant.prix.mouser),
    fournisseur_recommande: composant.prix.farnell <= composant.prix.rs && composant.prix.farnell <= composant.prix.mouser ? "Farnell" : "RS Components",
    confiance: 0.92,
    justification: "Prix dans la fourchette historique, tendance haussiere moderee. Fournisseur avec le meilleur prix et stock suffisant."
  }, null, 2);

  return (
    <div style={s.overlay} onClick={onFermer}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Exemple de prompt IA</div>
        <div style={{ fontSize: 11, fontWeight: 600, color: colors.accent, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Prompt envoye au LLM</div>
        <pre style={{ background: colors.bg, padding: 14, borderRadius: 8, fontSize: 12, lineHeight: 1.6, whiteSpace: "pre-wrap", border: `1px solid ${colors.border}`, marginBottom: 16, color: colors.textSecondary }}>
          {prompt}
        </pre>
        <div style={{ fontSize: 11, fontWeight: 600, color: colors.success, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Reponse structuree (JSON)</div>
        <pre style={{ background: colors.bg, padding: 14, borderRadius: 8, fontSize: 12, lineHeight: 1.6, whiteSpace: "pre-wrap", border: `1px solid ${colors.border}`, color: colors.success }}>
          {fakeReponse}
        </pre>
        <div style={{ marginTop: 16, fontSize: 12, color: colors.textSecondary, lineHeight: 1.6 }}>
          Le LLM repond en JSON strict. On parse la reponse, on compare le prix recommande avec nos seuils de detection d'anomalie, et on affiche le resultat au deviseur avec le niveau de confiance.
        </div>
        <button style={{ ...s.btn("primary"), marginTop: 16 }} onClick={onFermer}>Fermer</button>
      </div>
    </div>
  );
}

function ModalAnomalieDemo({ onFermer }) {
  const exemples = [
    { prix: 0.12, attendu: 12.50, status: "critique", desc: "Erreur facteur x100 (virgule decalee)" },
    { prix: 1250, attendu: 12.50, status: "critique", desc: "Erreur facteur x100 (prix en centimes)" },
    { prix: 15.80, attendu: 12.50, status: "attention", desc: "Prix hors fourchette haute (+26%)" },
    { prix: 12.30, attendu: 12.50, status: "ok", desc: "Prix dans la fourchette normale" },
  ];

  return (
    <div style={s.overlay} onClick={onFermer}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Detection d'anomalies IA</div>
        <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 16 }}>Composant : SKF 6205-2RS (moyenne historique : 12.50 EUR)</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {exemples.map((ex, i) => (
            <div key={i} style={{ padding: 14, borderRadius: 8, background: colors.bg, border: `1px solid ${colors.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Prix propose : {ex.prix.toFixed(2)} EUR</div>
                <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{ex.desc}</div>
              </div>
              <Badge type={ex.status}>{ex.status === "ok" ? "Valide" : ex.status === "attention" ? "Attention" : "Bloque"}</Badge>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, padding: 14, borderRadius: 8, background: colors.accentSoft, fontSize: 12, lineHeight: 1.6, color: colors.text }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Algorithme utilise :</div>
          1. Calcul moyenne + ecart-type sur l'historique 6 mois{"\n"}
          2. Seuils statistiques a +/- 2 ecarts-types{"\n"}
          3. Detection facteur x100 / x0.01 (erreur de virgule){"\n"}
          4. Score de confiance 0-100% affiche au deviseur
        </div>
        <button style={{ ...s.btn("primary"), marginTop: 16 }} onClick={onFermer}>Fermer</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PAGES
// ---------------------------------------------------------------------------

function PageDashboard({ devisList, setPage }) {
  const totalDevis = devisList.length;
  const totalMontant = devisList.reduce((sum, d) => sum + d.total, 0);
  const enCours = devisList.filter(d => d.statut === "brouillon").length;
  const valides = devisList.filter(d => d.statut === "valide").length;

  return (
    <div>
      <div style={s.pageTitle}>Tableau de bord</div>
      <div style={s.pageSubtitle}>Vue d'ensemble de l'activite devis</div>
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <div style={s.statsCard(colors.accent)}>
          <div style={s.statsValue}>{totalDevis}</div>
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
        {devisList.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: colors.textSecondary }}>
            Aucun devis. Cliquez sur "Nouveau devis" pour commencer.
          </div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Reference</th>
                <th style={s.th}>Client</th>
                <th style={s.th}>Lignes</th>
                <th style={s.th}>Total</th>
                <th style={s.th}>Statut</th>
                <th style={s.th}>Date</th>
              </tr>
            </thead>
            <tbody>
              {devisList.map(d => (
                <tr key={d.id} style={s.row}
                  onMouseEnter={e => e.currentTarget.style.background = colors.surfaceHover}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  onClick={() => setPage("detail:" + d.id)}>
                  <td style={s.td}><span style={{ fontWeight: 600 }}>{d.reference}</span></td>
                  <td style={s.td}>{d.client}</td>
                  <td style={s.td}>{d.lignes.length} composant{d.lignes.length > 1 ? "s" : ""}</td>
                  <td style={{ ...s.td, fontWeight: 600 }}>{d.total.toFixed(2)} EUR</td>
                  <td style={s.td}><Badge type={d.statut === "valide" ? "ok" : "info"}>{d.statut}</Badge></td>
                  <td style={{ ...s.td, color: colors.textSecondary }}>{d.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function PageNouveauDevis({ onSave, setPage }) {
  const [client, setClient] = useState("");
  const [projet, setProjet] = useState("");
  const [lignes, setLignes] = useState([]);
  const [production, setProduction] = useState([]);
  const [zone, setZone] = useState("zone1");
  const [poidsEstime, setPoidsEstime] = useState(5);
  const [marge, setMarge] = useState(15);
  const [showPrompt, setShowPrompt] = useState(null);
  const [showAnomalie, setShowAnomalie] = useState(false);

  const ajouterComposant = (composant) => {
    if (lignes.find(l => l.composant.id === composant.id)) return;
    const meilleurPrix = Math.min(composant.prix.rs, composant.prix.farnell, composant.prix.mouser);
    setLignes([...lignes, { id: Date.now(), composant, quantite: 1, prixRetenu: meilleurPrix }]);
  };

  const ajouterProduction = (type) => {
    if (production.find(p => p.type === type)) return;
    setProduction([...production, { type, heures: 1 }]);
  };

  const totalComposants = lignes.reduce((sum, l) => sum + l.quantite * l.prixRetenu, 0);
  const totalProduction = production.reduce((sum, p) => sum + p.heures * COUTS_PRODUCTION[p.type].tauxHoraire, 0);
  const transport = GRILLE_TRANSPORT.find(g => poidsEstime <= g.poidsMax)?.[zone] || 0;
  const sousTotal = totalComposants + totalProduction + transport;
  const montantMarge = sousTotal * marge / 100;
  const total = sousTotal + montantMarge;

  const anomaliesCount = lignes.filter(l => detecterAnomalie(l.composant.id, l.prixRetenu).status !== "ok").length;

  const sauvegarder = (statut) => {
    if (!client) return;
    onSave({
      id: Date.now(),
      reference: `DEV-${String(Date.now()).slice(-6)}`,
      client, projet, lignes, production, zone, poidsEstime, marge,
      totalComposants, totalProduction, transport, montantMarge, total,
      statut,
      date: new Date().toLocaleDateString("fr-FR"),
    });
    setPage("dashboard");
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
          <button style={s.btn("ghost")} onClick={() => sauvegarder("brouillon")}>Brouillon</button>
          <button style={{ ...s.btn("primary"), opacity: anomaliesCount > 0 ? 0.5 : 1 }} onClick={() => sauvegarder("valide")}>
            {anomaliesCount > 0 ? `Valider (${anomaliesCount} alerte${anomaliesCount > 1 ? "s" : ""})` : "Valider le devis"}
          </button>
        </div>
      </div>

      {/* Infos generales */}
      <div style={{ ...s.card, display: "flex", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 11, color: colors.textSecondary, display: "block", marginBottom: 4 }}>Client *</label>
          <input style={s.input} placeholder="Nom du client" value={client} onChange={e => setClient(e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 11, color: colors.textSecondary, display: "block", marginBottom: 4 }}>Projet</label>
          <input style={s.input} placeholder="Reference projet" value={projet} onChange={e => setProjet(e.target.value)} />
        </div>
      </div>

      {/* Recherche composants */}
      <RechercheComposant onAjouter={ajouterComposant} />

      {/* Lignes devis */}
      {lignes.length > 0 && (
        <div style={s.card}>
          <div style={{ ...s.cardTitle, justifyContent: "space-between" }}>
            <span>Composants ({lignes.length})</span>
            {lignes.length > 0 && (
              <button style={{ ...s.btn("ghost"), fontSize: 11 }} onClick={() => setShowPrompt(lignes[0].composant)}>
                Voir prompt IA
              </button>
            )}
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
                {lignes.map(l => (
                  <LigneDevisRow key={l.id} ligne={l}
                    onUpdate={updated => setLignes(lignes.map(x => x.id === updated.id ? updated : x))}
                    onSupprimer={id => setLignes(lignes.filter(x => x.id !== id))} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Couts production */}
      <div style={s.card}>
        <div style={s.cardTitle}>Couts de production</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          {Object.entries(COUTS_PRODUCTION).map(([type, data]) => (
            <button key={type} style={{ ...s.btn("ghost"), fontSize: 12 }}
              onClick={() => ajouterProduction(type)}>
              + {data.label} ({data.tauxHoraire} EUR/h)
            </button>
          ))}
        </div>
        {production.map((p, i) => (
          <div key={p.type} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 13, width: 140 }}>{COUTS_PRODUCTION[p.type].label}</span>
            <input type="number" min={0.5} step={0.5} value={p.heures}
              onChange={e => setProduction(production.map((x, j) => j === i ? { ...x, heures: parseFloat(e.target.value) || 0 } : x))}
              style={{ ...s.input, width: 70, textAlign: "center" }} />
            <span style={{ fontSize: 12, color: colors.textSecondary }}>h x {COUTS_PRODUCTION[p.type].tauxHoraire} EUR</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{(p.heures * COUTS_PRODUCTION[p.type].tauxHoraire).toFixed(2)} EUR</span>
            <button style={{ ...s.btn("ghost"), padding: "2px 6px", color: colors.danger, border: "none" }}
              onClick={() => setProduction(production.filter((_, j) => j !== i))}>x</button>
          </div>
        ))}
      </div>

      {/* Transport */}
      <div style={s.card}>
        <div style={s.cardTitle}>Transport</div>
        <div style={{ display: "flex", gap: 16 }}>
          <div>
            <label style={{ fontSize: 11, color: colors.textSecondary, display: "block", marginBottom: 4 }}>Zone</label>
            <select style={s.select} value={zone} onChange={e => setZone(e.target.value)}>
              <option value="zone1">Zone 1 (locale)</option>
              <option value="zone2">Zone 2 (nationale)</option>
              <option value="zone3">Zone 3 (internationale)</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: colors.textSecondary, display: "block", marginBottom: 4 }}>Poids estime (kg)</label>
            <input type="number" min={1} value={poidsEstime} onChange={e => setPoidsEstime(parseInt(e.target.value) || 1)}
              style={{ ...s.input, width: 100 }} />
          </div>
          <div style={{ paddingTop: 18, fontSize: 13 }}>
            Cout transport : <span style={{ fontWeight: 700 }}>{transport.toFixed(2)} EUR</span>
          </div>
        </div>
      </div>

      {/* Recapitulatif */}
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
            <span>{transport.toFixed(2)} EUR</span>
          </div>
          <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 8, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: colors.textSecondary }}>Sous-total HT</span>
            <span style={{ fontWeight: 600 }}>{sousTotal.toFixed(2)} EUR</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: colors.textSecondary }}>Marge</span>
              <input type="number" min={0} max={50} value={marge} onChange={e => setMarge(parseInt(e.target.value) || 0)}
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

      {showPrompt && <ModalPrompt composant={showPrompt} onFermer={() => setShowPrompt(null)} />}
      {showAnomalie && <ModalAnomalieDemo onFermer={() => setShowAnomalie(false)} />}
    </div>
  );
}

function PageDetail({ devis, setPage }) {
  if (!devis) return <div style={s.pageTitle}>Devis introuvable</div>;

  return (
    <div>
      <button style={{ ...s.btn("ghost"), marginBottom: 16, fontSize: 12 }} onClick={() => setPage("dashboard")}>Retour</button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={s.pageTitle}>{devis.reference}</div>
          <div style={s.pageSubtitle}>{devis.client} {devis.projet ? `- ${devis.projet}` : ""} | {devis.date}</div>
        </div>
        <Badge type={devis.statut === "valide" ? "ok" : "info"}>{devis.statut}</Badge>
      </div>

      <div style={s.card}>
        <div style={s.cardTitle}>Composants ({devis.lignes.length})</div>
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
            {devis.lignes.map(l => (
              <tr key={l.id}>
                <td style={s.td}>{l.composant.nom}</td>
                <td style={{ ...s.td, color: colors.textSecondary }}>{l.composant.ref}</td>
                <td style={s.td}>{l.quantite}</td>
                <td style={s.td}>{l.prixRetenu.toFixed(2)} EUR</td>
                <td style={{ ...s.td, fontWeight: 600 }}>{(l.quantite * l.prixRetenu).toFixed(2)} EUR</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ ...s.card, maxWidth: 400, borderColor: colors.accent }}>
        <div style={s.cardTitle}>Total</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: colors.textSecondary }}>Composants</span><span>{devis.totalComposants.toFixed(2)} EUR</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: colors.textSecondary }}>Production</span><span>{devis.totalProduction.toFixed(2)} EUR</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: colors.textSecondary }}>Transport</span><span>{devis.transport.toFixed(2)} EUR</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: colors.textSecondary }}>Marge ({devis.marge}%)</span><span>{devis.montantMarge.toFixed(2)} EUR</span>
          </div>
          <div style={{ borderTop: `2px solid ${colors.accent}`, paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 16, fontWeight: 700 }}>Total</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: colors.accent }}>{devis.total.toFixed(2)} EUR</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// APP
// ---------------------------------------------------------------------------

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [devisList, setDevisList] = useState([]);

  const handleSave = (devis) => {
    setDevisList([devis, ...devisList]);
  };

  const nav = [
    { id: "dashboard", label: "Tableau de bord" },
    { id: "nouveau", label: "Nouveau devis" },
  ];

  const currentPage = page.startsWith("detail:") ? "detail" : page;
  const devisId = page.startsWith("detail:") ? parseInt(page.split(":")[1]) : null;
  const devisDetail = devisList.find(d => d.id === devisId);

  return (
    <div style={s.app}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={s.sidebar}>
        <div style={s.sidebarLogo}>Maji Devis</div>
        {nav.map(n => (
          <div key={n.id} style={s.sidebarItem(currentPage === n.id)} onClick={() => setPage(n.id)}>
            {n.label}
          </div>
        ))}
        <div style={{ marginTop: "auto", padding: "16px 20px", borderTop: `1px solid ${colors.border}` }}>
          <div style={{ fontSize: 11, color: colors.textMuted }}>MVP v1.0</div>
          <div style={{ fontSize: 11, color: colors.textMuted }}>Groupe Maji</div>
        </div>
      </div>
      <div style={s.main}>
        {currentPage === "dashboard" && <PageDashboard devisList={devisList} setPage={setPage} />}
        {currentPage === "nouveau" && <PageNouveauDevis onSave={handleSave} setPage={setPage} />}
        {currentPage === "detail" && <PageDetail devis={devisDetail} setPage={setPage} />}
      </div>
    </div>
  );
}
