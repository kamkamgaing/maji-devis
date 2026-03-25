const cheerio = require("cheerio");
const { fetchPage, parsePrice, parseStock, delay } = require("./scraperUtils");

const BASE_URL = "https://www.mouser.fr";

class MouserScraper {
  constructor() {
    this.name = "mouser";
    this.enabled = true;
  }

  async searchByRef(ref) {
    try {
      const searchUrl = `${BASE_URL}/c/?q=${encodeURIComponent(ref)}`;
      const html = await fetchPage(searchUrl);
      const $ = cheerio.load(html);

      let prix = null;
      let stock = null;
      let nom = null;

      const priceSelectors = [
        "[data-testid='unit-price']",
        ".price .unit-price",
        "#ctl00_ContentMain_ucSearchResults .price",
        "td.PriceBreak",
        "[class*='price-col']",
        ".pdp-pricing .unit-price",
      ];
      for (const sel of priceSelectors) {
        const el = $(sel).first();
        if (el.length) { prix = parsePrice(el.text()); break; }
      }

      const stockSelectors = [
        "[data-testid='availability']",
        ".availability .value",
        "#ctl00_ContentMain_ucSearchResults .avail",
        ".pdp-product-availability",
        "[class*='avail'] [class*='stock']",
      ];
      for (const sel of stockSelectors) {
        const el = $(sel).first();
        if (el.length) { stock = parseStock(el.text()); break; }
      }

      const nameSelectors = [
        "[data-testid='product-desc']",
        ".product-desc",
        "#ctl00_ContentMain_ucSearchResults .desc a",
        ".pdp-product-description h1",
        "[class*='product-name']",
      ];
      for (const sel of nameSelectors) {
        const el = $(sel).first();
        if (el.length) { nom = el.text().trim(); break; }
      }

      if (prix == null) return null;

      await delay(2000 + Math.random() * 2000);

      return {
        fournisseur_id: "mouser",
        ref_fournisseur: ref,
        prix,
        stock,
        nom,
      };
    } catch (err) {
      console.error(`[Mouser Scraper] Erreur pour ${ref}:`, err.message);
      return null;
    }
  }
}

module.exports = MouserScraper;
