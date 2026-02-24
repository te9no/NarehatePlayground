## Docs site (Astro + Starlight)

The documentation site lives in `docs/` and is deployed to GitHub Pages via `.github/workflows/deploy.yml`.

### Local dev

```sh
cd docs
npm install
npm run dev
```

### GitHub Pages base path

This site is published under a subpath, so `docs/astro.config.mjs` reads:

- `PUBLIC_SITE` (default: `https://te9no.github.io`) — must be an origin (no path)
- `PUBLIC_BASE` (default: `/NarehatePlayground`) — the Pages subpath

The workflow sets these env vars during the build step.
