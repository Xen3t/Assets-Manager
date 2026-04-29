# hoortrade_project_base

Documentation opérationnelle **partagée** entre tous les projets HoorTrade.
C'est la **source unique de vérité** pour les conventions de déploiement, ports, procédures PM2, etc.

## Contenu

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** — procédure de déploiement sur le serveur ORION (PM2, Windows)
- **[ecosystem.config.example.cjs](./ecosystem.config.example.cjs)** — template PM2 à copier dans chaque projet

## Règle d'or

Les projets individuels **ne dupliquent pas** ce contenu. Dans leur README, ils pointent simplement vers ce repo :

> Déploiement : voir https://github.com/mediaHoor/hoortrade_project_base

Comme ça, une modif ici (nouveau port, correction de procédure…) est **instantanément visible** par tout le monde, sans toucher aux autres projets.

## Édition

- **Via le web** (le plus simple) : ouvrir le fichier sur github.com → cliquer sur le crayon → modifier → commit. Pas besoin de cloner.
- **En local** : `git clone`, modifier, `git push`.

Message de commit explicite, ex : `docs: ajoute port 3205 pour projet-X`.

## Plages de ports par dev

| Plage       | Utilisateur |
|-------------|-------------|
| 3100 – 3199 | Thibaut     |
| 3200 – 3299 | Maxime      |
| 3300 – 3399 | Mathias     |

Détail complet des ports alloués : voir [DEPLOYMENT.md](./DEPLOYMENT.md#ports-utilisés).
# hoortrade_project_base
