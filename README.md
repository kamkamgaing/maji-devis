# Maji Devis - Groupe Maji

Application de chiffrage et devis industriel avec detection d'anomalies IA.

## Architecture

```
groupmaji/
├── frontend/          # React + Vite
├── backend/           # Node.js + Express + PostgreSQL
├── db/init/           # Scripts SQL d'initialisation
├── docker-compose.yml # Orchestration des services
└── .env               # Variables d'environnement
```

## Demarrage rapide

### Prerequis
- Docker et Docker Compose installes
- Node.js 20+ (pour le dev local)

### Option 1 : Docker Compose (recommande)

```bash
docker compose up --build
```

Services :
- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:3001
- **PostgreSQL** : localhost:5432

### Option 2 : Developpement local

1. Lancer PostgreSQL via Docker :
```bash
docker compose up db
```

2. Installer et lancer le backend :
```bash
cd backend
npm install
npm run dev
```

3. Installer et lancer le frontend :
```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

| Methode | Route                        | Description                    |
|---------|------------------------------|--------------------------------|
| GET     | /api/health                  | Etat du serveur et de la DB    |
| GET     | /api/catalogue               | Liste du catalogue             |
| GET     | /api/catalogue/fournisseurs  | Liste des fournisseurs         |
| GET     | /api/catalogue/:id           | Detail d'un composant          |
| GET     | /api/devis                   | Liste des devis                |
| GET     | /api/devis/:id               | Detail d'un devis              |
| POST    | /api/devis                   | Creer un devis                 |
| PATCH   | /api/devis/:id/statut        | Changer le statut d'un devis   |
| DELETE  | /api/devis/:id               | Supprimer un devis             |
| POST    | /api/ia/anomalie             | Detecter une anomalie de prix  |
| GET     | /api/ia/suggestion/:id       | Suggestion de prix IA          |
| GET     | /api/ia/prompt/:id           | Generer un prompt LLM          |
| GET     | /api/transport/grille        | Grille de transport            |
| GET     | /api/transport/calculer      | Calculer le cout de transport  |
| GET     | /api/production              | Liste des couts de production  |
| GET     | /api/sync/status             | Etat des connexions fournisseurs |
| GET     | /api/sync/historique         | Historique des synchronisations |
| POST    | /api/sync/all                | Lancer la synchro de tous les fournisseurs |
| POST    | /api/sync/:fournisseurId     | Lancer la synchro d'un fournisseur |

## Connexion aux API fournisseurs

L'application peut se connecter aux API reelles des fournisseurs pour mettre a jour les prix et stocks automatiquement.

### Obtenir les cles API

| Fournisseur    | Portail developpeur                         |
|----------------|----------------------------------------------|
| RS Components  | https://developerportal.rs-online.com        |
| Farnell        | https://partner.element14.com                |
| Mouser         | https://www.mouser.com/api-search/           |

### Configurer les cles

Ajoutez vos cles dans le fichier `.env` :

```bash
RS_API_KEY=votre_cle_rs
FARNELL_API_KEY=votre_cle_farnell
MOUSER_API_KEY=votre_cle_mouser
```

La synchro automatique demarre au lancement du backend (toutes les 6h par defaut).
Vous pouvez aussi declencher une synchro manuelle depuis la page "Fournisseurs & Sync" de l'interface.

## Variables d'environnement (.env)

| Variable            | Defaut       | Description                       |
|---------------------|--------------|-----------------------------------|
| POSTGRES_USER       | maji         | Utilisateur DB                    |
| POSTGRES_PASSWORD   | maji_secret  | Mot de passe DB                   |
| POSTGRES_DB         | maji_devis   | Nom de la base                    |
| POSTGRES_HOST       | localhost    | Hote DB                           |
| POSTGRES_PORT       | 5432         | Port DB                           |
| BACKEND_PORT        | 3001         | Port de l'API                     |
| FRONTEND_PORT       | 5173         | Port du frontend                  |
| RS_API_KEY          |              | Cle API RS Components             |
| FARNELL_API_KEY     |              | Cle API Farnell / element14       |
| MOUSER_API_KEY      |              | Cle API Mouser                    |
| SYNC_INTERVAL_HOURS | 6            | Intervalle de synchro auto (heures)|
