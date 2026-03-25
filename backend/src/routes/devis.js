const { Router } = require("express");
const pool = require("../config/db");

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM devis ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { rows: devisRows } = await pool.query(
      "SELECT * FROM devis WHERE id = $1",
      [req.params.id]
    );
    if (!devisRows.length) return res.status(404).json({ error: "Devis introuvable" });

    const devis = devisRows[0];

    const { rows: lignes } = await pool.query(
      `SELECT dl.*, c.ref, c.nom, c.categorie, c.unite
       FROM devis_lignes dl
       JOIN catalogue c ON c.id = dl.catalogue_id
       WHERE dl.devis_id = $1`,
      [devis.id]
    );

    const { rows: production } = await pool.query(
      `SELECT dp.*, cp.label, cp.taux_horaire
       FROM devis_production dp
       JOIN couts_production cp ON cp.type = dp.type
       WHERE dp.devis_id = $1`,
      [devis.id]
    );

    res.json({ ...devis, lignes, production });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const {
      clientName, projet, zone, poids_estime, marge,
      total_composants, total_production, transport,
      montant_marge, total, statut, lignes, production,
    } = req.body;

    const ref = `DEV-${String(Date.now()).slice(-6)}`;

    const { rows } = await client.query(
      `INSERT INTO devis
        (reference, client, projet, zone, poids_estime, marge,
         total_composants, total_production, transport, montant_marge, total, statut)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [ref, clientName, projet, zone, poids_estime, marge,
       total_composants, total_production, transport, montant_marge, total, statut || "brouillon"]
    );
    const devis = rows[0];

    if (lignes?.length) {
      for (const l of lignes) {
        await client.query(
          `INSERT INTO devis_lignes (devis_id, catalogue_id, quantite, prix_retenu)
           VALUES ($1, $2, $3, $4)`,
          [devis.id, l.catalogue_id, l.quantite, l.prix_retenu]
        );
      }
    }

    if (production?.length) {
      for (const p of production) {
        await client.query(
          `INSERT INTO devis_production (devis_id, type, heures) VALUES ($1, $2, $3)`,
          [devis.id, p.type, p.heures]
        );
      }
    }

    await client.query("COMMIT");
    res.status(201).json(devis);
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
});

router.patch("/:id/statut", async (req, res, next) => {
  try {
    const { statut } = req.body;
    const { rows } = await pool.query(
      "UPDATE devis SET statut = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [statut, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Devis introuvable" });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { rowCount } = await pool.query("DELETE FROM devis WHERE id = $1", [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: "Devis introuvable" });
    res.json({ message: "Devis supprime" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
