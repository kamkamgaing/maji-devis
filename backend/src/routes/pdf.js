const { Router } = require("express");
const PDFDocument = require("pdfkit");
const pool = require("../config/db");

const router = Router();

const GREEN = "#2E7D32";
const DARK = "#1A1D27";
const GRAY = "#6B7280";
const LIGHT_BG = "#F8F9FA";

function drawLine(doc, y) {
  doc.strokeColor("#E5E7EB").lineWidth(0.5).moveTo(50, y).lineTo(545, y).stroke();
}

router.get("/:id", async (req, res, next) => {
  try {
    const { rows: devisRows } = await pool.query("SELECT * FROM devis WHERE id = $1", [req.params.id]);
    if (!devisRows.length) return res.status(404).json({ error: "Devis introuvable" });
    const devis = devisRows[0];

    const { rows: lignes } = await pool.query(
      `SELECT dl.*, c.ref, c.nom, c.categorie, c.unite
       FROM devis_lignes dl JOIN catalogue c ON c.id = dl.catalogue_id
       WHERE dl.devis_id = $1`, [devis.id]
    );
    const { rows: production } = await pool.query(
      `SELECT dp.*, cp.label, cp.taux_horaire
       FROM devis_production dp JOIN couts_production cp ON cp.type = dp.type
       WHERE dp.devis_id = $1`, [devis.id]
    );

    const doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: true });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=devis-${devis.reference}.pdf`);
    doc.pipe(res);

    // --- En-tete ---
    doc.rect(0, 0, 595, 100).fill(GREEN);
    doc.fillColor("#FFFFFF").fontSize(22).font("Helvetica-Bold").text("MAJI DEVIS", 50, 30);
    doc.fillColor("#C8E6C9").fontSize(10).font("Helvetica").text("Manufacture the Future", 50, 58);
    doc.fillColor("#FFFFFF").fontSize(14).font("Helvetica-Bold").text(devis.reference, 400, 30, { align: "right", width: 145 });
    doc.fillColor("#9CA3AF").fontSize(9).font("Helvetica")
      .text(new Date(devis.created_at).toLocaleDateString("fr-FR"), 400, 52, { align: "right", width: 145 });
    doc.fillColor("#9CA3AF").fontSize(9)
      .text(devis.statut.toUpperCase(), 400, 66, { align: "right", width: 145 });

    // --- Infos client ---
    let y = 120;
    doc.fillColor(DARK).fontSize(12).font("Helvetica-Bold").text("Client", 50, y);
    y += 18;
    doc.fillColor(DARK).fontSize(10).font("Helvetica").text(devis.client, 50, y);
    if (devis.projet) {
      y += 14;
      doc.fillColor(GRAY).fontSize(9).text(`Projet : ${devis.projet}`, 50, y);
    }

    // --- Tableau composants ---
    y += 30;
    doc.fillColor(DARK).fontSize(12).font("Helvetica-Bold").text("Composants", 50, y);
    y += 20;

    doc.rect(50, y, 495, 20).fill(LIGHT_BG);
    doc.fillColor(GRAY).fontSize(8).font("Helvetica-Bold");
    doc.text("COMPOSANT", 55, y + 6);
    doc.text("REF", 200, y + 6);
    doc.text("QTE", 310, y + 6, { width: 40, align: "center" });
    doc.text("P.U.", 360, y + 6, { width: 60, align: "right" });
    doc.text("TOTAL", 440, y + 6, { width: 100, align: "right" });
    y += 22;

    doc.font("Helvetica").fontSize(9);
    for (const l of lignes) {
      if (y > 720) { doc.addPage(); y = 50; }
      const sousTotal = l.quantite * parseFloat(l.prix_retenu);
      doc.fillColor(DARK).text(l.nom, 55, y, { width: 140 });
      doc.fillColor(GRAY).text(l.ref, 200, y, { width: 105 });
      doc.fillColor(DARK).text(String(l.quantite), 310, y, { width: 40, align: "center" });
      doc.text(`${parseFloat(l.prix_retenu).toFixed(2)} EUR`, 360, y, { width: 60, align: "right" });
      doc.font("Helvetica-Bold").text(`${sousTotal.toFixed(2)} EUR`, 440, y, { width: 100, align: "right" });
      doc.font("Helvetica");
      y += 16;
      drawLine(doc, y - 2);
    }

    // --- Tableau production ---
    if (production.length) {
      y += 16;
      if (y > 680) { doc.addPage(); y = 50; }
      doc.fillColor(DARK).fontSize(12).font("Helvetica-Bold").text("Production", 50, y);
      y += 20;

      doc.rect(50, y, 495, 20).fill(LIGHT_BG);
      doc.fillColor(GRAY).fontSize(8).font("Helvetica-Bold");
      doc.text("OPERATION", 55, y + 6);
      doc.text("HEURES", 310, y + 6, { width: 40, align: "center" });
      doc.text("TAUX", 360, y + 6, { width: 60, align: "right" });
      doc.text("TOTAL", 440, y + 6, { width: 100, align: "right" });
      y += 22;

      doc.font("Helvetica").fontSize(9);
      for (const p of production) {
        if (y > 720) { doc.addPage(); y = 50; }
        const sousTotal = p.heures * parseFloat(p.taux_horaire);
        doc.fillColor(DARK).text(p.label, 55, y, { width: 240 });
        doc.text(`${p.heures}h`, 310, y, { width: 40, align: "center" });
        doc.text(`${parseFloat(p.taux_horaire).toFixed(2)} EUR/h`, 360, y, { width: 60, align: "right" });
        doc.font("Helvetica-Bold").text(`${sousTotal.toFixed(2)} EUR`, 440, y, { width: 100, align: "right" });
        doc.font("Helvetica");
        y += 16;
        drawLine(doc, y - 2);
      }
    }

    // --- Recapitulatif ---
    y += 24;
    if (y > 650) { doc.addPage(); y = 50; }

    const recapX = 350;
    const recapW = 195;

    doc.rect(recapX - 10, y - 6, recapW + 20, 120).lineWidth(1).strokeColor(GREEN).stroke();

    doc.fillColor(DARK).fontSize(10).font("Helvetica-Bold").text("Recapitulatif", recapX, y);
    y += 18;

    const lignesRecap = [
      ["Composants", `${parseFloat(devis.total_composants).toFixed(2)} EUR`],
      ["Production", `${parseFloat(devis.total_production).toFixed(2)} EUR`],
      ["Transport", `${parseFloat(devis.transport).toFixed(2)} EUR`],
      [`Marge (${devis.marge}%)`, `${parseFloat(devis.montant_marge).toFixed(2)} EUR`],
    ];

    doc.font("Helvetica").fontSize(9);
    for (const [label, val] of lignesRecap) {
      doc.fillColor(GRAY).text(label, recapX, y);
      doc.fillColor(DARK).text(val, recapX + 80, y, { width: recapW - 80, align: "right" });
      y += 14;
    }

    y += 4;
    doc.strokeColor(GREEN).lineWidth(1.5).moveTo(recapX, y).lineTo(recapX + recapW, y).stroke();
    y += 8;
    doc.fillColor(DARK).fontSize(12).font("Helvetica-Bold").text("TOTAL", recapX, y);
    doc.fillColor(GREEN).fontSize(14).text(`${parseFloat(devis.total).toFixed(2)} EUR`, recapX + 80, y - 1, { width: recapW - 80, align: "right" });

    // --- Pied de page ---
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.fillColor(GRAY).fontSize(7).font("Helvetica")
        .text(`Manufacture the Future | ${devis.reference} | Page ${i + 1}/${pages.count}`, 50, 810, { width: 495, align: "center" });
    }

    doc.end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
