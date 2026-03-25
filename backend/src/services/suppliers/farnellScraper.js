const cheerio = require("cheerio");
const { fetchPage, parsePrice, parseStock, delay } = require("./scraperUtils");

const BASE_URL = "https://fr.farnell.com";

class FarnellScraper {
  constructor() {
    this.name = "farnell";
    this.enabled = true;
  }

  async searchByRef(ref) {
    try {
      const searchUrl = `${BASE_URL}/search?st=${encodeURIComponent(ref)}`;
      const html = await fetchPage(searchUrl);
      const $ = cheerio.load(html);

      let prix = null;
      let stock = null;
      let nom = null;

      const priceSelectors = [
        "[data-testid='unit-price']",
        ".price .value",
        ".productPrice",
        "[class*='price'] .unit",
        "td[class*='price']",
        "[data-price]",
      ];
      for (const sel of priceSelectors) {
        const el = $(sel).first();
        if (el.length) {
          prix = parsePrice(el.attr("data-price") || el.text());
          break;
        }
      }

      const stockSelectors = [
        "[data-testid='stock-status']",
        ".availabilityHeading .value",
        ".stockStatus",
        "[class*='stock'] .qty",
        "[class*='avail'] [class*='qty']",
      ];
      for (const sel of stockSelectors) {
        const el = $(sel).first();
        if (el.length) { stock = parseStock(el.text()); break; }
      }

      const nameSelectors = [
        "[data-testid='product-description']",
        ".productDescription",
        "h1.product-title",
        ".partDescription a",
        "[data-qa='product-desc']",
      ];
      for (const sel of nameSelectors) {
        const el = $(sel).first();
        if (el.length) { nom = el.text().trim(); break; }
      }

      if (prix == null) return null;

      await delay(1500 + Math.random() * 1500);

      return {
        fournisseur_id: "farnell",
        ref_fournisseur: ref,
        prix,
        stock,
        nom,
      };
    } catch (err) {
      console.error(`[Farnell Scraper] Erreur pour ${ref}:`, err.message);
      return null;
    }
  }
}

module.exports = FarnellScraper;
