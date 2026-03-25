const API_BASE = "https://api.element14.com/catalog/products";

class FarnellClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.name = "farnell";
    this.enabled = !!apiKey;
  }

  async searchByRef(ref) {
    if (!this.enabled) return null;

    const params = new URLSearchParams({
      term: `manuPartNum:${ref}`,
      storeInfo: "fr.farnell.com",
      resultsSettings: "ro=1&of=0&fetchBlock=1",
      callInfo: `callRelatedType=orderCode&callRef=${Date.now()}`,
      apiKey: this.apiKey,
      responseDataType: "JSON",
    });

    const res = await fetch(`${API_BASE}?${params}`, {
      headers: { "Accept": "application/json" },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Farnell API ${res.status}: ${text}`);
    }

    const data = await res.json();
    const results = data.manufacturerPartNumberSearchReturn?.products || [];
    if (!results.length) return null;

    const product = results[0];
    return {
      fournisseur_id: "farnell",
      ref_fournisseur: product.sku || ref,
      prix: this.extractPrix(product),
      stock: this.extractStock(product),
      nom: product.displayName || null,
    };
  }

  extractPrix(product) {
    const prices = product.prices || [];
    if (prices.length) {
      const p = prices.find((p) => p.from === 1) || prices[0];
      return parseFloat(p.cost || p.price || 0);
    }
    return null;
  }

  extractStock(product) {
    if (product.stock?.level != null) return parseInt(product.stock.level);
    if (product.inv != null) return parseInt(product.inv);
    return null;
  }
}

module.exports = FarnellClient;
