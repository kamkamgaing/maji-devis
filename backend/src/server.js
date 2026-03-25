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

let dbReady = false;

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    dbReady = true;
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res.status(200).json({ status: "starting", db: "connecting", error: err.message });
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

app.listen(PORT, async () => {
  console.log(`Maji Devis API demarre sur le port ${PORT}`);
  console.log(`DATABASE_URL configuree: ${!!process.env.DATABASE_URL}`);

  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      await initDatabase();
      console.log("[Boot] Base de donnees prete");
      const intervalH = parseFloat(process.env.SYNC_INTERVAL_HOURS) || 6;
      scheduler.start(intervalH * 3600000);
      return;
    } catch (err) {
      console.log(`[Boot] Tentative ${attempt}/10 - DB pas prete: ${err.message}`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  console.error("[Boot] Impossible de se connecter a la DB apres 10 tentatives");
});
