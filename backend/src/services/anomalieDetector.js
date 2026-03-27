const pool = require("../config/db");
const { analyserPrix } = require("./llmClient");

async function getHistorique(catalogueId) {
  const { rows } = await pool.query(
    "SELECT prix, mois FROM historique_prix WHERE catalogue_id = $1 ORDER BY mois ASC",
    [catalogueId]
  );
  return rows.map((r) => parseFloat(r.prix));
}

async function getComposantAvecPrix(catalogueId) {
  const { rows } = await pool.query(
    `SELECT c.*, json_agg(json_build_object(
        'fournisseur_id', cp.fournisseur_id,
        'prix', cp.prix
     )) AS prix_fournisseurs
     FROM catalogue c
     LEFT JOIN catalogue_prix cp ON cp.catalogue_id = c.id
     WHERE c.id = $1
     GROUP BY c.id`,
    [catalogueId]
  );
  if (!rows.length) return null;
  return rows[0];
}

async function detecterAnomalie(catalogueId, prixPropose) {
  const composant = await getComposantAvecPrix(catalogueId);
  if (!composant) {
    return { status: "ok", confiance: 0.5, message: "Composant non trouvé" };
  }

  const historique = await getHistorique(catalogueId);

  const prixFournisseurs = {};
  const NOMS = { rs: "RS Components", farnell: "Farnell", mouser: "Mouser" };
  for (const p of composant.prix_fournisseurs || []) {
    if (p.fournisseur_id && p.prix) {
      prixFournisseurs[NOMS[p.fournisseur_id] || p.fournisseur_id] = parseFloat(p.prix);
    }
  }

  try {
    const llmResult = await analyserPrix(composant, historique, prixFournisseurs, prixPropose);

    return {
      status: llmResult.anomalie,
      confiance: llmResult.confiance,
      message: llmResult.justification,
      prix_recommande: llmResult.prix_recommande,
      fournisseur_recommande: llmResult.fournisseur_recommande,
      model: llmResult.model,
      response_time_ms: llmResult.response_time_ms,
      source: "llm",
    };
  } catch (err) {
    console.error("[LLM] Erreur:", err.message);
    return {
      status: "attention",
      confiance: 0.5,
      message: `Analyse IA indisponible (${err.message})`,
      source: "fallback",
    };
  }
}

async function suggererPrix(catalogueId) {
  const composant = await getComposantAvecPrix(catalogueId);
  if (!composant) return null;

  const historique = await getHistorique(catalogueId);
  if (!historique.length) return null;

  const prixFournisseurs = {};
  const NOMS = { rs: "RS Components", farnell: "Farnell", mouser: "Mouser" };
  for (const p of composant.prix_fournisseurs || []) {
    if (p.fournisseur_id && p.prix) {
      prixFournisseurs[NOMS[p.fournisseur_id] || p.fournisseur_id] = parseFloat(p.prix);
    }
  }

  const meilleurPrix = Math.min(...Object.values(prixFournisseurs));

  try {
    const llmResult = await analyserPrix(composant, historique, prixFournisseurs, meilleurPrix);
    return {
      prix: llmResult.prix_recommande || meilleurPrix,
      fournisseur: llmResult.fournisseur_recommande,
      justification: llmResult.justification,
      source: "llm",
    };
  } catch (err) {
    return {
      prix: meilleurPrix,
      source: "meilleur prix fournisseur (LLM indisponible)",
    };
  }
}

module.exports = { detecterAnomalie, suggererPrix, getHistorique, getComposantAvecPrix };
