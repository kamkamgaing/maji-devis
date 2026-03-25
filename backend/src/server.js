require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const express = require("express");
const cors = require("cors");
const path = require("path");
const pool = require("./config/db");
const catalogueRoutes = require("./routes/catalogue");
const devisRoutes = require("./routes/devis");
const iaRoutes = require("./routes/ia");
const transportRoutes = require("./routes/transport");
const productionRoutes = require("./routes/production");
const syncRoutes = require("./routes/sync");
const pdfRoutes = require("./routes/pdf");
const scheduler = require("./services/scheduler");
const initDatabase = require("./config/initDb");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res.status(500).json({ status: "error", db: "disconnected", error: err.message });
  }
});

app.use("/api/catalogue", catalogueRoutes);
app.use("/api/devis", devisRoutes);
app.use("/api/ia", iaRoutes);
app.use("/api/transport", transportRoutes);
app.use("/api/production", productionRoutes);
app.use("/api/sync", syncRoutes);
app.use("/api/pdf/devis", pdfRoutes);

// En production, servir le frontend buildé
const frontendDist = path.resolve(__dirname, "../../frontend/dist");
app.use(express.static(frontendDist));
app.get("*", (_req, res, next) => {
  if (_req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(frontendDist, "index.html"));
});

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Erreur serveur interne" });
});

async function boot() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`Maji Devis API demarre sur le port ${PORT}`);
    const intervalH = parseFloat(process.env.SYNC_INTERVAL_HOURS) || 6;
    scheduler.start(intervalH * 3600000);
  });
}

boot().catch((err) => {
  console.error("Erreur au demarrage:", err);
  process.exit(1);
});
