-- Maji Devis - Donnees initiales

INSERT INTO fournisseurs (id, nom, delai) VALUES
    ('rs',      'RS Components', '24-48h'),
    ('farnell', 'Farnell',       '24-48h'),
    ('mouser',  'Mouser',        '3-5j');

INSERT INTO catalogue (id, ref, nom, categorie, unite) VALUES
    ('SKF-6205',    'SKF 6205-2RS',     'Roulement a billes etanche',   'Mecanique',        'piece'),
    ('VIS-M8X40',   'DIN 912 M8x40',    'Vis CHC M8x40 inox A2',       'Visserie',         'lot de 100'),
    ('MOT-NEMA23',  'NEMA 23 2.8A',      'Moteur pas a pas NEMA 23',    'Electrique',       'piece'),
    ('JOINT-NBR50', 'NBR 50x62x6',       'Joint torique NBR 50mm',      'Etancheite',       'lot de 10'),
    ('TOLE-ALU2',   'AL 5052 2mm',       'Tole aluminium 2mm 1000x500', 'Matiere premiere', 'feuille'),
    ('CAP-470UF',   'EEUFR1V471',        'Condensateur 470uF 35V',      'Electronique',     'piece'),
    ('CABLE-4G2',   'H07RN-F 4G2.5',     'Cable souple 4G2.5mm2 (m)',   'Electrique',       'metre'),
    ('CAPT-PT100',  'PT100 Class A',     'Sonde temperature PT100',     'Capteur',          'piece'),
    ('ROUL-51105',  'SKF 51105',         'Butee a billes axiale',       'Mecanique',        'piece'),
    ('RELAIS-24V',  'G2R-1-E 24DC',      'Relais industriel 24V 16A',   'Electrique',       'piece');

INSERT INTO catalogue_prix (catalogue_id, fournisseur_id, prix, stock) VALUES
    ('SKF-6205',    'rs', 12.50, 1450),  ('SKF-6205',    'farnell', 11.80, 870),   ('SKF-6205',    'mouser', 12.10, 2300),
    ('VIS-M8X40',   'rs', 18.30, 5000),  ('VIS-M8X40',   'farnell', 17.90, 3200),  ('VIS-M8X40',   'mouser', 19.50, 8000),
    ('MOT-NEMA23',  'rs', 45.00, 120),   ('MOT-NEMA23',  'farnell', 42.50, 85),    ('MOT-NEMA23',  'mouser', 44.20, 200),
    ('JOINT-NBR50', 'rs', 8.20,  3000),  ('JOINT-NBR50', 'farnell', 7.90,  2100),  ('JOINT-NBR50', 'mouser', 8.50,  4500),
    ('TOLE-ALU2',   'rs', 35.00, 200),   ('TOLE-ALU2',   'farnell', 33.50, 150),   ('TOLE-ALU2',   'mouser', 36.80, 300),
    ('CAP-470UF',   'rs', 1.85,  12000), ('CAP-470UF',   'farnell', 1.72,  8500),  ('CAP-470UF',   'mouser', 1.90,  15000),
    ('CABLE-4G2',   'rs', 4.20,  5000),  ('CABLE-4G2',   'farnell', 3.95,  3000),  ('CABLE-4G2',   'mouser', 4.50,  7000),
    ('CAPT-PT100',  'rs', 28.50, 300),   ('CAPT-PT100',  'farnell', 26.80, 180),   ('CAPT-PT100',  'mouser', 29.00, 450),
    ('ROUL-51105',  'rs', 15.80, 800),   ('ROUL-51105',  'farnell', 14.90, 500),   ('ROUL-51105',  'mouser', 16.20, 1200),
    ('RELAIS-24V',  'rs', 9.40,  2000),  ('RELAIS-24V',  'farnell', 8.80,  1500),  ('RELAIS-24V',  'mouser', 9.70,  3500);

INSERT INTO historique_prix (catalogue_id, prix, mois) VALUES
    ('SKF-6205', 11.20, 1), ('SKF-6205', 11.50, 2), ('SKF-6205', 11.80, 3), ('SKF-6205', 12.00, 4), ('SKF-6205', 12.30, 5), ('SKF-6205', 12.50, 6),
    ('VIS-M8X40', 16.50, 1), ('VIS-M8X40', 17.00, 2), ('VIS-M8X40', 17.30, 3), ('VIS-M8X40', 17.80, 4), ('VIS-M8X40', 18.00, 5), ('VIS-M8X40', 18.30, 6),
    ('MOT-NEMA23', 40.00, 1), ('MOT-NEMA23', 41.50, 2), ('MOT-NEMA23', 42.00, 3), ('MOT-NEMA23', 43.00, 4), ('MOT-NEMA23', 44.00, 5), ('MOT-NEMA23', 45.00, 6),
    ('JOINT-NBR50', 7.20, 1), ('JOINT-NBR50', 7.50, 2), ('JOINT-NBR50', 7.80, 3), ('JOINT-NBR50', 7.90, 4), ('JOINT-NBR50', 8.00, 5), ('JOINT-NBR50', 8.20, 6),
    ('TOLE-ALU2', 30.00, 1), ('TOLE-ALU2', 31.50, 2), ('TOLE-ALU2', 32.00, 3), ('TOLE-ALU2', 33.00, 4), ('TOLE-ALU2', 34.00, 5), ('TOLE-ALU2', 35.00, 6);

INSERT INTO couts_production (type, label, taux_horaire) VALUES
    ('fraisage',   'Fraisage CNC',      65),
    ('tournage',   'Tournage CNC',      55),
    ('soudure',    'Soudure',           45),
    ('assemblage', 'Assemblage',        35),
    ('controle',   'Controle qualite',  40);

INSERT INTO grille_transport (poids_max, zone1, zone2, zone3) VALUES
    (5,   8.50,  12.00, 18.00),
    (20,  15.00, 22.00, 35.00),
    (100, 35.00, 55.00, 85.00),
    (500, 75.00, 120.00, 180.00);
