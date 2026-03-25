const API_BASE = "https://api.mouser.com/api/v1";

class MouserClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.name = "mouser";
    this.enabled = !!apiKey;
  }

  async searchByRef(ref) {
    if (!this.enabled) return null;

    const res = await fetch(`${API_BASE}/search/partnumber?apiKey=${this.apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        SearchByPartRequest: {
          mouserPartNumber: ref,
          partSearchOptions: "1",
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Mouser API ${res.status}: ${text}`);
    }

    const data = await res.json();
    const parts = data.SearchResults?.Parts || [];
    if (!parts.length) return null;

    const part = parts[0];
    return {
      fournisseur_id: "mouser",
      ref_fournisseur: part.MouserPartNumber || ref,
      prix: this.extractPrix(part),
      stock: this.extractStock(part),
      nom: part.Description || null,
    };
  }

  extractPrix(part) {
    const rows = part.PriceBreaks || [];
    if (rows.length) {
      const first = rows[0];
      const raw = (first.Price || first.price || "0").replace(/[^0-9.,]/g, "").replace(",", ".");
      return parseFloat(raw) || null;
    }
    return null;
  }

  extractStock(part) {
    const raw = (part.Availability || "0").replace(/[^0-9]/g, "");
    return parseInt(raw) || null;
  }
}

module.exports = MouserClient;
