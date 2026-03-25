const { Router } = require("express");
const pool = require("../config/db");

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT c.*,
        json_agg(json_build_object(
          'fournisseur_id', cp.fournisseur_id,
          'prix', cp.prix,
          'stock', cp.stock
        )) AS prix
      FROM catalogue c
      LEFT JOIN catalogue_prix cp ON cp.catalogue_id = c.id
    `;
    const params = [];

    if (search) {
      query += ` WHERE LOWER(c.nom) LIKE $1 OR LOWER(c.ref) LIKE $1 OR LOWER(c.categorie) LIKE $1`;
      params.push(`%${search.toLowerCase()}%`);
    }

    query += ` GROUP BY c.id ORDER BY c.nom`;

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get("/fournisseurs", async (_req, res, next) => {
  try {
    const { rows } = await pool.query("SELECT * FROM fournisseurs ORDER BY nom");
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.*,
        json_agg(json_build_object(
          'fournisseur_id', cp.fournisseur_id,
          'prix', cp.prix,
          'stock', cp.stock
        )) AS prix
      FROM catalogue c
      LEFT JOIN catalogue_prix cp ON cp.catalogue_id = c.id
      WHERE c.id = $1
      GROUP BY c.id`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Composant introuvable" });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
