# TGS Saudi Website

Modern bilingual (EN/AR) marketing site for **TGS Saudi** — a Riyadh-based professional services firm in the TGS global network.

## Stack

- Vite + React + TypeScript
- React Router
- Custom CSS design system (no UI kit)

## Pages

- **Home** — brand hero, featured services, about, stats, CTA
- **Services** — full service catalogue with details
- **About** — firm story, vision, values
- **Contact** — office details + inquiry form (mailto)

## Run locally

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
npm run preview
```

## GitHub Pages (github.io)

**https://fearschism.github.io/CLK0/**

The built site is already on the `gh-pages` branch. Enable it once:

1. Open **Settings → Pages**
2. Set **Source** to **Deploy from a branch**
3. Branch: **`gh-pages`** / folder: **`/`**
4. Save — the site goes live at the URL above

Optional: after merge, use **GitHub Actions** as the Pages source with `.github/workflows/deploy-pages.yml`.

## Design notes

- Forest green + sand palette (professional KSA feel)
- Display type: Cormorant Garamond · Body: Manrope
- Language toggle switches EN/AR and RTL layout
