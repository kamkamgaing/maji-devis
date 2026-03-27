const puppeteer = require("puppeteer");
const path = require("path");

const DIR = path.join(__dirname, "screenshots");
const BASE = "https://maji-devis-production.up.railway.app";

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    defaultViewport: { width: 1400, height: 900 },
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  page.on("console", msg => console.log("PAGE:", msg.text()));
  page.on("pageerror", err => console.log("PAGE ERROR:", err.message));

  // 1. Dashboard
  console.log("1/8 Dashboard...");
  await page.goto(BASE, { waitUntil: "networkidle0", timeout: 15000 });
  await delay(3000);
  let content = await page.content();
  console.log("  Page length:", content.length, "Has root:", content.includes("root"));
  await page.screenshot({ path: path.join(DIR, "01-dashboard.png"), fullPage: true });

  // 2. Nouveau devis
  console.log("2/8 Nouveau devis...");
  try {
    await page.evaluate(() => {
      const items = document.querySelectorAll('[role="button"]');
      for (const el of items) {
        if (el.textContent.includes("Nouveau devis")) { el.click(); return true; }
      }
      return false;
    });
  } catch (e) { console.log("  Click error:", e.message); }
  await delay(2000);
  await page.screenshot({ path: path.join(DIR, "02-nouveau-devis-vide.png"), fullPage: true });

  // 3. Remplir client + recherche
  console.log("3/8 Recherche composant...");
  try {
    const allInputs = await page.$$("input");
    console.log("  Found", allInputs.length, "inputs");
    if (allInputs.length >= 3) {
      await allInputs[0].click({ clickCount: 3 });
      await allInputs[0].type("Entreprise ABC", { delay: 30 });
      await allInputs[1].click({ clickCount: 3 });
      await allInputs[1].type("Projet X-200", { delay: 30 });
      await allInputs[2].click();
      await allInputs[2].type("vis", { delay: 50 });
    }
  } catch (e) { console.log("  Input error:", e.message); }
  await delay(2000);
  await page.screenshot({ path: path.join(DIR, "03-recherche-composant.png"), fullPage: true });

  // 4. Ajouter composant
  console.log("4/8 Ajout composant...");
  try {
    await page.evaluate(() => {
      const btns = document.querySelectorAll("button");
      for (const btn of btns) {
        if (btn.textContent.trim() === "Ajouter") { btn.click(); return true; }
      }
      return false;
    });
  } catch (e) { console.log("  Click error:", e.message); }
  await delay(2000);
  await page.screenshot({ path: path.join(DIR, "04-composant-ajoute.png"), fullPage: true });

  // 5. Clic prix fournisseur
  console.log("5/8 Clic prix fournisseur...");
  try {
    const clicked = await page.evaluate(() => {
      const cards = document.querySelectorAll('[role="button"][title*="Utiliser le prix"]');
      if (cards.length >= 2) { cards[cards.length - 1].click(); return cards.length; }
      return 0;
    });
    console.log("  Prix cards found:", clicked);
  } catch (e) { console.log("  Click error:", e.message); }
  await delay(1500);
  await page.screenshot({ path: path.join(DIR, "05-prix-clique.png"), fullPage: true });

  // 6. Production
  console.log("6/8 Production et transport...");
  try {
    await page.evaluate(() => {
      const btns = document.querySelectorAll("button");
      for (const btn of btns) {
        if (btn.textContent.includes("Assemblage") || btn.textContent.includes("Soudure") || btn.textContent.includes("Usinage")) {
          btn.click(); return true;
        }
      }
      return false;
    });
  } catch (e) { console.log("  Click error:", e.message); }
  await delay(1000);
  await page.screenshot({ path: path.join(DIR, "06-production-transport.png"), fullPage: true });

  // 7. Recapitulatif
  console.log("7/8 Recapitulatif...");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await delay(1000);
  await page.screenshot({ path: path.join(DIR, "07-recapitulatif.png"), fullPage: true });

  // 8. Fournisseurs
  console.log("8/8 Fournisseurs...");
  try {
    await page.evaluate(() => {
      const items = document.querySelectorAll('[role="button"]');
      for (const el of items) {
        if (el.textContent.includes("Fournisseurs")) { el.click(); return true; }
      }
      return false;
    });
  } catch (e) { console.log("  Click error:", e.message); }
  await delay(2000);
  await page.screenshot({ path: path.join(DIR, "08-fournisseurs.png"), fullPage: true });

  await browser.close();
  console.log("Done! Screenshots dans docs/screenshots/");
})();
