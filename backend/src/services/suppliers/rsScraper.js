const cheerio = require("cheerio");
const { fetchPage, parsePrice, parseStock, delay } = require("./scraperUtils");

const BASE_URL = "https://fr.rs-online.com";

class RSScraper {
  constructor() {
    this.name = "rs";
    this.enabled = true;
  }

  async searchByRef(ref) {
    try {
      const searchUrl = `${BASE_URL}/web/c/?searchTerm=${encodeURIComponent(ref)}`;
      const html = await fetchPage(searchUrl);
      const $ = cheerio.load(html);

      let prix = null;
      let stock = null;
      let nom = null;

      // Essayer plusieurs sélecteurs car le site peut changer
      const priceSelectors = [
        "[data-testid='price-each']",
        ".price-each",
        ".srpPrice",
        "[class*='price'] [class*='each']",
        ".cmpPrc",
        "[data-qa='price']",
      ];
      for (const sel of priceSelectors) {
        const el = $(sel).first();
        if (el.length) { prix = parsePrice(el.text()); break; }
      }

      const stockSelectors = [
        "[data-testid='stock-text']",
        ".stock-text",
        "[class*='stock'] [class*='amount']",
        ".inStockBay",
        "[data-qa='stock']",
      ];
      for (const sel of stockSelectors) {
        const el = $(sel).first();
        if (el.length) { stock = parseStock(el.text()); break; }
      }

      const nameSelectors = [
        "[data-testid='product-title']",
        ".product-title",
        "h1[class*='product']",
        ".srpDescription a",
        "[data-qa='product-title']",
      ];
      for (const sel of nameSelectors) {
        const el = $(sel).first();
        if (el.length) { nom = el.text().trim(); break; }
      }

      if (prix == null) return null;

      await delay(1500 + Math.random() * 1500);

      return {
        fournisseur_id: "rs",
        ref_fournisseur: ref,
        prix,
        stock,
        nom,
      };
    } catch (err) {
      console.error(`[RS Scraper] Erreur pour ${ref}:`, err.message);
      return null;
    }
  }
}

module.exports = RSScraper;
