const API_BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Erreur serveur");
  }
  return res.json();
}

export const catalogueApi = {
  search: (search = "") => request(`/catalogue?search=${encodeURIComponent(search)}`),
  getById: (id) => request(`/catalogue/${id}`),
  getFournisseurs: () => request("/catalogue/fournisseurs"),
};

export const devisApi = {
  list: () => request("/devis"),
  getById: (id) => request(`/devis/${id}`),
  create: (data) => request("/devis", { method: "POST", body: JSON.stringify(data) }),
  updateStatut: (id, statut) =>
    request(`/devis/${id}/statut`, { method: "PATCH", body: JSON.stringify({ statut }) }),
  remove: (id) => request(`/devis/${id}`, { method: "DELETE" }),
};

export const iaApi = {
  checkAnomalie: (catalogue_id, prix) =>
    request("/ia/anomalie", { method: "POST", body: JSON.stringify({ catalogue_id, prix }) }),
  getSuggestion: (catalogueId) => request(`/ia/suggestion/${catalogueId}`),
  getPrompt: (catalogueId) => request(`/ia/prompt/${catalogueId}`),
};

export const transportApi = {
  getGrille: () => request("/transport/grille"),
  calculer: (poids, zone) => request(`/transport/calculer?poids=${poids}&zone=${zone}`),
};

export const productionApi = {
  list: () => request("/production"),
};

export const syncApi = {
  status: () => request("/sync/status"),
  historique: () => request("/sync/historique"),
  syncAll: () => request("/sync/all", { method: "POST" }),
  syncOne: (fournisseurId) => request(`/sync/${fournisseurId}`, { method: "POST" }),
};
