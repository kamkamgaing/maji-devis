-- Maji Devis - Schema de base de donnees

CREATE TABLE IF NOT EXISTS fournisseurs (
    id   VARCHAR(20) PRIMARY KEY,
    nom  VARCHAR(100) NOT NULL,
    delai VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS catalogue (
    id        VARCHAR(30) PRIMARY KEY,
    ref       VARCHAR(50) NOT NULL,
    nom       VARCHAR(150) NOT NULL,
    categorie VARCHAR(50),
    unite     VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS catalogue_prix (
    catalogue_id   VARCHAR(30) REFERENCES catalogue(id),
    fournisseur_id VARCHAR(20) REFERENCES fournisseurs(id),
    prix           NUMERIC(10,2) NOT NULL,
    stock          INTEGER DEFAULT 0,
    PRIMARY KEY (catalogue_id, fournisseur_id)
);

CREATE TABLE IF NOT EXISTS historique_prix (
    id           SERIAL PRIMARY KEY,
    catalogue_id VARCHAR(30) REFERENCES catalogue(id),
    prix         NUMERIC(10,2) NOT NULL,
    mois         INTEGER NOT NULL,
    created_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS couts_production (
    type         VARCHAR(30) PRIMARY KEY,
    label        VARCHAR(80) NOT NULL,
    taux_horaire NUMERIC(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS grille_transport (
    id        SERIAL PRIMARY KEY,
    poids_max NUMERIC(10,2) NOT NULL,
    zone1     NUMERIC(10,2) NOT NULL,
    zone2     NUMERIC(10,2) NOT NULL,
    zone3     NUMERIC(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS devis (
    id                SERIAL PRIMARY KEY,
    reference         VARCHAR(30) UNIQUE NOT NULL,
    client            VARCHAR(150) NOT NULL,
    projet            VARCHAR(150),
    zone              VARCHAR(10) DEFAULT 'zone1',
    poids_estime      NUMERIC(10,2) DEFAULT 5,
    marge             NUMERIC(5,2) DEFAULT 15,
    total_composants  NUMERIC(12,2) DEFAULT 0,
    total_production  NUMERIC(12,2) DEFAULT 0,
    transport         NUMERIC(12,2) DEFAULT 0,
    montant_marge     NUMERIC(12,2) DEFAULT 0,
    total             NUMERIC(12,2) DEFAULT 0,
    statut            VARCHAR(20) DEFAULT 'brouillon',
    created_at        TIMESTAMP DEFAULT NOW(),
    updated_at        TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS devis_lignes (
    id           SERIAL PRIMARY KEY,
    devis_id     INTEGER REFERENCES devis(id) ON DELETE CASCADE,
    catalogue_id VARCHAR(30) REFERENCES catalogue(id),
    quantite     INTEGER NOT NULL DEFAULT 1,
    prix_retenu  NUMERIC(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS devis_production (
    id       SERIAL PRIMARY KEY,
    devis_id INTEGER REFERENCES devis(id) ON DELETE CASCADE,
    type     VARCHAR(30) REFERENCES couts_production(type),
    heures   NUMERIC(6,2) NOT NULL DEFAULT 1
);
