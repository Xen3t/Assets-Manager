# Assets Manager

Bibliothèque interne de gestion d'assets graphiques (icônes, images) pour les équipes infographie HoorTrade.

## Prérequis

- Node.js >= 22 (LTS)
- npm >= 10

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
# → http://localhost:3301
```

## Tests

```bash
npm test           # unitaires (Vitest)
npm run test:e2e   # end-to-end (Playwright)
```

## Build

```bash
npm run build
```

## Déploiement

Voir https://github.com/mediaHoor/hoortrade_project_base → `baseDocs/DEPLOYMENT.md`

Port : **3301** — PM2 : `pm2 start ecosystem.config.cjs`

## Variables d'environnement

Copier `.env.example` → `.env.local` et renseigner les valeurs.
