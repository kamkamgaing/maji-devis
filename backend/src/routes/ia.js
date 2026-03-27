const { Router } = require("express");
const { detecterAnomalie, suggererPrix, getHistorique, getComposantAvecPrix } = require("../services/anomalieDetector");
const { buildPrompt } = require("../services/llmClient");

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
    const composant = await getComposantAvecPrix(req.params.catalogueId);
    if (!composant) return res.status(404).json({ error: "Composant introuvable" });

    const historique = await getHistorique(composant.id);

    const NOMS = { rs: "RS Components", farnell: "Farnell", mouser: "Mouser" };
    const prixFournisseurs = {};
    for (const p of composant.prix_fournisseurs || []) {
      if (p.fournisseur_id && p.prix) {
        prixFournisseurs[NOMS[p.fournisseur_id] || p.fournisseur_id] = parseFloat(p.prix);
      }
    }

    const meilleurPrix = Object.values(prixFournisseurs).length
      ? Math.min(...Object.values(prixFournisseurs))
      : 0;

    const prompt = buildPrompt(composant, historique, prixFournisseurs, meilleurPrix);

    res.json({
      prompt,
      composant_id: composant.id,
      composant_nom: composant.nom,
      model: "mistralai/Mistral-7B-Instruct-v0.3",
      provider: "HuggingFace Inference API",
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
