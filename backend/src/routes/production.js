const { Router } = require("express");
const pool = require("../config/db");

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM couts_production ORDER BY type"
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
