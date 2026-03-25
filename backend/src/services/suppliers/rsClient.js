const API_BASE = "https://api.rs-online.com/product/v1";

class RSClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.name = "rs";
    this.enabled = !!apiKey;
  }

  async searchByRef(ref) {
    if (!this.enabled) return null;

    const res = await fetch(`${API_BASE}/products?searchTerm=${encodeURIComponent(ref)}`, {
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Accept": "application/json",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`RS API ${res.status}: ${text}`);
    }

    const data = await res.json();
    const products = data.products || data.data || [];
    if (!products.length) return null;

    const product = products[0];
    return {
      fournisseur_id: "rs",
      ref_fournisseur: product.stockNumber || product.rsStockNumber || ref,
      prix: this.extractPrix(product),
      stock: this.extractStock(product),
      nom: product.title || product.productName || null,
    };
  }

  extractPrix(product) {
    if (product.pricing?.unitPrice) return parseFloat(product.pricing.unitPrice);
    if (product.prices?.length) return parseFloat(product.prices[0].unitPrice || product.prices[0].price);
    if (product.unitPrice) return parseFloat(product.unitPrice);
    return null;
  }

  extractStock(product) {
    if (product.stockAvailability?.stockLevel != null) return parseInt(product.stockAvailability.stockLevel);
    if (product.stock != null) return parseInt(product.stock);
    if (product.availability?.stock != null) return parseInt(product.availability.stock);
    return null;
  }
}

module.exports = RSClient;
