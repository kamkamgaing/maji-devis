require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
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

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/catalogue", catalogueRoutes);
app.use("/api/devis", devisRoutes);
app.use("/api/ia", iaRoutes);
app.use("/api/transport", transportRoutes);
app.use("/api/production", productionRoutes);
app.use("/api/sync", syncRoutes);
app.use("/api/pdf/devis", pdfRoutes);

const frontendDist = path.resolve(__dirname, "../../frontend/dist");
const indexHtml = path.join(frontendDist, "index.html");

if (fs.existsSync(frontendDist)) {
  console.log(`[Static] Serving frontend from ${frontendDist}`);
  app.use(express.static(frontendDist));
  app.get("*", (_req, res) => {
    res.sendFile(indexHtml);
  });
} else {
  console.log("[Static] frontend/dist introuvable, mode API uniquement");
  app.get("/", (_req, res) => {
    res.json({ message: "Maji Devis API", docs: "/api/health" });
  });
}

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Erreur serveur interne" });
});

app.listen(PORT, "0.0.0.0", async () => {
  console.log(`Maji Devis API demarre sur 0.0.0.0:${PORT}`);
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? "configuree" : "absente"}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV || "development"}`);

  for (let attempt = 1; attempt <= 15; attempt++) {
    try {
      await initDatabase();
      console.log("[Boot] Base de donnees prete");
      const intervalH = parseFloat(process.env.SYNC_INTERVAL_HOURS) || 6;
      scheduler.start(intervalH * 3600000);
      return;
    } catch (err) {
      console.log(`[Boot] Tentative ${attempt}/15 - DB: ${err.message}`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  console.error("[Boot] DB non connectee apres 15 tentatives, API disponible sans DB");
});
