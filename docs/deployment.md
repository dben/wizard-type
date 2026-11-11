# Deployment

The game is a static site on GitHub Pages: https://dben.github.io/wizard-type/

## CI

`.github/workflows/deploy.yml` runs on every push and pull request:

1. `npm ci`
2. `npm run typecheck`
3. `npm test`
4. `npm run build`

On `main` it uploads `dist/` and deploys it to Pages.

## One-time setup

In the GitHub repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Base path

Vite builds with `base: '/wizard-type/'` (`vite.config.ts`), and sprites load from `${import.meta.env.BASE_URL}sprites/…`. If the repo is renamed or moved to a custom domain, change `base` to match.

## Local preview of the production build

```bash
npm run build
npm run preview   # http://localhost:4173/wizard-type/
```

## Installable app

`public/manifest.webmanifest` plus `public/icons/` (the favicon scaled up with nearest-neighbor) make the site installable as a desktop app in Chrome and Edge.

- `src/app/install.ts` catches `beforeinstallprompt` and shows an **Install app** button on the wizard-pick screen. The button only appears when the browser offers an install, so it is hidden in Firefox, Safari and the installed app itself.
- Safari on Mac can still install the game with **File → Add to Dock**.
- There is no service worker, so the installed app needs a connection to load.
- Manifest paths are relative, so they follow the `base` path.
