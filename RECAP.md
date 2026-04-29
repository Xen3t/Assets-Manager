# Assets Manager — Recap projet

> Document de référence interne. Résume les décisions prises avant le démarrage du développement.

---

## Vision

Outil interne centralisé permettant aux équipes infographie de gérer une bibliothèque d'assets (icônes, images). Phase initiale focalisée sur l'iconographie. L'outil doit permettre d'importer, taguer, classer, rechercher et exporter des assets, avec une gestion des rôles et un système de versioning.

---

## Stack technique

| Rôle | Technologie |
|---|---|
| Framework | Next.js (App Router) |
| Langage | TypeScript |
| Styles | Tailwind CSS v4 |
| Animations | Framer Motion |
| Composants | Radix UI |
| Base de données | SQLite (`better-sqlite3`) |
| Tests unitaires | Vitest + React Testing Library |
| Tests E2E | Playwright |
| Déploiement | PM2 sur serveur ORION (Windows) |
| Port | **3301** |

**Design system** : identique à HoorTRADS (Titillium Web, palette vert/rouge/teal, Tailwind v4 `@theme inline`, système octogonal 8px).

---

## Formats supportés

- SVG, PNG, ICO, EPS
- EPS/ICO nécessitent une conversion serveur (Ghostscript/ImageMagick) pour la preview — à installer sur ORION plus tard. En local : prévu dans l'architecture, installé quand disponible.
- Formats Adobe (AI, Figma) : prévu à terme, pas dans la Phase 1.

---

## Modèle de données

```
assets
  id, filename, filepath, filetype, hash, version, status, created_at, author

asset_metadata
  asset_id, brand, description, color, style

tags
  id, name

asset_tags
  asset_id, tag_id

asset_versions
  id, asset_id, version_number, filepath, created_at

brands
  CASANOOV | CAZEBOO | SICAAN  (liste fermée)
```

**Déduplication** : par hash du contenu fichier (résiste aux renommages).

**Statuts** : `active` / `archived` / `deleted` (soft delete → corbeille → purge auto 30 jours).

---

## Rôles & Auth

| Rôle | Droits |
|---|---|
| **Graphiste** | Import, édition métadonnées, curation, suppression, export |
| **Visiteur** | Recherche, visualisation, téléchargement |

Authentification : email + mot de passe (stocké en base, hashé).

---

## Fonctionnalités — Phase 1 (prioritaire)

### Bibliothèque
- Import d'assets (drag & drop ou sélection fichier)
- Preview inline : SVG/PNG natif navigateur, ICO via `sharp`, EPS via conversion serveur
- Métadonnées par asset : brand, description, couleur, style graphique, auteur (optionnel), date
- Tags : saisie libre au départ → harmonisation LLM à brancher plus tard (point d'extension prévu)
- Versioning : chaque mise à jour d'un asset crée une nouvelle version, l'historique est conservé

### Galerie & Recherche
- Vue grille avec preview des assets
- Filtres : brand, tag, format, style, statut
- Recherche full-text sur tags + description + nom

### Curation
- Actions par asset : garder (activer), archiver, supprimer
- Suppression = soft delete → corbeille → purge automatique après 30 jours
- Seuls les graphistes peuvent supprimer

### Export
- Téléchargement à l'unité (format natif)
- Téléchargement en lot (ZIP d'une sélection filtrée)

---

## Fonctionnalités — Phase 2 (usage tracking)

> Non prioritaire. À définir lors d'une prochaine session.

- Indiquer manuellement dans quels projets un asset est utilisé
- Affichage des usages sur la fiche de chaque asset

---

## Fonctionnalités — Phase 3 (scanner automatique)

- Scan de dossiers configurables (réseau + locaux)
- Détection d'assets par extension (SVG, PNG, ICO, EPS)
- Matching avec la bibliothèque existante par hash du contenu
- Workflow de déduplication : si même fichier trouvé à plusieurs endroits → même asset, interface de tri pour confirmer
- Standards de scan configurables (dossiers inclus/exclus, extensions)

---

## Points d'extension prévus (non développés en Phase 1)

- **LLM pour les tags** : endpoint pluggable pour normalisation automatique des tags (suppression doublons, enrichissement)
- **Preview EPS** : Ghostscript/ImageMagick côté serveur, activé quand installé sur ORION
- **Formats Adobe** : Illustrator, Figma — à cadrer plus tard
- **Usage tracking** : Phase 2

---

## Déploiement

- Serveur : ORION (Windows Server, réseau interne)
- Port : **3301**
- Gestionnaire : PM2 (`ecosystem.config.cjs` à la racine)
- Auth : requise, accès LAN uniquement
- Procédure complète : voir `baseDocs/DEPLOYMENT.md`

---

## Conventions de développement

Voir `baseDocs/STANDARDS.md` pour l'ensemble des conventions (TDD, commits Conventional Commits, ESLint/Prettier, structure de projet, etc.).

Rappels clés :
- Logique métier dans `src/lib/` uniquement, jamais dans les composants
- Tests unitaires obligatoires sur tout le code `src/lib/`
- Pas de `any` TypeScript sans justification commentée
- Commits en français, format `feat(scope): description`
- Branches : `main` → stable, `develop` → intégration, `feat/xxx` → fonctionnalités

---

*Dernière mise à jour : 2026-04-28*
