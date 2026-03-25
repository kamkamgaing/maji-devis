const { Router } = require("express");
const pool = require("../config/db");

const router = Router();

router.get("/grille", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM grille_transport ORDER BY poids_max ASC"
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get("/calculer", async (req, res, next) => {
  try {
    const { poids, zone } = req.query;
    if (!poids || !zone) {
      return res.status(400).json({ error: "poids et zone requis" });
    }

    const validZones = ["zone1", "zone2", "zone3"];
    if (!validZones.includes(zone)) {
      return res.status(400).json({ error: "Zone invalide (zone1, zone2, zone3)" });
    }

    const { rows } = await pool.query(
      `SELECT ${zone} AS cout FROM grille_transport WHERE poids_max >= $1 ORDER BY poids_max ASC LIMIT 1`,
      [parseFloat(poids)]
    );

    if (!rows.length) {
      return res.status(400).json({ error: "Poids hors grille" });
    }

    res.json({ poids: parseFloat(poids), zone, cout: parseFloat(rows[0].cout) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
