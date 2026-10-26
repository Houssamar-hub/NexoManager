# NexoManager — Multi-Tenant SaaS pour Centres Pédagogiques & Soutien Scolaire

NexoManager est une plateforme SaaS multi-tenant professionnelle, robuste et sécurisée conçue pour les directeurs et gestionnaires de centres d'apprentissage, d'instituts de soutien scolaire et d'organismes de tutorat privé.

---

## 🎯 Fonctionnalités Clés

- **Isolation Multi-Tenant Stricte** : Chaque centre d'apprentissage dispose d'un espace complètement isolé. Un centre ne peut en aucun cas accéder aux élèves, groupes, finances ou professeurs d'un autre centre (`center: req.user.center`).
- **Contrôle d'Accès par Rôles (RBAC)** :
  - **Administrateur** : Gestion totale du centre, des utilisateurs, configuration et rapports financiers.
  - **Responsable Pédagogique (Manager)** : Gestion des inscriptions, des groupes, des relevés de présence et des encaissements.
  - **Professeur** : Consultation de ses groupes attribués et saisie des présences en temps réel.
- **Gestion des Élèves & Dossiers** : Fiches détaillées, contacts des tuteurs légaux, niveaux scolaires, filtres dynamiques, pagination et protection contre les suppressions orphelines.
- **Gestion des Groupes & Plannings** : Attribution des professeurs, vérification de capacité maximale, validation d'horaires (`startTime < endTime`), et gestion de promotions.
- **Gestion des Présences en Lot (Bulk Attendance)** : Feuille d'appel interactive par séance, gestion des statuts (*Présent*, *Absent*, *En retard*, *Excusé*) avec calcul automatique des taux d'assiduité.
- **Gestion Financière & Suivi des Impayés** : Enregistrement des règlements (Espèces, Virement, Carte), gestion des acomptes/paiements partiels, détection dynamique des retards et alertes automatiques.
- **Rapports & Exports Professionnels** :
  - Export Excel (.xlsx) stylisé des listes d'élèves et du grand livre financier (ExcelJS).
  - Génération de relevés et reçus PDF (PDFKit).
- **Tableau de Bord Analytique avec Données Réelles** : Métriques calculées directement sur MongoDB (Chiffre d'affaires mensuel, taux d'assiduité, effectifs actifs, alertes d'impayés, graphiques Recharts).

---

## 🛠️ Stack Technologique

### Backend
- **Runtime** : Node.js (ES Modules)
- **Framework** : Express.js 5
- **Base de données** : MongoDB avec Mongoose ODM (Indexes optimisés et filtrage multi-tenant)
- **Sécurité** : JWT (JSON Web Tokens), `bcryptjs`, `helmet`, CORS avec liste blanche d'origines
- **Validation** : Schémas stricts Joi (`joi`) pour l'ensemble des routes
- **Exports & Documents** : `exceljs`, `pdfkit`
- **Tâches Planifiées** : `node-cron` pour les alertes de retard et de relance

### Frontend
- **Framework** : React 18 avec TypeScript
- **Bundler** : Vite 5 (avec découpage manuel des chunks en production : react-core, charts, icons)
- **Routage** : React Router DOM 6 avec gardes d'authentification et de rôles
- **Design System** : Tailwind CSS avec palette éducative moderne (Indigo/Bleu/Gris ardoise)
- **Visualisation de Données** : Recharts
- **Iconographie** : Lucide React
- **Client HTTP** : Axios avec intercepteur JWT automatique et redirection 401

---

## 🚀 Démarrage Rapide

### Prérequis
- Node.js >= 18.x
- MongoDB (Atlas ou instance locale `mongodb://127.0.0.1:27017/nexomanager`)

### 1. Installation des dépendances

```bash
# À la racine du projet
npm install --prefix backend
npm install --prefix client
```

### 2. Configuration des variables d'environnement

Copiez le fichier `.env.example` vers `backend/.env` :

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/nexomanager
JWT_SECRET=votre_cle_secrete_jwt_super_longue_et_aleatoire
JWT_EXPIRES_IN=7d
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
CLIENT_URL=http://localhost:5173
```

### 3. Initialisation des Données de Démonstration (Seeding)

Pour alimenter la base avec un centre éducatif complet (élèves, groupes, présences passées, factures et notifications réelles) :

```bash
npm run seed --prefix backend
```

**Comptes créés :**
| Rôle | Email | Mot de passe |
|---|---|---|
| **Administrateur** | `admin@excellence.edu` | `AdminPass123!` |
| **Responsable** | `manager@excellence.edu` | `ManagerPass123!` |
| **Professeur Maths** | `prof.maths@excellence.edu` | `TeacherPass123!` |
| **Professeur Physique** | `prof.physique@excellence.edu` | `TeacherPass123!` |

### 4. Lancement en Développement

```bash
# Terminal 1 - Backend API (Port 5000)
npm run dev --prefix backend

# Terminal 2 - Frontend Client (Port 5173)
npm run dev --prefix client
```

Ouvrez ensuite [http://localhost:5173](http://localhost:5173) dans votre navigateur.

---

## 🧪 Tests Automatisés

Le projet comprend une suite complète de tests unitaires et d'intégration couvrant :
- L'intégrité de l'authentification et des en-têtes de sécurité
- Le blocage 401 sur l'ensemble des routes protégées
- Le rejet 400 des payloads invalides via Joi
- Le calcul des soldes financiers et taux de recouvrement
- Les formules d'assiduité et la génération des clés de déduplication de notifications

```bash
# Exécution de la suite de tests
npm test --prefix backend
```

---

## 🐳 Déploiement Conteneurisé avec Docker

Le projet intègre un `Dockerfile` optimisé pour le backend, un `Dockerfile` multi-stage avec serveur Nginx pour le frontend, et un `docker-compose.yml` complet.

```bash
# Lancement de l'ensemble de l'infrastructure
docker-compose up --build -d
```

Services démarrés :
- `mongodb` : Base de données MongoDB 7.0 (Port 27017)
- `backend` : API REST Express 5 (Port 5000)
- `client` : Application React servie par Nginx avec reverse-proxy API (Port 80)

---

## 📁 Structure du Projet

```
NexoManager/
├── backend/
│   ├── src/
│   │   ├── config/          # Connexion MongoDB
│   │   ├── controllers/     # Contrôleurs REST (Auth, Students, Teachers, Groups, Attendance, Payments, Dashboard, Reports, Notifications)
│   │   ├── middleware/      # Auth JWT, Role Guard, Validation Joi
│   │   ├── models/          # Modèles Mongoose avec indexes multi-tenant
│   │   ├── routes/          # Définitions des routes API
│   │   ├── services/        # Services métiers (Notifications, exports)
│   │   ├── utils/           # Script de seed, fonctions d'aide
│   │   ├── validators/      # Schémas de validation Joi
│   │   └── server.js        # Point d'entrée de l'application
│   ├── tests/               # Tests automatisés (Node test runner)
│   ├── Dockerfile
│   └── package.json
├── client/
│   ├── src/
│   │   ├── api/             # Client Axios centralisé
│   │   ├── components/      # Composants réutilisables (Tableaux, Modales, Badges, KPI, Pagination)
│   │   ├── context/         # AuthContext & NotificationContext
│   │   ├── layouts/         # DashboardLayout (Sidebar, Navbar, Menu mobile)
│   │   ├── pages/           # Pages de l'application (Dashboard, Élèves, Profs, Groupes, Présences, Paiements, Rapports, Paramètres)
│   │   ├── routes/          # AppRoutes avec gardes d'accès
│   │   ├── styles/          # Tailwind directives
│   │   ├── types/           # Définitions TypeScript
│   │   ├── utils/           # Formatage de devises, dates et statuts
│   │   ├── App.tsx          # Racine de l'application
│   │   └── main.tsx         # Point de montage DOM
│   ├── nginx.conf           # Configuration Nginx SPA + Reverse Proxy
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml       # Orchestration complète en un clic
├── .env.example
├── package.json             # Scripts racine
└── README.md
```

---

## 🔒 Sécurité et Isolation des Données

1. **Isolation stricte par centre** : Chaque modèle Mongoose intègre une référence obligatoire `center`. Toutes les requêtes `find`, `findOne`, `create`, `update`, `delete`, `aggregate` filtrent explicitement sur `req.user.center`.
2. **Authentification robuste** : Tokens JWT signés, mots de passe hashés avec bcrypt (facteur de coût 10), mots de passe exclus par défaut des requêtes (`select: false`).
3. **Validation stricte en amont** : Tout corps ou paramètre de requête est validé par un schéma Joi strict avant d'atteindre les contrôleurs.
4. **En-têtes de sécurité** : `helmet` actif pour la protection contre le clickjacking, sniffing de MIME, et attaques XSS.
5. **Gestion saine des erreurs** : Aucune trace d'erreur sensible ni identifiant interne n'est renvoyé aux clients en production.
