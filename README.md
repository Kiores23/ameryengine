# Portfolio statique

Ce projet est maintenant un site **React + Vite 100% statique**.

Le backend Django, Nginx, Docker Compose, Pixel Streaming, la base de donnees locale et le `Makefile` ont ete retires du repo pour garder un projet simple a builder et a heberger sur IONOS.

## Structure utile

- `frontend/` : application React/Vite
- `.env` : configuration de contact lue par Vite depuis la racine
- `.env.example` : exemple de configuration

## Configuration

Le front lit les variables depuis le `.env` racine via `envDir: ".."` dans [vite.config.js](/home/amery/Projects/porfolio/frontend/vite.config.js).

Variables disponibles :

- `VITE_CONTACT_EMAIL`
- `VITE_CONTACT_GITHUB_URL`
- `VITE_CONTACT_LINKEDIN_URL`
- `VITE_CONTACT_RESUME_URL`

Le formulaire de contact est maintenant statique : il ouvre un email pre-rempli via `mailto:` au lieu d'appeler une API.

## Developpement local

```bash
cd frontend
npm install
npm run dev
```

## Build de production

```bash
cd frontend
npm install
npm run build
```

Le build sort dans `frontend/dist/`.

Le projet utilise une base relative en production, donc il peut etre deploie a la racine d'un domaine IONOS ou dans un sous-dossier.

## Test local avec Nginx

Un Nginx minimal de test est fourni pour servir exactement le contenu de `frontend/dist/` via Docker.

Demarrage :

```bash
./scripts/serve-static-nginx.sh
```

Demarrage avec rebuild force :

```bash
REBUILD=1 ./scripts/serve-static-nginx.sh
```

Le site sera disponible sur `http://127.0.0.1:8080`.

Arret :

```bash
./scripts/stop-static-nginx.sh
```

La config Nginx utilisee se trouve dans [local-nginx/default.conf](/home/amery/Projects/porfolio/local-nginx/default.conf).

## Deploiement IONOS

1. Lance le build de production.
2. Supprime les anciens fichiers du site sur l'hebergement IONOS si besoin.
3. Uploade **le contenu** de `frontend/dist/` dans le dossier web cible, souvent `htdocs/`.
4. Verifie que `index.html`, `assets/`, `images/`, `models/`, `scenes/`, `cv.pdf` et `.htaccess` sont bien presents sur l'hebergement.

A uploader sur IONOS :

- le contenu de `frontend/dist/`
- donc typiquement `index.html`, le dossier `assets/`, les dossiers `images/`, `models/`, `scenes/`, le fichier `cv.pdf` et le fichier `.htaccess`

Ne pas uploader :

- `frontend/public/` tel quel
- `frontend/src/`
- `frontend/node_modules/`
- `frontend/.dist_root_stale/`

Le fichier [`.htaccess`](/home/amery/Projects/porfolio/frontend/public/.htaccess) ajoute les types MIME utiles pour les assets `.glb` et `.gltf`.

## Notes

- `frontend/public/index.html` a ete retire pour eviter un conflit avec [frontend/index.html](/home/amery/Projects/porfolio/frontend/index.html) lors du build Vite.
- `frontend/.dist_root_stale/` est un ancien build conserve a part; il ne sert pas au deploiement.
- Le dossier `infra/` n'est pas utilise par le build du site statique actuel.
