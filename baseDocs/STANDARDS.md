# Guidelines de développement — Outils internes Infographie & Vidéo

> Ce document constitue la base commune à tous les projets d'outils internes.
> Il doit être intégré à la racine de chaque nouveau projet et respecté par l'ensemble des contributeurs.

---

## Table des matières

1. [Philosophie générale](#1-philosophie-générale)
2. [Stack technologique](#2-stack-technologique)
3. [Structure d'un projet](#3-structure-dun-projet)
4. [Méthodologie de développement — TDD](#4-méthodologie-de-développement--tdd)
5. [Conventions de code](#5-conventions-de-code)
6. [Intégration Adobe](#6-intégration-adobe)
7. [Gestion du code source](#7-gestion-du-code-source)
8. [Déploiement](#8-déploiement)
9. [Documentation](#9-documentation)
10. [Bonnes pratiques générales](#10-bonnes-pratiques-générales)

---

## 1. Philosophie générale

Les outils développés en interne ont pour vocation d'assister les équipes infographie et vidéo dans leurs tâches quotidiennes. Ces projets sont développés majoritairement par des profils juniors : la lisibilité, la simplicité et la maintenabilité du code priment sur la sophistication technique.

**Principes fondateurs :**

- **Clarté avant tout** — Un code compréhensible par un développeur junior est préférable à un code brillant mais opaque.
- **Cohérence** — Les mêmes conventions s'appliquent à tous les projets, quelle que soit leur taille.
- **Pas de sur-ingénierie** — On ne développe que ce dont on a besoin. On n'anticipe pas des besoins hypothétiques.
- **Testabilité** — Tout code métier doit pouvoir être testé de manière isolée.

---

## 2. Stack technologique

### Frontend / Interface web

| Rôle | Technologie |
|---|---|
| Framework | [Next.js](https://nextjs.org/) (App Router) |
| UI | React |
| Langage | TypeScript |
| Styles | Tailwind CSS (préféré) ou CSS Modules |
| Tests | Vitest + React Testing Library |
| Tests E2E | Playwright |

> **Pourquoi Next.js ?** Il offre une structure claire, un rendu hybride (SSR/SSG/client), et une large communauté. Il est adapté aussi bien aux petits outils qu'aux projets plus ambitieux.

### Backend / API

Si un outil nécessite une couche serveur :

| Rôle | Technologie |
|---|---|
| API | Next.js API Routes (par défaut) ou Express.js si projet découplé |
| Langage | TypeScript (Node.js) |
| Persistance | À définir selon le besoin (SQLite pour du local simple, PostgreSQL sinon) |

### Environnement cible

- **OS serveur** : Windows Server (déploiement natif, sans conteneur)
- **Runtime** : Node.js LTS (dernière version stable)
- **Gestionnaire de processus** : PM2

---

## 3. Structure d'un projet

Chaque projet doit respecter l'organisation suivante à sa racine :

```
mon-outil/
├── src/
│   ├── app/              # Pages et routes Next.js (App Router)
│   ├── components/       # Composants React réutilisables
│   ├── lib/              # Logique métier, utilitaires, helpers
│   ├── hooks/            # Hooks React personnalisés
│   └── types/            # Types et interfaces TypeScript partagés
├── tests/
│   ├── unit/             # Tests unitaires (Vitest)
│   └── e2e/              # Tests end-to-end (Playwright)
├── public/               # Fichiers statiques
├── .eslintrc.json        # Configuration ESLint
├── .prettierrc           # Configuration Prettier
├── vitest.config.ts      # Configuration Vitest
├── STANDARDS.md          # Ce document (copie du fichier de base)
├── README.md             # Documentation spécifique au projet
└── package.json
```

> **Règle** : La logique métier réside dans `src/lib/`. Les composants ne contiennent que de la logique d'affichage et d'interaction UI. Cette séparation est indispensable pour la testabilité.

---

## 4. Méthodologie de développement — TDD

Tous les projets adoptent le **Test-Driven Development (TDD)**. Cette approche est particulièrement importante dans un contexte junior car elle force à réfléchir au comportement attendu avant d'écrire le code.

### Le cycle Red → Green → Refactor

```
1. RED    — Écrire un test qui échoue (le comportement n'existe pas encore)
2. GREEN  — Écrire le minimum de code pour que le test passe
3. REFACTOR — Améliorer le code sans casser les tests
```

### Règles de base

- **Ne jamais merger du code métier sans tests associés.**
- Les tests doivent être écrits **avant** ou **en même temps** que le code, jamais après.
- Un test doit tester **un seul comportement** à la fois.
- Les noms de tests doivent décrire le comportement en langage naturel :
  ```ts
  // ✅ Bon
  it('retourne une erreur si le fichier source est introuvable', () => { ... })

  // ❌ Mauvais
  it('test erreur fichier', () => { ... })
  ```

### Ce qui doit être testé

| Type | Outil | Priorité |
|---|---|---|
| Logique métier (`src/lib/`) | Vitest | **Obligatoire** |
| Composants React | React Testing Library | Recommandé |
| Parcours utilisateur critiques | Playwright | Recommandé |

> **Note pour les débutants** : Si écrire le test avant vous semble difficile, commencez par décrire en commentaire ce que la fonction doit faire, puis écrivez le test à partir de cette description, puis implémentez.

---

## 5. Conventions de code

### Linter et formateur

Tous les projets utilisent **ESLint** et **Prettier** avec les configurations suivantes.

**`.prettierrc`**
```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2
}
```

**`.eslintrc.json`** (base)
```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "no-console": "warn",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "off"
  }
}
```

> Le formateur s'exécute automatiquement à chaque commit via un hook pre-commit (voir section Gestion du code source).

### TypeScript

- **Interdire `any`** sauf cas exceptionnel justifié par un commentaire.
- Préférer les `interface` aux `type` pour les objets, `type` pour les unions et les alias.
- Toujours typer les paramètres et retours des fonctions de `src/lib/`.

### Nommage

| Élément | Convention | Exemple |
|---|---|---|
| Composants React | PascalCase | `ExportPanel.tsx` |
| Fonctions / variables | camelCase | `parseLayerName()` |
| Constantes globales | SCREAMING_SNAKE_CASE | `MAX_FILE_SIZE` |
| Fichiers non-composants | kebab-case | `file-utils.ts` |
| Types / Interfaces | PascalCase | `ExportOptions` |

### Commits

Format obligatoire : **Conventional Commits**

```
<type>(<scope>): <description courte en français>

Types autorisés :
  feat     — nouvelle fonctionnalité
  fix      — correction de bug
  test     — ajout ou modification de tests
  refactor — refactorisation sans changement de comportement
  docs     — documentation uniquement
  chore    — tâches de maintenance (dépendances, config…)
```

Exemples :
```
feat(export): ajouter l'export PDF multi-pages
fix(photoshop): corriger le parsing des noms de calques avec accents
test(lib): ajouter les tests unitaires pour parseLayerName
```

---

## 6. Intégration Adobe

### Vue d'ensemble

Les outils interagissent avec la suite Adobe selon deux approches principales, qui peuvent coexister :

| Approche | Applications concernées | Maturité |
|---|---|---|
| **UXP** (Unified Extensibility Platform) | Photoshop, Premiere Pro, InDesign | Moderne, à privilégier |
| **Scripts** (ExtendScript / JSX) | After Effects, Illustrator, Lightroom | Hérité, encore nécessaire |

### UXP — Règles de développement

- Les plugins UXP sont développés en **TypeScript** avec l'[API UXP officielle](https://developer.adobe.com/photoshop/uxp/).
- Le code UXP spécifique à Adobe doit être **isolé** dans un module dédié (ex : `src/lib/adobe/`), jamais mélangé avec la logique métier générale.
- Toujours vérifier la **compatibilité de version** de l'API UXP ciblée, car cette plateforme est encore en évolution rapide.
- Les appels aux APIs Adobe sont asynchrones : utiliser systématiquement `async/await`.

```ts
// ✅ Bon — isolé et testable
// src/lib/adobe/photoshop.ts
export async function getActiveDocumentName(): Promise<string> {
  const doc = await require('photoshop').app.activeDocument
  return doc.name
}

// ❌ Mauvais — logique Adobe dans un composant
function MyPanel() {
  const handleClick = async () => {
    const doc = await require('photoshop').app.activeDocument
    // ...
  }
}
```

### Scripts (ExtendScript / JSX)

- Les scripts sont placés dans un dossier `scripts/` à la racine du projet concerné.
- Chaque script doit comporter un en-tête descriptif :

```js
/**
 * @description  Exporte tous les calques actifs en PNG
 * @target       Adobe Illustrator
 * @version      1.0.0
 * @author       [Nom]
 */
```

- Les scripts ne doivent pas contenir de logique métier complexe : ils sont des **déclencheurs**, la logique reste côté web ou dans des modules dédiés.

---

## 7. Gestion du code source

### Hébergement

Tout code de projet est hébergé sur **GitHub** (organisation interne).

### Modèle de branches

```
main        — branche de production, toujours stable et déployable
develop     — branche d'intégration, base pour les nouvelles features
feat/xxx    — branche de fonctionnalité (ex: feat/export-pdf)
fix/xxx     — branche de correction (ex: fix/parsing-accents)
```

**Règles :**
- On ne pousse jamais directement sur `main`.
- Toute modification passe par une **Pull Request** avec au moins une revue.
- Une PR ne peut être mergée que si **tous les tests passent**.

### Hooks Git (pre-commit)

Utiliser **Husky** + **lint-staged** pour automatiser les vérifications avant chaque commit :

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,css}": ["prettier --write"]
  }
}
```

### Pull Requests

Une PR doit contenir :
- Un titre au format Conventional Commits
- Une description courte de **ce qui change** et **pourquoi**
- Une mention des tests ajoutés ou modifiés

---

## 8. Déploiement

### Environnement cible

- **Serveur** : Windows Server (machine interne, non exposée à l'extérieur)
- **Runtime** : Node.js LTS installé sur le serveur
- **Gestionnaire de processus** : [PM2](https://pm2.keymetrics.io/)
- **Pas de Docker**, pas de virtualisation

### Procédure de déploiement

La procédure complète (premier déploiement, mise à jour, rollback, dépannage) est documentée dans [DEPLOYMENT.md](./DEPLOYMENT.md). Ce document est la source unique de vérité — ne pas la dupliquer dans les READMEs des projets.

### Configuration PM2

Un fichier `ecosystem.config.cjs` doit être présent à la racine de chaque projet.

> Utiliser l'extension **`.cjs`** (pas `.js`) : elle fonctionne même si `package.json` contient `"type": "module"`.

Template à copier : [ecosystem.config.example.cjs](./ecosystem.config.example.cjs).

> **Attention aux ports** : chaque outil déployé sur le serveur doit utiliser un port distinct, dans la plage attribuée au dev. Voir [DEPLOYMENT.md#ports-utilisés](./DEPLOYMENT.md#ports-utilisés).

### Variables d'environnement

- Les variables sensibles ou spécifiques à l'environnement sont définies dans un fichier `.env.local` **jamais commité**.
- Un fichier `.env.example` listant toutes les variables nécessaires (sans valeurs) **doit être commité**.

---

## 9. Documentation

### README.md obligatoire

Chaque projet doit avoir un `README.md` contenant au minimum :

```markdown
# Nom de l'outil

Courte description (1-2 phrases) de ce que fait l'outil et à qui il s'adresse.

## Prérequis
- Node.js >= X.X
- [Autres dépendances spécifiques]

## Installation
\`\`\`bash
npm install
\`\`\`

## Développement
\`\`\`bash
npm run dev
\`\`\`

## Tests
\`\`\`bash
npm test
\`\`\`

## Déploiement
Voir https://github.com/mediaHoor/hoortrade_project_base → `baseDocs/DEPLOYMENT.md` (source unique de vérité, ne pas dupliquer).

## Intégration Adobe
[Si applicable : quelles applications, quelle méthode (UXP/script)]
```

### Commentaires dans le code

- **Ne pas commenter le "quoi"** (le code le dit déjà) mais le **"pourquoi"**.
- Les fonctions complexes ou non-évidentes dans `src/lib/` doivent avoir un commentaire JSDoc.

```ts
// ❌ Mauvais commentaire
// Boucle sur les calques
for (const layer of layers) { ... }

// ✅ Bon commentaire
// Les calques masqués sont inclus volontairement : l'export PDF doit refléter
// l'état complet du document, pas seulement ce qui est visible à l'écran.
for (const layer of layers) { ... }
```

---

## 10. Bonnes pratiques générales

### Pour les développeurs juniors

- **Demander avant de refactoriser** : ne pas réécrire du code existant sans en discuter avec l'équipe.
- **Petites PR** : une PR = une fonctionnalité ou une correction. Les grandes PR sont difficiles à relire.
- **Ne pas hésiter à poser des questions** : un commentaire de clarification dans une PR vaut mieux qu'un malentendu en production.
- **Lire les tests existants** avant de modifier du code : ils documentent le comportement attendu.

### Sécurité (même en interne)

- Ne jamais stocker de mots de passe ou tokens en dur dans le code.
- Toujours utiliser des variables d'environnement pour les données de configuration sensibles.
- Valider et assainir toutes les entrées utilisateur, même sur un réseau interne.

### Performance

- Ne pas optimiser prématurément. Rendre le code correct et lisible d'abord.
- Si une opération sur un fichier Adobe est lente, la signaler par un retour visuel à l'utilisateur (loader, progress bar) plutôt que de bloquer l'interface.

### Gestion des erreurs

- Ne jamais laisser une erreur silencieuse (`catch` vide).
- Afficher des messages d'erreur **utiles** à l'utilisateur final (pas de stack traces brutes dans l'UI).
- Logger les erreurs côté serveur avec suffisamment de contexte pour pouvoir les reproduire.

---

*Document maintenu par l'équipe de développement interne. Toute modification doit faire l'objet d'une discussion et d'une PR dédiée sur le dépôt de référence.*
