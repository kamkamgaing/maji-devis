const pool = require("../config/db");

async function getHistorique(catalogueId) {
  const { rows } = await pool.query(
    "SELECT prix FROM historique_prix WHERE catalogue_id = $1 ORDER BY mois ASC",
    [catalogueId]
  );
  return rows.map((r) => parseFloat(r.prix));
}

async function detecterAnomalie(catalogueId, prixPropose) {
  const historique = await getHistorique(catalogueId);
  if (!historique.length || historique.length < 2) {
    return { status: "ok", confiance: 0.8 };
  }

  const moyenne = historique.reduce((a, b) => a + b, 0) / historique.length;
  const ecartType = Math.sqrt(
    historique.map((p) => Math.pow(p - moyenne, 2)).reduce((a, b) => a + b, 0) /
      historique.length
  );
  const seuilBas = moyenne - 2 * ecartType;
  const seuilHaut = moyenne + 2 * ecartType;

  if (prixPropose < moyenne * 0.1) {
    return {
      status: "critique",
      message: `Prix suspect : ${prixPropose.toFixed(2)} EUR (possible erreur x100, attendu ~${moyenne.toFixed(2)} EUR)`,
      confiance: 0.15,
    };
  }
  if (prixPropose > moyenne * 5) {
    return {
      status: "critique",
      message: `Prix anormalement eleve : ${prixPropose.toFixed(2)} EUR (attendu ~${moyenne.toFixed(2)} EUR)`,
      confiance: 0.15,
    };
  }
  if (prixPropose < seuilBas || prixPropose > seuilHaut) {
    return {
      status: "attention",
      message: `Prix hors fourchette habituelle (${seuilBas.toFixed(2)} - ${seuilHaut.toFixed(2)} EUR)`,
      confiance: 0.55,
    };
  }
  return { status: "ok", confiance: 0.95 };
}

async function suggererPrix(catalogueId) {
  const historique = await getHistorique(catalogueId);
  if (!historique.length || historique.length < 2) return null;
  const tendance = historique[historique.length - 1] - historique[historique.length - 2];
  const suggestion = historique[historique.length - 1] + tendance;
  return {
    prix: Math.max(0, parseFloat(suggestion.toFixed(2))),
    source: "Projection lineaire sur historique",
  };
}

module.exports = { detecterAnomalie, suggererPrix, getHistorique };
