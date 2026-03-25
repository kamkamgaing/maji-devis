const fs = require("fs");
const path = require("path");
const pool = require("./db");

async function initDatabase() {
  try {
    const { rows } = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'catalogue')"
    );

    if (rows[0].exists) {
      console.log("[DB] Tables deja existantes, init ignoree");
      return;
    }

    console.log("[DB] Premiere execution, creation des tables...");

    const sqlDir = path.resolve(__dirname, "../../../db/init");
    const files = fs.readdirSync(sqlDir).filter((f) => f.endsWith(".sql")).sort();

    for (const file of files) {
      const sql = fs.readFileSync(path.join(sqlDir, file), "utf8");
      await pool.query(sql);
      console.log(`[DB] Execute: ${file}`);
    }

    console.log("[DB] Initialisation terminee");
  } catch (err) {
    console.error("[DB] Erreur initialisation:", err.message);
    throw err;
  }
}

module.exports = initDatabase;
