const { Router } = require("express");
const { detecterAnomalie, suggererPrix, getHistorique } = require("../services/anomalieDetector");
const pool = require("../config/db");

const router = Router();

router.post("/anomalie", async (req, res, next) => {
  try {
    const { catalogue_id, prix } = req.body;
    if (!catalogue_id || prix == null) {
      return res.status(400).json({ error: "catalogue_id et prix requis" });
    }
    const result = await detecterAnomalie(catalogue_id, parseFloat(prix));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get("/suggestion/:catalogueId", async (req, res, next) => {
  try {
    const suggestion = await suggererPrix(req.params.catalogueId);
    if (!suggestion) return res.status(404).json({ error: "Historique insuffisant" });
    res.json(suggestion);
  } catch (err) {
    next(err);
  }
});

router.get("/prompt/:catalogueId", async (req, res, next) => {
  try {
    const { rows: catRows } = await pool.query(
      `SELECT c.*, json_agg(json_build_object(
          'fournisseur_id', cp.fournisseur_id,
          'prix', cp.prix
       )) AS prix_fournisseurs
       FROM catalogue c
       LEFT JOIN catalogue_prix cp ON cp.catalogue_id = c.id
       WHERE c.id = $1
       GROUP BY c.id`,
      [req.params.catalogueId]
    );
    if (!catRows.length) return res.status(404).json({ error: "Composant introuvable" });

    const composant = catRows[0];
    const historique = await getHistorique(composant.id);

    const prixMap = {};
    for (const p of composant.prix_fournisseurs) {
      prixMap[p.fournisseur_id] = parseFloat(p.prix);
    }

    const prompt = `Tu es un assistant specialise dans le chiffrage industriel.

Contexte : Je dois estimer le prix du composant "${composant.nom}" (ref: ${composant.ref}).
Historique des prix sur 6 mois : ${historique.join(", ")} EUR.
Prix actuels fournisseurs :
- RS Components : ${prixMap.rs || "N/A"} EUR
- Farnell : ${prixMap.farnell || "N/A"} EUR
- Mouser : ${prixMap.mouser || "N/A"} EUR

Reponds en JSON strict :
{
  "prix_recommande": <number>,
  "fournisseur_recommande": "<string>",
  "confiance": <0-1>,
  "justification": "<string>"
}`;

    res.json({ prompt, composant_id: composant.id, composant_nom: composant.nom });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
