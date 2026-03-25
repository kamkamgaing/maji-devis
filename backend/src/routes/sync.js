const { Router } = require("express");
const { syncAll, syncFournisseur, getLastSync, getSyncStatus } = require("../services/fournisseursSync");

const router = Router();

let syncRunning = false;

router.get("/status", async (_req, res, next) => {
  try {
    const status = await getSyncStatus();
    res.json(status);
  } catch (err) {
    next(err);
  }
});

router.get("/historique", async (_req, res, next) => {
  try {
    const logs = await getLastSync();
    res.json(logs);
  } catch (err) {
    next(err);
  }
});

router.post("/all", async (_req, res, next) => {
  if (syncRunning) {
    return res.status(409).json({ error: "Une synchronisation est deja en cours" });
  }
  try {
    syncRunning = true;
    const result = await syncAll();
    res.json(result);
  } catch (err) {
    next(err);
  } finally {
    syncRunning = false;
  }
});

router.post("/:fournisseurId", async (req, res, next) => {
  const { fournisseurId } = req.params;
  if (!["rs", "farnell", "mouser"].includes(fournisseurId)) {
    return res.status(400).json({ error: "Fournisseur invalide (rs, farnell, mouser)" });
  }
  try {
    const result = await syncFournisseur(fournisseurId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
