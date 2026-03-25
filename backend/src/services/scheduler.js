const { syncAll, getEnabledSuppliers } = require("./fournisseursSync");

let intervalHandle = null;

const DEFAULT_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 heures

function start(intervalMs = DEFAULT_INTERVAL_MS) {
  if (intervalHandle) return;

  const enabled = getEnabledSuppliers();
  if (!enabled.length) {
    console.log("[Scheduler] Aucun fournisseur actif, synchro automatique desactivee");
    return;
  }

  const modes = enabled.map((e) => `${e.id} (${e.mode})`).join(", ");
  console.log(`[Scheduler] Synchro auto activee pour ${enabled.length} fournisseur(s) [${modes}] toutes les ${intervalMs / 3600000}h`);

  // Premiere synchro 30s apres le demarrage
  setTimeout(async () => {
    console.log("[Scheduler] Synchro initiale...");
    try {
      const result = await syncAll();
      console.log(`[Scheduler] Synchro initiale terminee: ${result.total_produits_maj} produits mis a jour, ${result.total_erreurs} erreurs`);
    } catch (err) {
      console.error("[Scheduler] Erreur synchro initiale:", err.message);
    }
  }, 30000);

  intervalHandle = setInterval(async () => {
    console.log("[Scheduler] Synchro periodique...");
    try {
      const result = await syncAll();
      console.log(`[Scheduler] Synchro terminee: ${result.total_produits_maj} MAJ, ${result.total_erreurs} erreurs`);
    } catch (err) {
      console.error("[Scheduler] Erreur synchro:", err.message);
    }
  }, intervalMs);
}

function stop() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    console.log("[Scheduler] Synchro automatique arretee");
  }
}

module.exports = { start, stop };
