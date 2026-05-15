## Docs site (Astro)

The documentation site lives in `docs/` and is deployed to GitHub Pages via `.github/workflows/deploy.yml`.

### Local dev

```sh
cd docs
npm install
npm run dev
```

### GitHub Pages base path

This repository is deployed as a project page under `https://te9no.github.io/NarehatePlayground/`, so `docs/astro.config.mjs` reads:

- `PUBLIC_SITE` (default: `https://te9no.github.io`) - the Pages origin, with no path.
- `PUBLIC_BASE` (default: `/NarehatePlayground`) - the Pages subpath.

The workflow sets these env vars during the build step.
