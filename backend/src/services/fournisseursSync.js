const pool = require("../config/db");

// Clients API (nécessitent une clé)
const RSClient = require("./suppliers/rsClient");
const FarnellClient = require("./suppliers/farnellClient");
const MouserClient = require("./suppliers/mouserClient");

// Scrapers (sans clé, gratuits)
const RSScraper = require("./suppliers/rsScraper");
const FarnellScraper = require("./suppliers/farnellScraper");
const MouserScraper = require("./suppliers/mouserScraper");

function buildClient(ApiClass, ScraperClass, apiKey) {
  if (apiKey) {
    const c = new ApiClass(apiKey);
    c.mode = "api";
    return c;
  }
  const s = new ScraperClass();
  s.mode = "scraper";
  return s;
}

const clients = {
  rs: buildClient(RSClient, RSScraper, process.env.RS_API_KEY),
  farnell: buildClient(FarnellClient, FarnellScraper, process.env.FARNELL_API_KEY),
  mouser: buildClient(MouserClient, MouserScraper, process.env.MOUSER_API_KEY),
};

function getEnabledSuppliers() {
  return Object.entries(clients)
    .filter(([, c]) => c.enabled)
    .map(([id, c]) => ({ id, client: c, mode: c.mode }));
}

async function syncFournisseur(fournisseurId) {
  const client = clients[fournisseurId];
  if (!client?.enabled) {
    return { fournisseur: fournisseurId, statut: "skip", message: "Client non disponible" };
  }

  const { rows: logRows } = await pool.query(
    `INSERT INTO sync_log (fournisseur_id, statut) VALUES ($1, 'en_cours') RETURNING id`,
    [fournisseurId]
  );
  const logId = logRows[0].id;

  const { rows: catalogue } = await pool.query(
    `SELECT c.id, c.ref FROM catalogue c
     JOIN catalogue_prix cp ON cp.catalogue_id = c.id
     WHERE cp.fournisseur_id = $1`,
    [fournisseurId]
  );

  let majCount = 0;
  let errCount = 0;
  const errors = [];
  const source = client.mode === "api" ? "api" : "scraper";

  for (const item of catalogue) {
    try {
      const result = await client.searchByRef(item.ref);
      if (!result || result.prix == null) continue;

      const oldRow = await pool.query(
        "SELECT prix, stock FROM catalogue_prix WHERE catalogue_id = $1 AND fournisseur_id = $2",
        [item.id, fournisseurId]
      );
      const oldPrix = oldRow.rows[0] ? parseFloat(oldRow.rows[0].prix) : null;

      await pool.query(
        `UPDATE catalogue_prix
         SET prix = $1, stock = COALESCE($2, stock), updated_at = NOW(), source = $3
         WHERE catalogue_id = $4 AND fournisseur_id = $5`,
        [result.prix, result.stock, source, item.id, fournisseurId]
      );

      if (oldPrix !== null && oldPrix !== result.prix) {
        await pool.query(
          `INSERT INTO historique_prix (catalogue_id, prix, mois)
           VALUES ($1, $2, EXTRACT(MONTH FROM NOW()))`,
          [item.id, result.prix]
        );
      }

      majCount++;
    } catch (err) {
      errCount++;
      errors.push(`${item.ref}: ${err.message}`);
    }
  }

  const statut = errCount === 0 ? "termine" : errCount < catalogue.length ? "partiel" : "echec";

  await pool.query(
    `UPDATE sync_log
     SET statut = $1, produits_maj = $2, erreurs = $3, detail = $4, finished_at = NOW()
     WHERE id = $5`,
    [statut, majCount, errCount, errors.join("\n") || null, logId]
  );

  return {
    fournisseur: fournisseurId,
    mode: source,
    statut,
    produits_maj: majCount,
    erreurs: errCount,
    log_id: logId,
  };
}

async function syncAll() {
  const enabled = getEnabledSuppliers();

  const resultats = [];
  for (const { id } of enabled) {
    const res = await syncFournisseur(id);
    resultats.push(res);
  }

  const totalMaj = resultats.reduce((s, r) => s + (r.produits_maj || 0), 0);
  const totalErr = resultats.reduce((s, r) => s + (r.erreurs || 0), 0);

  return {
    statut: totalErr === 0 ? "termine" : "partiel",
    fournisseurs_synchro: enabled.length,
    total_produits_maj: totalMaj,
    total_erreurs: totalErr,
    resultats,
  };
}

async function getLastSync() {
  const { rows } = await pool.query(
    `SELECT sl.*, f.nom AS fournisseur_nom
     FROM sync_log sl
     JOIN fournisseurs f ON f.id = sl.fournisseur_id
     ORDER BY sl.started_at DESC
     LIMIT 10`
  );
  return rows;
}

async function getSyncStatus() {
  const enabled = getEnabledSuppliers();
  const { rows: lastSyncs } = await pool.query(
    `SELECT DISTINCT ON (fournisseur_id)
       fournisseur_id, statut, produits_maj, erreurs, started_at, finished_at
     FROM sync_log
     ORDER BY fournisseur_id, started_at DESC`
  );

  const fournisseursStatus = Object.keys(clients).map((id) => {
    const last = lastSyncs.find((s) => s.fournisseur_id === id);
    return {
      id,
      mode: clients[id].mode,
      connecte: clients[id].enabled,
      derniere_synchro: last?.finished_at || null,
      dernier_statut: last?.statut || "jamais",
      produits_maj: last?.produits_maj || 0,
    };
  });

  return {
    fournisseurs: fournisseursStatus,
    connectes: enabled.length,
    total_fournisseurs: Object.keys(clients).length,
  };
}

module.exports = { syncAll, syncFournisseur, getLastSync, getSyncStatus, getEnabledSuppliers };
