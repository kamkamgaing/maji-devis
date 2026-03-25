-- Table de suivi des synchronisations fournisseurs

CREATE TABLE IF NOT EXISTS sync_log (
    id             SERIAL PRIMARY KEY,
    fournisseur_id VARCHAR(20) REFERENCES fournisseurs(id),
    statut         VARCHAR(20) NOT NULL DEFAULT 'en_cours',
    produits_maj   INTEGER DEFAULT 0,
    erreurs        INTEGER DEFAULT 0,
    detail         TEXT,
    started_at     TIMESTAMP DEFAULT NOW(),
    finished_at    TIMESTAMP
);

CREATE INDEX idx_sync_log_fournisseur ON sync_log(fournisseur_id);
CREATE INDEX idx_sync_log_started ON sync_log(started_at DESC);

-- Colonne pour tracer la derniere mise a jour sur catalogue_prix
ALTER TABLE catalogue_prix ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE catalogue_prix ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'seed';
