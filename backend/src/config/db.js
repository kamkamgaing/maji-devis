const { Pool } = require("pg");

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : new Pool({
      user: process.env.POSTGRES_USER || "maji",
      password: process.env.POSTGRES_PASSWORD || "maji_secret",
      host: process.env.POSTGRES_HOST || "localhost",
      port: parseInt(process.env.POSTGRES_PORT || "5432"),
      database: process.env.POSTGRES_DB || "maji_devis",
    });

pool.on("error", (err) => {
  console.error("Erreur inattendue sur le pool PostgreSQL", err);
});

module.exports = pool;
