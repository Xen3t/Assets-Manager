# Déploiement sur serveur Windows (ORION)

Guide générique : couvre les projets **Next.js** et **Node/Express** (purs ou avec un front Vite/React).

## Prérequis serveur

- Node.js LTS + Git dans le PATH
- PM2 global : `npm install -g pm2`
- PM2 autostart Windows : `npm install -g pm2-windows-startup`
- Accès SSH au serveur

## Identifier le type de projet

Regarder le `package.json` du projet :

| Type                   | Indice                     | Build nécessaire ?                                   | `script` PM2                      | Port via                |
| ---------------------- | -------------------------- | ---------------------------------------------------- | --------------------------------- | ----------------------- |
| **Next.js**            | `next` dans `dependencies` | oui (`npm run build`)                                | `node_modules/next/dist/bin/next` | `args: 'start -p PORT'` |
| **Node / Express pur** | `express`, pas de front    | non                                                  | `server.js`                       | `env.PORT`              |
| **Vite + Express**     | `express` + `vite`         | oui (`npm run build`, le dist est servi par Express) | `server.js`                       | `env.PORT`              |

---

## Premier déploiement

### 1. Cloner

Préférer une **deploy key SSH** (clé dédiée, read-only sur GitHub) :

```bash
cd C:\Users\orion.gpu\Documents\Projets
git clone git@github.com:NOM/NOM_DU_PROJET.git
cd NOM_DU_PROJET
```

> À défaut : HTTPS + credential helper Git.
> **Ne jamais** mettre le token dans l'URL (`https://user:token@...`) → il finit en clair dans `.git/config`.

### 2. Installer les dépendances

```bash
npm install
```

### 3. Variables d'environnement (si applicable)

Si le projet a un `.env.example`, le copier en `.env.local` et remplir les valeurs. Sinon, sauter.

### 4. Build (si applicable)

- **Next.js** ou **Vite+Express** : `npm run build`
- **Express pur** : rien à faire

### 5. Créer `ecosystem.config.cjs`

Copier `ecosystem.config.example.cjs` à la racine du projet sous le nom `ecosystem.config.cjs`, décommenter la variante (A ou B), renseigner `name` et le port.

> Utiliser **`.cjs`** (pas `.js`) : marche toujours, y compris si `package.json` a `"type": "module"`.

### 6. Lancer

```bash
pm2 start ecosystem.config.cjs
pm2 save
```

### 7. Autostart au reboot (obligatoire sur Windows)

Sans ça, l'app ne redémarre **pas** après un reboot serveur.

```bash
pm2-startup install
pm2 save
```

> Alternative plus robuste pour un serveur headless : `npm i -g pm2-windows-service` (installe PM2 comme vrai service Windows, démarre sans session ouverte).

### 8. Ouvrir le port dans le pare-feu (accès LAN)

PowerShell (Admin) :

```powershell
New-NetFirewallRule -DisplayName "NOM_DU_PROJET" -Direction Inbound -LocalPort PORT -Protocol TCP -Action Allow
```

### 9. Vérifier

```bash
pm2 status                            # status = online
pm2 logs NOM --lines 20 --nostream    # pas d'erreur au démarrage
curl http://localhost:PORT/           # l'app répond
```

---

## Mise à jour

```bash
cd C:\Users\orion.gpu\Documents\Projets\NOM_DU_PROJET
git pull
npm install
npm run build          # si applicable
pm2 restart NOM
```

Si `git pull` échoue à cause de modifs locales sur le serveur :

```bash
git fetch && git reset --hard origin/main   # ⚠️ jette toutes les modifs locales
```

---

## Rollback rapide

```bash
git log --oneline -5         # repérer le commit précédent stable
git checkout <sha>
npm install
npm run build                # si applicable
pm2 restart NOM
```

---

## Ports utilisés

### Plages réservées par utilisateur

Chaque dev a sa plage de 100 ports : plus besoin de se coordonner pour chaque nouveau projet, chacun a le contrôle total de sa plage.

| Plage       | Utilisateur |
| ----------- | ----------- |
| 3100 – 3199 | Thibaut     |
| 3200 – 3299 | Maxime      |
| 3300 – 3399 | Mathias     |

> Hors plages : `3000` et en dessous réservés aux services tiers. Éviter les ports < 3100 pour les projets internes.

### Projets actifs

Tenir cette table à jour à chaque déploiement :

| Port | Projet               | Owner   |
| ---- | -------------------- | ------  |
| 3200 | mediaHUB             | Maxime  |
| 3201 | studioRender         | Maxime  |
| 3202 | studioProxy          | Maxime  |
| 3203 | mediaProductsTracker | Maxime  |
| 3300 | HoorTRADS            | Mathias |
| …    | …                    | …       |

---

## Commandes PM2 utiles

| Commande                             | Description                           |
| ------------------------------------ | ------------------------------------- |
| `pm2 list`                           | Tous les process                      |
| `pm2 logs NOM`                       | Logs en direct                        |
| `pm2 logs NOM --lines 50 --nostream` | 50 dernières lignes                   |
| `pm2 restart NOM`                    | Redémarrer                            |
| `pm2 stop NOM`                       | Arrêter                               |
| `pm2 delete NOM`                     | Supprimer                             |
| `pm2 save`                           | Persister la liste (survit au reboot) |
| `pm2 monit`                          | Monitoring CPU/RAM                    |

> Si `pm2` n'est pas reconnu : préfixer par `npx ` ou voir _Dépannage_.

---

## Dépannage

### Crash en boucle

```bash
pm2 logs NOM --lines 30 --nostream
```

### Port déjà utilisé

```bash
netstat -ano | findstr :PORT
taskkill /PID LE_PID /F
```

### `pm2` non reconnu

```bash
npm config get prefix
setx /M PATH "%PATH%;CHEMIN_RETOURNE"
```

Redémarrer la session SSH après.

### `git` non reconnu

```bash
setx /M PATH "%PATH%;C:\Program Files\Git\bin"
```

Redémarrer la session SSH après.

### `ReferenceError: module is not defined` au `pm2 start`

Le fichier s'appelle `ecosystem.config.js` alors que `package.json` a `"type": "module"` → renommer en **`.cjs`**.
