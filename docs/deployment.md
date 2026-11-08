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
